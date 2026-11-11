import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidXrplWallet } from "@/lib/towProof";
import { scanCompleteTowHistory } from "@/lib/towCompleteHistoryScanner";
import { compareTowMovements } from "@/lib/towHistoryMovementReconciliation";
import { attestProofLedgerAndBalance } from "@/lib/towHistoricalProofAttestation";

export const dynamic = "force-dynamic";

/** Live, read-only verification. No certificate or accounting writes. */
export async function POST(request: NextRequest) {
  const secret = process.env.TOW_SYNC_SECRET;
  if (!secret || request.headers.get("x-tow-sync-secret") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null);
  const wallet = String(body?.wallet ?? "").trim();
  if (!isValidXrplWallet(wallet))
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rpcUrl = process.env.XRPL_RPC_URL;
  const issuer = process.env.TOW_ISSUER;
  const currency = process.env.TOW_CURRENCY ?? "TOW";
  if (!url || !key || !rpcUrl || !issuer)
    return NextResponse.json({ error: "Verification service not configured" }, { status: 503 });
  try {
    const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const [playerResult, storedResult, positionsResult] = await Promise.all([
      db.from("tow_players").select("verified,proof_started_at").eq("wallet_address", wallet).maybeSingle(),
      db.from("tow_wallet_events").select("*").eq("wallet_address", wallet).order("ledger_index", { ascending: true }).limit(10001),
      db.from("tow_buy_positions").select("id", { count: "exact", head: true }).eq("wallet_address", wallet),
    ]);
    if (playerResult.error || storedResult.error || positionsResult.error)
      throw new Error("Database verification lookup failed");
    if (!playerResult.data)
      return NextResponse.json({ error: "Wallet is not registered" }, { status: 404 });
    const storedRows = storedResult.data ?? [];
    if (storedRows.length > 10000)
      return NextResponse.json({ error: "Stored event limit exceeded; verification forbidden" }, { status: 409 });
    const scan = await scanCompleteTowHistory({ rpcUrl, wallet, issuer, currency });
    const stored = storedRows.map(row => ({
      txHash: String(row.tx_hash ?? ""),
      ledgerIndex: row.ledger_index == null ? null : Number(row.ledger_index),
      eventType: String(row.event_type ?? ""),
      towAmount: Number(row.tow_amount),
    }));
    const comparison = compareTowMovements(scan.movements, stored);
    const blockers = [...comparison.blockers];
    if (!playerResult.data.verified || !playerResult.data.proof_started_at)
      blockers.push("PLAYER_PROOF_NOT_VERIFIED");
    if ((positionsResult.count ?? 0) > 0)
      blockers.push("LEGACY_POSITIONS_REQUIRE_RECONCILIATION");
    if (scan.firstWalletLedger === null || scan.firstAvailableLedger === null ||
        scan.firstAvailableLedger > scan.firstWalletLedger)
      blockers.push("EARLIEST_WALLET_LEDGER_NOT_PROVEN");
    let historicalProof: Awaited<ReturnType<typeof attestProofLedgerAndBalance>> | null = null;
    try {
      if (!scan.scannedThroughLedger || !playerResult.data.proof_started_at)
        throw new Error("Proof timestamp or validated ledger unavailable");
      historicalProof = await attestProofLedgerAndBalance({
        rpcUrl, wallet, issuer, currency,
        proofStartedAt: playerResult.data.proof_started_at,
        verificationLedger: scan.scannedThroughLedger,
      });
      if (scan.firstAvailableLedger === null || scan.firstAvailableLedger > historicalProof.proofLedger)
        blockers.push("HISTORY_DOES_NOT_COVER_PROOF_LEDGER");
      const reconstructed = scan.movements
        .filter(m => m.ledgerIndex <= historicalProof!.proofLedger)
        .reduce((sum, m) => sum + m.deltaTow, 0);
      if (Math.abs(reconstructed - historicalProof.tokenBalanceAtProof) > 0.000001)
        blockers.push("HISTORICAL_BALANCE_RECONSTRUCTION_MISMATCH");
      if (scan.movements.some(m => m.ledgerIndex === historicalProof!.proofLedger + 1))
        blockers.push("PROOF_BOUNDARY_LEDGER_REQUIRES_ORDER_REVIEW");
    } catch {
      blockers.push("INDEPENDENT_HISTORICAL_PROOF_ATTESTATION_FAILED");
    }
    return NextResponse.json({ wallet, certified: false, eligibleForCertification: blockers.length === 0, blockers,
      history: { firstAvailableLedger: scan.firstAvailableLedger,
        firstWalletLedger: scan.firstWalletLedger,
        checkedThroughLedger: scan.scannedThroughLedger,
        transactionCount: scan.transactionCount,
        rpcTowMovements: comparison.rpcCount, storedTowMovements: comparison.storedCount,
        movementsMatch: comparison.matches },
      historicalProof, existingPositionCount: positionsResult.count ?? 0 });
  } catch (error) {
    return NextResponse.json({ error: "Verification failed closed", details: String(error) }, { status: 409 });
  }
}
