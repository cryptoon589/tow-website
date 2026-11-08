import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidXrplWallet } from "@/lib/towProof";

export const dynamic = "force-dynamic";

type SyncEvent = {
  walletAddress?: string;
  txHash?: string;
  eventType?: "buy" | "sell" | "transfer_in" | "transfer_out" | "reward";
  xrpValue?: number;
  towAmount?: number;
  counterparty?: string | null;
  ledgerIndex?: number;
  eventAt?: string;
  rawEvent?: unknown;
};
const TYPES = new Set(["buy", "sell", "transfer_in", "transfer_out", "reward"]);
function requireAdmin(request: Request) {
  const expected = process.env.TOW_SYNC_SECRET;
  if (!expected) throw new Error("Missing TOW_SYNC_SECRET env var");
  return request.headers.get("x-tow-sync-secret") === expected;
}

export async function POST(request: Request) {
  try {
    if (!requireAdmin(request)) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    const body = (await request.json()) as SyncEvent | SyncEvent[];
    const events = Array.isArray(body) ? body : [body];
    if (!events.length || events.length > 1000) {
      return NextResponse.json({ error: "Expected 1–1000 movements." }, { status: 400 });
    }
    const wallet = String(events[0]?.walletAddress ?? "").trim();
    if (!isValidXrplWallet(wallet)) {
      return NextResponse.json({ error: "Invalid XRPL wallet." }, { status: 400 });
    }
    for (const event of events) {
      if (event.walletAddress !== wallet ||
          !/^[a-fA-F0-9]{64}$/.test(String(event.txHash ?? "")) ||
          !TYPES.has(String(event.eventType ?? "")) ||
          !Number.isSafeInteger(event.ledgerIndex) || Number(event.ledgerIndex) <= 0 ||
          !Number.isFinite(Number(event.xrpValue)) || Number(event.xrpValue) < 0 ||
          !Number.isFinite(Number(event.towAmount)) || Number(event.towAmount) <= 0 ||
          !event.eventAt || !Number.isFinite(new Date(event.eventAt).getTime())) {
        return NextResponse.json({ error: "Invalid or mixed-wallet ledger movement." }, { status: 400 });
      }
    }
    const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing Supabase env vars");
    const supabase = createClient(url, key);
    const normalized = events.map(event => ({
      ...event, txHash: String(event.txHash).toUpperCase(),
      xrpValue: Number(event.xrpValue), towAmount: Number(event.towAmount),
    }));
    const hasCommitmentMovements = normalized.some(event => event.eventType !== "reward");
    const fifoEnabled = process.env.TOW_ENABLE_FIFO_ACCOUNTING === "true";
    // FIFO is opt-in until complete historical ledger coverage and existing
    // UUID reconciliation are verified. Never activate it by default.
    const rpcName = hasCommitmentMovements && fifoEnabled
      ? "tow_ingest_and_reconcile_wallet_atomic"
      : "tow_ingest_wallet_events_atomic";
    const { data, error } = await supabase.rpc(rpcName, {
      p_wallet: wallet, p_events: normalized,
    });
    if (error) {
      const message = String(error.message ?? "");
      if (/LEGACY_POSITION_RECONCILIATION_REQUIRED|MIXED_PROVENANCE_REQUIRES_REVIEW|INCOMPLETE_LEDGER_ORDER|MISSING_TRANSACTION_INDEX|OUT_OF_ORDER_LEDGER_REPLAY/.test(message)) {
        return NextResponse.json({
          error: message, code: "TOW_ACCOUNTING_REVIEW_REQUIRED",
        }, { status: 409 });
      }
      throw error;
    }
    // Staging is a successful, durable write, NOT a reconciliation failure.
    // Returning HTTP 409 here made the scanner retry the same ledger range
    // forever and prevented its checkpoint from advancing. The scanner may
    // advance only after every event in the batch has been stored atomically.
    const stagedOnly = !fifoEnabled || !hasCommitmentMovements;
    return NextResponse.json({
      ok: true,
      accountingStatus: stagedOnly ? "staged_not_reconciled" : "reconciled",
      commitmentsUpdated: !stagedOnly,
      recorded: data?.recorded ?? 0,
      duplicates: data?.duplicates ?? 0,
      positionsCreated: stagedOnly ? 0 : (data?.positionsCreated ?? 0),
      disqualified: stagedOnly ? 0 : (data?.disqualified ?? 0),
      newCommitments: [], disqualifiedCommitments: [],
      results: normalized.map(event => ({
        walletAddress: wallet, txHash: event.txHash,
        ok: true, action: stagedOnly ? "event_staged" : "event_reconciled",
      })),
    });
  } catch (error) {
    return NextResponse.json({
      error: "Could not sync wallet events.",
      details: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}
