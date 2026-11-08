/**
 * Conservative readiness checks before replacing existing Proof of Tiredness
 * commitments. This module never writes to Supabase.
 *
 * IMPORTANT: Matching aggregate counts is NOT proof that individual lots,
 * claim histories, or survival dates match. Manual approval is still required.
 */
export type ExistingProofPosition = {
  id: string;
  buy_tx_hash: string;
  status: string;
  created_at: string;
  tow_amount: number;
  remaining_tow: number | null;
  claimed_at?: string | null;
  reward_status?: string | null;
  reward_sent_at?: string | null;
  reward_tx_hash?: string | null;
  unlocked_reward_tow?: number | null;
};

export type ReadinessInput = {
  verified: boolean;
  proofStartedAt: string | null;
  lastScannedLedger: number | null;
  eventsCount: number;
  eventHistoryComplete: boolean;
  baselineComplete: boolean;
  lifecycleComplete: boolean;
  predictedAliveCount: number;
  predictedDisqualifiedCount: number;
  positions: ExistingProofPosition[];
  eventHistoryWarnings?: string[];
};

export type ReadinessReport = {
  safeToAutoApply: false;
  requiresManualReview: true;
  blockers: string[];
  warnings: string[];
  existing: {
    total: number;
    alive: number;
    disqualified: number;
    claimedOrPaid: number;
    withRemainingTow: number;
  };
  predicted: {
    alive: number;
    disqualified: number;
  };
};

export function assessProofMigration(input: ReadinessInput): ReadinessReport {
  const blockers: string[] = [];
  const warnings: string[] = [...(input.eventHistoryWarnings ?? [])];
  const positions = input.positions;
  const alive = positions.filter((p) => p.status === "alive").length;
  const disqualified = positions.filter((p) => p.status === "disqualified").length;
  const protectedPositions = positions.filter((p) =>
    ["claimed", "paid"].includes(p.status) ||
    Boolean(p.claimed_at || p.reward_sent_at || p.reward_tx_hash) ||
    (p.unlocked_reward_tow ?? 0) > 0 ||
    Boolean(p.reward_status && !["pending", "unclaimed"].includes(p.reward_status))
  );
  if (!input.verified) blockers.push("Wallet is not verified.");
  if (!input.proofStartedAt || !Number.isFinite(new Date(input.proofStartedAt).getTime()))
    blockers.push("Missing or invalid proof start timestamp.");
  if (!Number.isSafeInteger(input.lastScannedLedger) || (input.lastScannedLedger ?? 0) <= 0)
    blockers.push("Missing completed ledger checkpoint.");
  if (input.eventsCount <= 0) blockers.push("No recorded wallet events.");
  if (!input.eventHistoryComplete) blockers.push("Complete XRPL transaction history has not been verified.");
  if (!input.baselineComplete) blockers.push("Historical baseline reconstruction is incomplete.");
  if (!input.lifecycleComplete) blockers.push("Commitment lifecycle replay is incomplete.");
  if (protectedPositions.length > 0)
    blockers.push(`${protectedPositions.length} position(s) have claims, payments, or unlocked rewards requiring preservation.`);
  if (alive !== input.predictedAliveCount)
    blockers.push(`Alive commitment mismatch: stored ${alive}, predicted ${input.predictedAliveCount}.`);
  if (disqualified !== input.predictedDisqualifiedCount)
    warnings.push(`Disqualified commitment mismatch: stored ${disqualified}, predicted ${input.predictedDisqualifiedCount}.`);
  if (positions.some((p) => p.remaining_tow == null))
    warnings.push("Some existing positions lack remaining_tow and need a verified migration.");
  if (positions.some((p) => !Number.isFinite(new Date(p.created_at).getTime())))
    blockers.push("Existing positions contain invalid survival timestamps.");
  if (positions.some((p) => !Number.isFinite(p.tow_amount) || p.tow_amount < 0))
    blockers.push("Existing positions contain invalid token amounts.");

  // No automatic mutation path exists until an atomic database migration,
  // historical coverage verification and per-position identity mapping exist.
  blockers.push("Atomic database reconciliation and per-position identity mapping have not been implemented.");

  return {
    safeToAutoApply: false,
    requiresManualReview: true,
    blockers,
    warnings,
    existing: {
      total: positions.length,
      alive,
      disqualified,
      claimedOrPaid: protectedPositions.length,
      withRemainingTow: positions.filter((p) => p.remaining_tow != null).length,
    },
    predicted: {
      alive: input.predictedAliveCount,
      disqualified: input.predictedDisqualifiedCount,
    },
  };
}
