import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  MIN_QUALIFYING_BUY_XRP,
  calculateMaxRewardTow,
  isValidXrplWallet,
} from "@/lib/towProof";

export const dynamic = "force-dynamic";

type XrplAmount = string | {
  currency?: string;
  issuer?: string;
  value?: string;
};

type XrplNode = {
  ModifiedNode?: any;
  CreatedNode?: any;
  DeletedNode?: any;
};

type WalletEvent = {
  walletAddress: string;
  txHash: string;
  eventType: "buy" | "sell";
  xrpValue: number;
  towAmount: number;
  ledgerIndex?: number;
  eventAt: string;
  rawEvent: unknown;
};

function getSupabase() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) throw new Error("Missing Supabase env vars");

  return createClient(url, key);
}

function requireAdmin(request: Request) {
  const expected = process.env.TOW_SYNC_SECRET;
  if (!expected) throw new Error("Missing TOW_SYNC_SECRET env var");
  return request.headers.get("x-tow-sync-secret") === expected;
}

function getXrplRpcUrl() {
  return process.env.XRPL_RPC_URL ?? "https://s1.ripple.com:51234";
}

function getTowIssuer() {
  return process.env.TOW_ISSUER ?? "rstXMYib49TXTv69QioDhADxwxqSNrqRmV";
}

function getTowCurrency() {
  return process.env.TOW_CURRENCY ?? "TOW";
}

function dropsToXrp(drops: string | number) {
  const value = Number(drops);
  if (!Number.isFinite(value)) return 0;
  return value / 1_000_000;
}

function getNodeData(node: XrplNode) {
  return node.ModifiedNode ?? node.CreatedNode ?? node.DeletedNode ?? null;
}

function getXrpBalanceDelta(nodeData: any, wallet: string) {
  if (nodeData?.LedgerEntryType !== "AccountRoot") return 0;

  const finalFields = nodeData.FinalFields ?? nodeData.NewFields;
  const previousFields = nodeData.PreviousFields;

  if (finalFields?.Account !== wallet) return 0;
  if (!previousFields?.Balance || !finalFields?.Balance) return 0;

  return dropsToXrp(finalFields.Balance) - dropsToXrp(previousFields.Balance);
}

function getTrustlineBalanceFromWalletPerspective(fields: any, wallet: string) {
  const lowAccount = fields?.LowLimit?.issuer;
  const highAccount = fields?.HighLimit?.issuer;
  const balance = Number(fields?.Balance?.value ?? 0);

  if (!Number.isFinite(balance)) return null;

  if (lowAccount === wallet) return balance;
  if (highAccount === wallet) return -balance;

  return null;
}

function getTowBalanceDelta(nodeData: any, wallet: string, issuer: string, currency: string) {
  if (nodeData?.LedgerEntryType !== "RippleState") return 0;

  const finalFields = nodeData.FinalFields ?? nodeData.NewFields;
  const previousFields = nodeData.PreviousFields;

  const finalCurrency = finalFields?.Balance?.currency;
  const lowIssuer = finalFields?.LowLimit?.issuer;
  const highIssuer = finalFields?.HighLimit?.issuer;

  if (finalCurrency !== currency) return 0;
  if (lowIssuer !== issuer && highIssuer !== issuer) return 0;
  if (lowIssuer !== wallet && highIssuer !== wallet) return 0;

  const finalBalance = getTrustlineBalanceFromWalletPerspective(finalFields, wallet);
  const previousBalance = previousFields?.Balance
    ? getTrustlineBalanceFromWalletPerspective(
        { ...finalFields, Balance: previousFields.Balance },
        wallet
      )
    : 0;

  if (finalBalance === null || previousBalance === null) return 0;

  return finalBalance - previousBalance;
}

