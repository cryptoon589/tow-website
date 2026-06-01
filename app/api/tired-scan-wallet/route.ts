import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidXrplWallet } from "@/lib/towProof";

export const dynamic = "force-dynamic";

type SyncEvent = {
  walletAddress: string;
  txHash: string;
  eventType: "buy" | "sell" | "transfer_in" | "transfer_out";
  xrpValue: number;
  towAmount: number;
  counterparty?: string | null;
  ledgerIndex?: number;
  eventAt?: string;
  rawEvent?: unknown;
};

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  return createClient(url, key);
}

function requireAdmin(request: Request) {
  const expected = process.env.TOW_SYNC_SECRET;

  if (!expected) {
    throw new Error("Missing TOW_SYNC_SECRET env var");
  }

  return (
    request.headers.get("x-tow-sync-secret") === expected
  );
}

function getBaseUrl(request: NextRequest) {
  const configured = process.env.TOW_WEBSITE_URL;

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const proto =
    request.headers.get("x-forwarded-proto") ?? "https";

  const host = request.headers.get("host");

  return `${proto}://${host}`;
}

function dropsToXrp(drops: unknown) {
  const value = Number(drops ?? 0);

  if (!Number.isFinite(value)) return 0;

  return value / 1_000_000;
}

function cleanNumber(value: unknown) {
  const numberValue = Number(value ?? 0);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function normalizeCurrency(value: unknown) {
  const raw = String(value ?? "").trim();

  if (!raw) return "";

  // XRPL sometimes stores non-standard currency codes as 160-bit hex.
  if (/^[A-Fa-f0-9]{40}$/.test(raw)) {
    try {
      const bytes =
        raw.match(/.{1,2}/g)?.map((hex) =>
          parseInt(hex, 16)
        ) ?? [];

      const decoded = String.fromCharCode(...bytes)
        .replace(/\0/g, "")
        .trim();

      return decoded || raw.toUpperCase();
    } catch {
      return raw.toUpperCase();
    }
  }

  return raw.toUpperCase();
}

function currenciesMatch(a: unknown, b: unknown) {
  return normalizeCurrency(a) === normalizeCurrency(b);
}

function getNodeFields(node: any) {
  return (
    node?.ModifiedNode ??
    node?.CreatedNode ??
    node?.DeletedNode ??
    null
  );
}

function getLedgerEntryType(node: any) {
  const wrapper = getNodeFields(node);

  return wrapper?.LedgerEntryType;
}

function getFinalFields(node: any) {
  const wrapper = getNodeFields(node);

  return (
    wrapper?.FinalFields ??
    wrapper?.NewFields ??
    null
  );
}

function getPreviousFields(node: any) {
  const wrapper = getNodeFields(node);

  return wrapper?.PreviousFields ?? null;
}

function getRippleStateWalletBalance(
  fields: any,
  walletAddress: string,
  issuerAddress: string,
  currencyCode: string
) {
  if (!fields?.Balance) return null;

  const lowIssuer = String(
    fields?.LowLimit?.issuer ?? ""
  );

  const highIssuer = String(
    fields?.HighLimit?.issuer ?? ""
  );

  const balanceCurrency =
    fields?.Balance?.currency ??
    fields?.LowLimit?.currency ??
    fields?.HighLimit?.currency;

  if (!currenciesMatch(balanceCurrency, currencyCode)) {
    return null;
  }

  const involvesWallet =
    lowIssuer === walletAddress ||
    highIssuer === walletAddress;

  const involvesIssuer =
    lowIssuer === issuerAddress ||
    highIssuer === issuerAddress;

  if (!involvesWallet || !involvesIssuer) {
    return null;
  }

  const rawBalance = cleanNumber(fields.Balance.value);

  /*
   * RippleState Balance is from the low account's perspective.
   * If wallet is low account, use balance as-is.
   * If wallet is high account, invert it.
   */
  if (lowIssuer === walletAddress) {
    return rawBalance;
  }

  if (highIssuer === walletAddress) {
    return -rawBalance;
  }

  return null;
}

function getTowDeltaFromMeta(
  meta: any,
  walletAddress: string,
  issuerAddress: string,
  currencyCode: string
) {
  const affectedNodes = meta?.AffectedNodes;

  if (!Array.isArray(affectedNodes)) return 0;

  let delta = 0;

  for (const node of affectedNodes) {
    if (getLedgerEntryType(node) !== "RippleState") {
      continue;
    }

    const finalFields = getFinalFields(node);
    const previousFields = getPreviousFields(node);

    const finalBalance =
      getRippleStateWalletBalance(
        finalFields,
        walletAddress,
        issuerAddress,
        currencyCode
      ) ?? 0;

    const previousBalance =
      previousFields
        ? getRippleStateWalletBalance(
            {
              ...finalFields,
              ...previousFields,
              LowLimit:
                previousFields.LowLimit ??
                finalFields?.LowLimit,
              HighLimit:
                previousFields.HighLimit ??
                finalFields?.HighLimit,
              Balance:
                previousFields.Balance ??
                finalFields?.Balance,
            },
            walletAddress,
            issuerAddress,
            currencyCode
          ) ?? 0
        : 0;

    delta += finalBalance - previousBalance;
  }

  return Number(delta.toFixed(6));
}

function getXrpDeltaFromMeta(
  meta: any,
  walletAddress: string
) {
  const affectedNodes = meta?.AffectedNodes;

  if (!Array.isArray(affectedNodes)) return 0;

  let deltaDrops = 0;

  for (const node of affectedNodes) {
    if (getLedgerEntryType(node) !== "AccountRoot") {
      continue;
    }

    const finalFields = getFinalFields(node);
    const previousFields = getPreviousFields(node);

    const account = String(finalFields?.Account ?? "");

    if (account !== walletAddress) continue;

    const finalBalanceDrops = Number(
      finalFields?.Balance ?? 0
    );

    const previousBalanceDrops = Number(
      previousFields?.Balance ??
        finalFields?.Balance ??
        0
    );

    if (
      Number.isFinite(finalBalanceDrops) &&
      Number.isFinite(previousBalanceDrops)
    ) {
      deltaDrops +=
        finalBalanceDrops - previousBalanceDrops;
    }
  }

  return Number((deltaDrops / 1_000_000).toFixed(6));
}

function getTxObject(entry: any) {
  return entry?.tx_json ?? entry?.tx ?? entry;
}

function getTxMeta(entry: any) {
  return entry?.meta ?? entry?.metaData ?? entry?.metadata;
}

function getTxHash(entry: any) {
  const tx = getTxObject(entry);

  return String(
    tx?.hash ??
      entry?.hash ??
      tx?.ctid ??
      ""
  );
}

function getLedgerIndex(entry: any) {
  const tx = getTxObject(entry);

  return Number(
    entry?.ledger_index ??
      entry?.ledgerIndex ??
      tx?.ledger_index ??
      tx?.ledgerIndex ??
      0
  );
}

function getEventAt(entry: any) {
  const tx = getTxObject(entry);

  const iso =
    entry?.close_time_iso ??
    entry?.closeTimeIso ??
    tx?.date_iso ??
    tx?.close_time_iso;

  if (iso) {
    const parsed = new Date(iso);

    if (Number.isFinite(parsed.getTime())) {
      return parsed.toISOString();
    }
  }

  return new Date().toISOString();
}

function getCounterparty(entry: any, walletAddress: string) {
  const tx = getTxObject(entry);

  const account = String(tx?.Account ?? "");
  const destination = String(tx?.Destination ?? "");

  if (account && account !== walletAddress) return account;
  if (destination && destination !== walletAddress) {
    return destination;
  }

  return null;
}

function buildSyncEventFromTx(input: {
  entry: any;
  walletAddress: string;
  issuerAddress: string;
  currencyCode: string;
}) {
  const { entry, walletAddress, issuerAddress, currencyCode } =
    input;

  const meta = getTxMeta(entry);

  if (!meta) return null;

  const result =
    meta?.TransactionResult ??
    meta?.transactionResult;

  if (result && result !== "tesSUCCESS") {
    return null;
  }

  const towDelta = getTowDeltaFromMeta(
    meta,
    walletAddress,
    issuerAddress,
    currencyCode
  );

  if (!towDelta) return null;

  const xrpDelta = getXrpDeltaFromMeta(
    meta,
    walletAddress
  );

  const txHash = getTxHash(entry);
  const ledgerIndex = getLedgerIndex(entry);

  if (!txHash || !ledgerIndex) return null;

  const towAmount = Math.abs(towDelta);
  const xrpValue = Math.abs(xrpDelta);

  let eventType: SyncEvent["eventType"];

  if (towDelta > 0) {
    eventType = xrpDelta < 0 ? "buy" : "transfer_in";
  } else {
    eventType = xrpDelta > 0 ? "sell" : "transfer_out";
  }

  return {
    walletAddress,
    txHash,
    eventType,
    xrpValue,
    towAmount,
    counterparty: getCounterparty(entry, walletAddress),
    ledgerIndex,
    eventAt: getEventAt(entry),
    rawEvent: {
      tx: getTxObject(entry),
      meta,
      towDelta,
      xrpDelta,
    },
  };
}

async function fetchAccountTransactions(input: {
  walletAddress: string;
  lastScannedLedger: number | null;
  limit: number;
  maxPages: number;
}) {
  const rpcUrl = process.env.XRPL_RPC_URL;

  if (!rpcUrl) {
    throw new Error("Missing XRPL_RPC_URL env var");
  }

  const { walletAddress, lastScannedLedger, limit, maxPages } =
    input;

  const transactions: any[] = [];

  let marker: any = undefined;
  let page = 0;

  while (page < maxPages) {
    const params: any = {
      account: walletAddress,
      ledger_index_min:
        lastScannedLedger && lastScannedLedger > 0
          ? lastScannedLedger + 1
          : -1,
      ledger_index_max: -1,
      binary: false,
      limit,
      forward:
        lastScannedLedger && lastScannedLedger > 0
          ? true
          : false,
    };

    if (marker) {
      params.marker = marker;
    }

    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        method: "account_tx",
        params: [params],
      }),
    });

    const json = await response.json();

    if (!response.ok || json?.error || json?.result?.error) {
      throw new Error(
        json?.error_message ??
          json?.result?.error_message ??
          json?.result?.error ??
          "XRPL account_tx failed"
      );
    }

    const pageTxs = json?.result?.transactions ?? [];

    transactions.push(...pageTxs);

    marker = json?.result?.marker;

    if (!marker) break;

    page += 1;
  }

  return transactions;
}

