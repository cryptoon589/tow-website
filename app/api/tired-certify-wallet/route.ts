import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isValidXrplWallet } from "@/lib/towProof";
import { POST as verifyHistory } from "@/app/api/tired-verify-history/route";

export const dynamic = "force-dynamic";

/**
 * Explicit opt-in, administrator-only certification for NEW wallets.
 * This endpoint never reconciles accounting or changes legacy positions.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.TOW_SYNC_SECRET;
  if (!secret || request.headers.get("x-tow-sync-secret") !== secret)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (process.env.TOW_ENABLE_CERTIFICATE_ISSUANCE !== "true")
    return NextResponse.json({ error: "Certificate issuance disabled" }, { status: 403 });
  const payload = await request.json().catch(() => null);
  const wallet = String(payload?.wallet ?? "").trim();
  if (!isValidXrplWallet(wallet))
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  const pilotWallets = (process.env.TOW_FIFO_PILOT_WALLETS ?? "").split(",").map(x => x.trim());
  const automaticEnrollment = process.env.TOW_ENABLE_NEW_WALLET_AUTO_ENROLLMENT === "true";
  if (!automaticEnrollment && !pilotWallets.includes(wallet))
    return NextResponse.json({ error: "Wallet not explicitly allowlisted" }, { status: 403 });
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  // Re-run independent ledger, trust-line, full-history and stored-event checks
  // immediately before issuance. Never accept client-supplied evidence.
  const verificationRequest = new NextRequest(request.url.replace(/\/tired-certify-wallet(?:\?.*)?$/, "/tired-verify-history"), {
    method: "POST", headers: { "content-type": "application/json", "x-tow-sync-secret": secret },
    body: JSON.stringify({ wallet }),
  });
  const verification = await verifyHistory(verificationRequest);
  if (!verification.ok) return NextResponse.json({ error: "Independent verification failed" }, { status: 409 });
  const evidence = await verification.json();
  if (evidence.wallet !== wallet || evidence.eligibleForCertification !== true ||
      !evidence.historicalProof?.proofBoundaryVerified ||
      !evidence.historicalProof?.balanceIndependentlyVerified ||
      !evidence.history?.movementsMatch ||
      !Number.isSafeInteger(evidence.historicalProof.proofLedger) ||
      !Number.isSafeInteger(evidence.history.checkedThroughLedger) ||
      !Number.isSafeInteger(evidence.history.firstWalletLedger) ||
      evidence.existingPositionCount !== 0)
    return NextResponse.json({ error: "Certification evidence incomplete", blockers: evidence.blockers ?? [] }, { status: 409 });

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  if (automaticEnrollment && !pilotWallets.includes(wallet)) {
    const cutoff = process.env.TOW_NEW_WALLET_CUTOFF;
    const cutoffMs = cutoff ? Date.parse(cutoff) : NaN;
    const proofMs = Date.parse(String(evidence.proofStartedAt ?? ""));
    if (!Number.isFinite(cutoffMs) || !Number.isFinite(proofMs) || proofMs < cutoffMs)
      return NextResponse.json({ error: "Wallet predates automatic enrollment cutoff" }, { status: 403 });
  }
  // A DB-side function must atomically recheck the wallet has no legacy positions,
  // and prevent concurrent proof/event mutations before recording certification.
  const { data, error } = await db.rpc("tow_certify_new_wallet_atomic", {
    p_wallet: wallet,
    p_first_wallet_ledger: evidence.history.firstWalletLedger,
    p_proof_ledger: evidence.historicalProof.proofLedger,
    p_checked_through_ledger: evidence.history.checkedThroughLedger,
    p_expected_event_count: evidence.history.storedTowMovements,
    p_expected_proof_started_at: evidence.proofStartedAt,
  });
  if (error || !data?.certified)
    return NextResponse.json({ error: "Atomic certification rejected", details: error?.message ?? data }, { status: 409 });
  return NextResponse.json({ wallet, certified: true, proofLedger: evidence.historicalProof.proofLedger });
}