function extractEventFromTx(txRecord: any, wallet: string): WalletEvent | null {
  const tx = txRecord.tx_json ?? txRecord.tx ?? txRecord;
  const meta = txRecord.meta ?? txRecord.metaData ?? txRecord.meta_data;

  if (!tx || !meta || meta.TransactionResult !== "tesSUCCESS") return null;

  const hash = tx.hash ?? txRecord.hash;
  const ledgerIndex = tx.ledger_index ?? txRecord.ledger_index;
  const closeTimeIso = txRecord.close_time_iso ?? tx.close_time_iso ?? new Date().toISOString();
  const affectedNodes = meta.AffectedNodes ?? [];

  let xrpDelta = 0;
  let towDelta = 0;

  for (const wrapper of affectedNodes) {
    const nodeData = getNodeData(wrapper);
    if (!nodeData) continue;

    xrpDelta += getXrpBalanceDelta(nodeData, wallet);
    towDelta += getTowBalanceDelta(nodeData, wallet, getTowIssuer(), getTowCurrency());
  }

  const absTow = Math.abs(towDelta);
  const absXrp = Math.abs(xrpDelta);

  if (!hash || absTow <= 0) return null;

  if (towDelta > 0) {
    return {
      walletAddress: wallet,
      txHash: hash,
      eventType: "buy",
      xrpValue: absXrp,
      towAmount: absTow,
      ledgerIndex,
      eventAt: closeTimeIso,
      rawEvent: txRecord,
    };
  }

  if (towDelta < 0) {
    return {
      walletAddress: wallet,
      txHash: hash,
      eventType: "sell",
      xrpValue: absXrp,
      towAmount: absTow,
      ledgerIndex,
      eventAt: closeTimeIso,
      rawEvent: txRecord,
    };
  }

  return null;
}

async function fetchAccountTransactions(wallet: string, limit: number) {
  const response = await fetch(getXrplRpcUrl(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "account_tx",
      params: [
        {
          account: wallet,
          ledger_index_min: -1,
          ledger_index_max: -1,
          binary: false,
          forward: false,
          limit,
        },
      ],
    }),
  });

  const data = await response.json();

  if (!response.ok || data?.result?.error) {
    throw new Error(data?.result?.error_message ?? "XRPL account_tx failed");
  }

  return data?.result?.transactions ?? [];
}

async function recordEvent(event: WalletEvent) {
  const supabase = getSupabase();

  const { error: eventError } = await supabase.from("tow_wallet_events").upsert(
    {
      wallet_address: event.walletAddress,
      tx_hash: event.txHash,
      event_type: event.eventType,
      xrp_value: event.xrpValue,
      tow_amount: event.towAmount,
      ledger_index: event.ledgerIndex ?? null,
      event_at: event.eventAt,
      raw_event: event.rawEvent,
    },
    { onConflict: "tx_hash" }
  );

  if (eventError) throw eventError;

  if (event.eventType === "buy") {
    if (event.xrpValue >= MIN_QUALIFYING_BUY_XRP && event.towAmount > 0) {
      const { error } = await supabase.from("tow_buy_positions").upsert(
        {
          wallet_address: event.walletAddress,
          buy_tx_hash: event.txHash,
          buy_value_xrp: event.xrpValue,
          tow_amount: event.towAmount,
          max_reward_tow: calculateMaxRewardTow(event.towAmount),
          status: "alive",
          created_at: event.eventAt,
        },
        { onConflict: "buy_tx_hash" }
      );

      if (error) throw error;

      return "position_created";
    }

    return "buy_recorded_not_qualifying";
  }

  if (event.eventType === "sell") {
    const { error } = await supabase
      .from("tow_buy_positions")
      .update({
        status: "disqualified",
        disqualified_at: event.eventAt,
        sell_tx_hash: event.txHash,
      })
      .eq("wallet_address", event.walletAddress)
      .eq("status", "alive");

    if (error) throw error;

    return "wallet_disqualified";
  }

  return "event_recorded";
}

export async function POST(request: NextRequest) {
  try {
    if (!requireAdmin(request)) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await request.json();
    const wallet = String(body.walletAddress ?? "").trim();
    const limit = Math.min(200, Math.max(1, Number(body.limit ?? 50)));

    if (!isValidXrplWallet(wallet)) {
      return NextResponse.json({ error: "Invalid XRPL wallet." }, { status: 400 });
    }

    const transactions = await fetchAccountTransactions(wallet, limit);
    const detectedEvents = transactions
      .map((record: any) => extractEventFromTx(record, wallet))
      .filter(Boolean) as WalletEvent[];

    const results = [];

    for (const event of detectedEvents.reverse()) {
      const action = await recordEvent(event);
      results.push({
        txHash: event.txHash,
        eventType: event.eventType,
        xrpValue: event.xrpValue,
        towAmount: event.towAmount,
        action,
      });
    }

    return NextResponse.json({
      ok: true,
      walletAddress: wallet,
      scanned: transactions.length,
      detected: detectedEvents.length,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not scan wallet.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
