import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidXrplWallet } from "@/lib/towProof";
import { inspectTowDelta } from "@/lib/towLedgerMovementInspection";

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

function getXrpDeltaFromMeta(meta: any, walletAddress: string) {
  const affectedNodes = meta?.AffectedNodes;
  if (!Array.isArray(affectedNodes)) {
    throw new Error("UNVERIFIED_XRP_BALANCE_METADATA: missing affected nodes; checkpoint NOT advanced.");
  }

  const parseDrops = (value: unknown): bigint | null =>
    typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value)
      ? BigInt(value) : null;

  let deltaDrops = 0n;
  let matched = 0;
  for (const node of affectedNodes) {
    if (getLedgerEntryType(node) !== "AccountRoot") continue;
    const finalFields = getFinalFields(node);
    if (String(finalFields?.Account ?? "") !== walletAddress) continue;
    matched++;
    // AccountRoot modifications must contain both balances to attest an
    // XRP delta. Never silently substitute the final balance for a missing
    // previous balance, which could conceal XRP paid in a trade.
    const before = parseDrops(getPreviousFields(node)?.Balance);
    const after = parseDrops(finalFields?.Balance);
    if (before === null || after === null) {
      throw new Error("UNVERIFIED_XRP_BALANCE_METADATA: missing or malformed account balance; checkpoint NOT advanced.");
    }
    deltaDrops += after - before;
  }
  if (matched > 1) {
    throw new Error("UNVERIFIED_XRP_BALANCE_METADATA: duplicate account roots; checkpoint NOT advanced.");
  }
  if (deltaDrops > BigInt(Number.MAX_SAFE_INTEGER) ||\n      deltaDrops < -BigInt(Number.MAX_SAFE_INTEGER)) {\n    throw new Error("UNVERIFIED_XRP_BALANCE_METADATA: XRP delta exceeds safe numeric range; checkpoint NOT advanced.");\n  }\n  return Number(deltaDrops) / 1_000_000;
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

