/**
 * Conservative read-only mapping of opening (pre-verification) commitments
 * onto existing position UUIDs. Never matches by row order, counts or amounts
 * alone: source-lot provenance must be stored and unambiguous.
 */
import type { OpeningCommitment } from "./towOpeningCommitmentAllocation";
import type { StoredCommitment } from "./towIdentityReconciliation";

export type OpeningIdentityReport = {
  safeToApply: false;
  exactMatches: { positionId: string; openingOrdinal: number }[];
  unmatchedPositions: string[];
  unmatchedOpenings: number[];
  blockers: string[];
};

const EPS = 1e-6;
const protectedPosition = (p: StoredCommitment) =>
  p.status === "claimed" || p.status === "paid" ||
  Boolean(p.claimed_at || p.reward_sent_at || p.reward_tx_hash) ||
  (p.unlocked_reward_tow ?? 0) > 0;

export function reconcileOpeningIdentities(
  stored: StoredCommitment[],
  opening: OpeningCommitment[]
): OpeningIdentityReport {
  const blockers: string[] = [];
  const exactMatches: { positionId: string; openingOrdinal: number }[] = [];
  const matched = new Set<string>();
  const matchedOpening = new Set<number>();
  const ids = new Set<string>();
  for (const p of stored) {
    if (ids.has(p.id)) blockers.push(`Duplicate position UUID: ${p.id}`);
    ids.add(p.id);
    if (protectedPosition(p)) blockers.push(`Protected position cannot be remapped: ${p.id}`);
  }
  for (const o of opening) {
    // A single purchase transaction can fund several 50 XRP commitments.
    // The legacy buy_tx_hash field cannot identify a slice uniquely.
    if (o.slices.length !== 1) {
      blockers.push(`Opening commitment ${o.ordinal} has multi-lot provenance; manual mapping required.`);
      continue;
    }
    const slice = o.slices[0];
    const candidates = stored.filter(p =>
      !protectedPosition(p) &&
      p.buy_tx_hash.toUpperCase() === slice.sourceTxHash.toUpperCase() &&
      Math.abs(p.tow_amount - o.originalTow) <= EPS &&
      Math.abs(p.buy_value_xrp - o.costXrp) <= EPS
    );
    if (candidates.length !== 1) {
      blockers.push(`Opening commitment ${o.ordinal} has ${candidates.length} exact candidates.`);
      continue;
    }
    const p = candidates[0];
    if (matched.has(p.id)) {
      blockers.push(`Position ${p.id} matches multiple opening commitments.`);
      continue;
    }
    matched.add(p.id);
    matchedOpening.add(o.ordinal);
    exactMatches.push({ positionId: p.id, openingOrdinal: o.ordinal });
  }
  const unmatchedPositions = stored.filter(p => !matched.has(p.id)).map(p => p.id);
  const unmatchedOpenings = opening.filter(o => !matchedOpening.has(o.ordinal)).map(o => o.ordinal);
  if (unmatchedPositions.length || unmatchedOpenings.length)
    blockers.push("Unmatched existing or reconstructed commitments must not be overwritten.");
  blockers.push("Historical XRPL completeness, verification-time balance and atomic write authorization are not proven.");
  return { safeToApply: false, exactMatches, unmatchedPositions, unmatchedOpenings, blockers };
}
