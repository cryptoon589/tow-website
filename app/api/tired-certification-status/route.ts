import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidXrplWallet } from "@/lib/towProof";

export const dynamic = "force-dynamic";

/** Read-only, administrator-only FIFO certification status. Never issues certificates. */
export async function GET(request: NextRequest) {
  const secret = process.env.TOW_SYNC_SECRET;
  if (!secret || request.headers.get("x-tow-sync-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const wallet = request.nextUrl.searchParams.get("wallet")?.trim() ?? "";
  if (!isValidXrplWallet(wallet)) {
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  }
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [coverageResult, playerResult, positionsResult, initializedResult] = await Promise.all([
    db.from("tow_accounting_coverage").select("verified_complete,balance_verified,first_wallet_ledger,proof_ledger,checked_through_ledger,checked_at").eq("wallet_address", wallet).maybeSingle(),
    db.from("tow_players").select("verified,proof_started_at").eq("wallet_address", wallet).maybeSingle(),
    db.from("tow_buy_positions").select("id", { count: "exact", head: true }).eq("wallet_address", wallet),
    db.from("tow_accounting_initialized").select("wallet_address").eq("wallet_address", wallet).maybeSingle(),
  ]);
  const error = [coverageResult.error, playerResult.error, positionsResult.error, initializedResult.error].find(Boolean);
  if (error) return NextResponse.json({ error: "Certification lookup failed" }, { status: 500 });
  const c = coverageResult.data;
  const p = playerResult.data;
  const blockers: string[] = [];
  if (!p?.verified || !p?.proof_started_at) blockers.push("PLAYER_PROOF_NOT_VERIFIED");
  if (!c?.verified_complete) blockers.push("HISTORY_NOT_CERTIFIED");
  if (!c?.balance_verified) blockers.push("BALANCE_NOT_CERTIFIED");
  if (!c?.first_wallet_ledger || !c?.proof_ledger || !c?.checked_through_ledger ||
      c.first_wallet_ledger > c.proof_ledger || c.checked_through_ledger < c.proof_ledger)
    blockers.push("LEDGER_COVERAGE_INVALID");
  if ((positionsResult.count ?? 0) > 0 && !initializedResult.data)
    blockers.push("LEGACY_POSITIONS_REQUIRE_RECONCILIATION");
  const allowlisted = (process.env.TOW_FIFO_PILOT_WALLETS ?? "").split(",").map(s => s.trim()).includes(wallet);
  if (!allowlisted || process.env.TOW_ENABLE_FIFO_ACCOUNTING !== "true") blockers.push("PILOT_NOT_ENABLED");
  return NextResponse.json({ wallet, eligibleForPilot: blockers.length === 0, blockers,
    coverage: c ?? null, legacyPositionCount: positionsResult.count ?? 0 });
}