function getEventAt(entry: any): string | null {
  const tx = getTxObject(entry);
  const iso = entry?.close_time_iso ?? entry?.closeTimeIso ??
    tx?.date_iso ?? tx?.close_time_iso;
  if (iso) {
    const parsed = new Date(iso);
    if (Number.isFinite(parsed.getTime())) return parsed.toISOString();
  }

  // XRPL date is seconds since 2000-01-01T00:00:00Z.
  const rippleSeconds = tx?.date ?? entry?.date;
  if (rippleSeconds !== undefined && rippleSeconds !== null) {
    const seconds = Number(rippleSeconds);
    if (Number.isFinite(seconds) && seconds >= 0) {
      const parsed = new Date((seconds + 946684800) * 1000);
      if (Number.isFinite(parsed.getTime())) return parsed.toISOString();
    }
  }

  // Never assign the scan time to an old ledger transaction.
  return null;
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
}): SyncEvent | null {
  const { entry, walletAddress, issuerAddress, currencyCode } = input;
  const tx = getTxObject(entry);
  const meta = getTxMeta(entry);
  if (!meta || (meta.TransactionResult ?? meta.transactionResult) !== "tesSUCCESS") return null;

  const txHash = getTxHash(entry);
  const ledgerIndex = getLedgerIndex(entry);
  const eventAt = getEventAt(entry);
  if (!/^[A-Fa-f0-9]{64}$/.test(txHash) || !ledgerIndex || !eventAt) return null;

  const inspection = inspectTowDelta(entry, walletAddress, issuerAddress, currencyCode);
  if (!inspection.reliable) throw new Error(`Unverifiable XRPL transaction ${txHash}: ${inspection.warnings.join("; ")}`);
  const towDelta = inspection.deltaTow ?? 0;
  if (Math.abs(towDelta) < 0.000001) return null;

  // An AMM transaction or an issued-asset DEX fill can move TOW without
  // exchanging XRP directly. Treating these as zero-cost transfers would
  // corrupt FIFO cost basis; stop the scan before advancing its cursor.
  const txType = String(tx?.TransactionType ?? "");
  if (txType.startsWith("AMM") || txType === "OfferCreate" ||
      txType === "OfferCancel" || txType === "Payment") {
    const affected = Array.isArray(meta?.AffectedNodes) ? meta.AffectedNodes : [];
    const hasOffer = affected.some((node: any) => {
      const item = node?.ModifiedNode ?? node?.CreatedNode ?? node?.DeletedNode;
      return item?.LedgerEntryType === "Offer";
    });
    const hasAmm = affected.some((node: any) => {
      const item = node?.ModifiedNode ?? node?.CreatedNode ?? node?.DeletedNode;
      return item?.LedgerEntryType === "AMM";
    });
    if (txType.startsWith("AMM") || hasAmm) {
      throw new Error(`Unsupported AMM TOW movement ${txHash}: requires independently verified trade provenance; checkpoint NOT advanced.`);
    }
    if (hasOffer && txType !== "OfferCreate" && txType !== "Payment") {
      throw new Error(`Unsupported DEX TOW movement ${txHash}: checkpoint NOT advanced.`);
    }
  }

  const xrpDelta = getXrpDeltaFromMeta(meta, walletAddress);
  const isSender = String(tx?.Account ?? "") === walletAddress;
  const feeXrp = isSender ? dropsToXrp(tx?.Fee) : 0;
  // Exclude the sender's transaction fee from XRP spent/received.
  const tradeXrpDelta = Number((xrpDelta + feeXrp).toFixed(6));
  const tolerance = 0.000001;

  // A non-DEX transaction that moves both TOW and XRP is not necessarily a
  // zero-cost transfer. A wallet may receive TOW and pay XRP in one transaction
  // through a future XRPL transaction type. Preserve FIFO integrity by
  // refusing to classify mixed-asset movements without execution provenance.
  if (Math.abs(tradeXrpDelta) > tolerance) {
    throw new Error(`AMBIGUOUS_TOW_XRP_MOVEMENT ${txHash}: mixed TOW/XRP movement requires verified execution provenance; checkpoint NOT advanced.`);
  }

  // Narrowly admit plain issued-TOW Payments as transfers, not trades.
  // A direct Payment must identify both parties, deliver TOW from our
  // issuer, and contain no path/SendMax/partial-payment features or
  // affected Offer/AMM nodes. The actual wallet TOW delta must match
  // the stated Amount, and the only XRP balance movement may be the fee.
  // All OfferCreate and routed/ambiguous Payments still fail closed.
  if (txType === "OfferCreate") {
    throw new Error(`UNVERIFIED_TOW_TRADE_PROVENANCE ${txHash}: execution cost not attested; checkpoint NOT advanced.`);
  }
  if (txType === "Payment") {
    const amount = tx?.Amount;
    const affected = Array.isArray(meta?.AffectedNodes) ? meta.AffectedNodes : [];
    const hasExecutionNodes = affected.some((node: any) => {
      const item = node?.ModifiedNode ?? node?.CreatedNode ?? node?.DeletedNode;
      return item?.LedgerEntryType === "Offer" || item?.LedgerEntryType === "AMM";
    });
    const sender = String(tx?.Account ?? "");
    const destination = String(tx?.Destination ?? "");
    const value = Number(amount?.value);
    // A successful Payment must actually deliver the claimed issued amount.
    // Reject unavailable or contradictory delivery metadata rather than
    // treating a requested Amount as proof of execution.
    const delivered = meta?.delivered_amount ?? meta?.DeliveredAmount;
    const deliveredValue = Number(delivered?.value);
    const deliveredMatches = delivered && typeof delivered === "object" &&
      currenciesMatch(delivered.currency, currencyCode) &&
      String(delivered.issuer ?? "") === issuerAddress &&
      Number.isFinite(deliveredValue) && deliveredValue > 0 &&
      Math.abs(deliveredValue - value) < 0.000001;
    const direct = sender && destination && sender !== destination &&
      (sender === walletAddress || destination === walletAddress) &&
      sender !== issuerAddress && destination !== issuerAddress &&
      meta?.TransactionResult === "tesSUCCESS" &&
      typeof amount === "object" && amount !== null &&
      currenciesMatch(amount.currency, currencyCode) &&
      String(amount.issuer ?? "") === issuerAddress &&
      Number.isFinite(value) && value > 0 && deliveredMatches &&
      !Object.prototype.hasOwnProperty.call(tx, "SendMax") &&
      !Object.prototype.hasOwnProperty.call(tx, "Paths") &&
      !Object.prototype.hasOwnProperty.call(tx, "DeliverMin") &&
      !Object.prototype.hasOwnProperty.call(tx, "DeliverMax") &&
      !hasExecutionNodes &&
      (tx?.Flags === undefined || tx?.Flags === null ||
        (typeof tx.Flags === "number" && tx.Flags === 0)) &&
      Math.abs(towDelta - (destination === walletAddress ? value : -value)) < 0.000001;
    if (!direct) {
      throw new Error(`UNVERIFIED_TOW_TRADE_PROVENANCE ${txHash}: not a proven direct TOW transfer; checkpoint NOT advanced.`);
    }
    // Sender must have an independently observable, fee-only XRP balance
    // change. Missing PreviousFields must never be interpreted as zero cost.
    if (sender === walletAddress) {
      const senderRoots = affected.filter((node: any) => {
        const item = node?.ModifiedNode;
        return item?.LedgerEntryType === "AccountRoot" &&
          String(item?.FinalFields?.Account ?? "") === sender;
      });
      const parseDrops = (v: unknown): bigint | null =>
        typeof v === "string" && /^(0|[1-9][0-9]*)$/.test(v)
          ? BigInt(v) : null;
      const root = senderRoots.length === 1 ? senderRoots[0].ModifiedNode : null;
      const before = parseDrops(root?.PreviousFields?.Balance);
      const after = parseDrops(root?.FinalFields?.Balance);
      const fee = parseDrops(tx?.Fee);
      if (before === null || after === null || fee === null ||
          before - after !== fee) {
        throw new Error(`UNVERIFIED_DIRECT_PAYMENT_XRP_FEE ${txHash}: sender fee-only balance change not proven; checkpoint NOT advanced.`);
      }
    }
  } else {
    // Do not classify arbitrary new XRPL transaction types as transfers.
    throw new Error(`UNSUPPORTED_TOW_TRANSACTION_TYPE ${txHash}: checkpoint NOT advanced.`);
  }

  // Both verified trade types were rejected above, and mixed XRP/TOW
  // movements are rejected as ambiguous. Only zero-XRP movements reach
  // this branch. Do not retain unreachable buy/sell heuristics that could
  // accidentally be re-enabled without independent execution provenance.
  let eventType: SyncEvent["eventType"];
  eventType = towDelta > 0 ? "transfer_in" : "transfer_out";
  const xrpValue = 0;

  return {
    walletAddress,
    txHash: txHash.toUpperCase(),
    eventType,
    xrpValue: Number(xrpValue.toFixed(6)),
    towAmount: Math.abs(towDelta),
    counterparty: getCounterparty(entry, walletAddress),
    ledgerIndex,
    eventAt,
    rawEvent: { tx, meta, towDelta, xrpDelta, tradeXrpDelta },
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
      forward: true,
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

    const pageTxs = json?.result?.transactions;
    if (!Array.isArray(pageTxs)) throw new Error("Malformed XRPL account_tx response; checkpoint NOT advanced.");
    for (const entry of pageTxs) {
      if (entry?.validated !== true) {
        throw new Error("Unvalidated XRPL account_tx entry; checkpoint NOT advanced.");
      }
      if (!getTxMeta(entry)) {
        throw new Error("Missing XRPL transaction metadata; checkpoint NOT advanced.");
      }
    }
    transactions.push(...pageTxs);

    marker = json?.result?.marker;
    page += 1;
    if (!marker) break;
  }

  // A ledger-only cursor cannot safely resume partway through a page range.
  // Fail closed instead of skipping unseen transactions.
  if (marker) {
    throw new Error(
      "XRPL history exceeds maxPages; checkpoint NOT advanced. Increase maxPages or implement persistent pagination before scanning this wallet."
    );
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

    txs.sort((a, b) =>
      getLedgerIndex(a) - getLedgerIndex(b) ||
      Number(getTxObject(a)?.date ?? 0) - Number(getTxObject(b)?.date ?? 0) ||
      Number(getTxObject(a)?.TransactionIndex ?? getTxMeta(a)?.TransactionIndex ?? 0) -
        Number(getTxObject(b)?.TransactionIndex ?? getTxMeta(b)?.TransactionIndex ?? 0)
    );

    const events: SyncEvent[] = [];
    let highestLedgerSeen = lastScannedLedger ?? 0;

    for (const entry of txs) {
      const ledgerIndex = getLedgerIndex(entry);

      if (!Number.isSafeInteger(ledgerIndex) || ledgerIndex <= 0) {
        throw new Error("XRPL transaction missing valid ledger index; checkpoint NOT advanced.");
      }

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

      // Do not silently skip a TOW movement with an unknown timestamp.
      // Otherwise the ledger cursor would advance past an unprocessed event.
      const meta = getTxMeta(entry);
      if ((meta?.TransactionResult ?? meta?.transactionResult) !== "tesSUCCESS") continue;
      const inspection = inspectTowDelta(entry, walletAddress, issuerAddress, currencyCode);
      if (!inspection.reliable) {
        throw new Error(`Unverifiable XRPL movement at ledger ${ledgerIndex}: ${inspection.warnings.join("; ")}; checkpoint NOT advanced.`);
      }
      if (meta && (meta.TransactionResult ?? meta.transactionResult) === "tesSUCCESS" &&
          Math.abs(inspection.deltaTow ?? 0) > 0.000001 &&
          !getEventAt(entry)) {
        throw new Error(`Missing XRPL timestamp at ledger ${ledgerIndex}; checkpoint NOT advanced.`);
      }

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

    if (syncResult?.ok !== true ||
        !Array.isArray(syncResult?.results) ||
        syncResult.results.length !== events.length ||
        syncResult.results.some((r: any, index: number) =>
          r?.ok !== true ||
          String(r?.txHash ?? "").toUpperCase() !== events[index].txHash.toUpperCase()
        )) {
      throw new Error("Sync returned failed events; checkpoint NOT advanced.");
    }

    if (highestLedgerSeen > (lastScannedLedger ?? 0)) {
      const { error: updateError } = await supabase
        .from("tow_players")
        .update({
          last_scanned_ledger: highestLedgerSeen,
        })
        .eq("wallet_address", walletAddress);

      if (updateError) throw updateError;
    }

    // Optional automatic certification after durable event ingestion and cursor update.
    // The certificate endpoint independently rescans history and refuses legacy
    // wallets, incomplete coverage, or failed balance attestation.
    let certificationStatus = "disabled";
    if (process.env.TOW_ENABLE_NEW_WALLET_AUTO_ENROLLMENT === "true" &&
        process.env.TOW_ENABLE_CERTIFICATE_ISSUANCE === "true") {
      try {
        const response = await fetch(`${getBaseUrl(request)}/api/tired-certify-wallet`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-tow-sync-secret": process.env.TOW_SYNC_SECRET ?? "",
          },
          body: JSON.stringify({ wallet: walletAddress }),
          cache: "no-store",
        });
        const certificationResult = await response.json().catch(() => null);
        certificationStatus = response.ok && certificationResult?.certified === true
          ? (certificationResult?.accountingStatus === "reconciled"
              ? "reconciled"
              : "certified_accounting_disabled")
          : certificationResult?.accountingStatus === "replay_failed"
            ? "certified_replay_failed"
            : "not_eligible";
      } catch {
        certificationStatus = "verification_unavailable";
      }
    }

    return NextResponse.json({
  ok: true,
  walletAddress,
  certificationStatus,
  lastScannedLedger,
  highestLedgerSeen:
    highestLedgerSeen || lastScannedLedger,

  scanned: txs.length,
  detected: events.length,

  positionsCreated:
    syncResult?.positionsCreated ?? 0,

  disqualified:
    syncResult?.disqualified ?? 0,

  newCommitments:
    syncResult?.newCommitments ?? [],

  disqualifiedCommitments:
    syncResult?.disqualifiedCommitments ?? [],

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