async function syncEvents(input: {
  request: NextRequest;
  events: SyncEvent[];
}) {
  const { request, events } = input;

  if (!events.length) {
    return {
      ok: true,
      results: [],
    };
  }

  const baseUrl = getBaseUrl(request);

  const response = await fetch(`${baseUrl}/api/tired-sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-tow-sync-secret":
        process.env.TOW_SYNC_SECRET ?? "",
    },
    body: JSON.stringify(events),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ??
        data?.details ??
        "Could not sync detected wallet events"
    );
  }

  return data;
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));

    const walletAddress = String(
      body.walletAddress ?? ""
    ).trim();

    const limit = Math.min(
      200,
      Math.max(10, Number(body.limit ?? 100))
    );

    const maxPages = Math.min(
      5,
      Math.max(1, Number(body.maxPages ?? 2))
    );

    if (!isValidXrplWallet(walletAddress)) {
      return NextResponse.json(
        { error: "Invalid XRPL wallet." },
        { status: 400 }
      );
    }

    const issuerAddress = String(
      process.env.TOW_ISSUER ?? ""
    ).trim();

    const currencyCode = String(
      process.env.TOW_CURRENCY ?? "TOW"
    ).trim();

    if (!issuerAddress) {
      throw new Error("Missing TOW_ISSUER env var");
    }

    if (!currencyCode) {
      throw new Error("Missing TOW_CURRENCY env var");
    }

    const supabase = getSupabase();

    const { data: player, error: playerError } =
      await supabase
        .from("tow_players")
        .select("wallet_address,last_scanned_ledger")
        .eq("wallet_address", walletAddress)
        .maybeSingle();

    if (playerError) throw playerError;

    if (!player) {
      return NextResponse.json(
        {
          error:
            "Wallet is not registered in Proof Of Tiredness.",
        },
        { status: 404 }
      );
    }

    const lastScannedLedger =
      player.last_scanned_ledger == null
        ? null
        : Number(player.last_scanned_ledger);

    const txs = await fetchAccountTransactions({
      walletAddress,
      lastScannedLedger,
      limit,
      maxPages,
    });

    const events: SyncEvent[] = [];
    let highestLedgerSeen = lastScannedLedger ?? 0;

    for (const entry of txs) {
      const ledgerIndex = getLedgerIndex(entry);

      if (!ledgerIndex) continue;

      if (
        lastScannedLedger &&
        ledgerIndex <= lastScannedLedger
      ) {
        continue;
      }

      highestLedgerSeen = Math.max(
        highestLedgerSeen,
        ledgerIndex
      );

      const event = buildSyncEventFromTx({
        entry,
        walletAddress,
        issuerAddress,
        currencyCode,
      });

      if (event) {
        events.push(event);
      }
    }

    const syncResult = await syncEvents({
      request,
      events,
    });

    if (highestLedgerSeen > (lastScannedLedger ?? 0)) {
      const { error: updateError } = await supabase
        .from("tow_players")
        .update({
          last_scanned_ledger: highestLedgerSeen,
        })
        .eq("wallet_address", walletAddress);

      if (updateError) throw updateError;
    }

    return NextResponse.json({
      ok: true,
      walletAddress,
      lastScannedLedger,
      highestLedgerSeen:
        highestLedgerSeen || lastScannedLedger,
      scanned: txs.length,
      detected: events.length,
      events: events.map((event) => ({
        txHash: event.txHash,
        eventType: event.eventType,
        xrpValue: event.xrpValue,
        towAmount: event.towAmount,
        ledgerIndex: event.ledgerIndex,
        eventAt: event.eventAt,
      })),
      sync: syncResult,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not scan wallet.",
        details:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
