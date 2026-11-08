/**
 * Combine verified pre-proof inventory with post-proof events.
 * Read-only: synthetic opening inventory is NOT an XRPL transaction and
 * must never be persisted as one or used as a unique DB transaction ID.
 */
import { reconstructProofBaseline } from "./towProofBaseline";
import { replayProofCommitments, type ProofMovement } from "./towCommitmentLifecycle";

export type UnifiedProofPreview = {
  complete: boolean;
  warnings: string[];
  baseline: ReturnType<typeof reconstructProofBaseline>;
  lifecycle: ReturnType<typeof replayProofCommitments>;
  openingInventoryTxHash: string;
  safeToApply: false;
};

const OPENING_HASH = "F".repeat(64);

export function previewVerifiedProof(
  events: ProofMovement[],
  proofStartedAt: string,
  thresholdXrp = 50,
  historyVerifiedComplete = false
): UnifiedProofPreview {
  const baseline = reconstructProofBaseline(events, proofStartedAt, thresholdXrp);
  const warnings = [...baseline.warnings];
  if (!historyVerifiedComplete) {
    warnings.push("Full XRPL history and verification-time token balance have not been independently verified.");
  }
  if (events.some((e) => e.txHash.toUpperCase() === OPENING_HASH)) {
    warnings.push("Synthetic opening inventory hash collides with a real event.");
  }

  const firstPostLedger = baseline.postProofEvents.reduce(
    (min, e) => Math.min(min, e.ledgerIndex),
    Number.MAX_SAFE_INTEGER
  );
  const firstLedger = events.reduce((min, e) => Math.min(min, e.ledgerIndex), Number.MAX_SAFE_INTEGER);
  const openingLedger = Number.isSafeInteger(firstPostLedger) && firstPostLedger !== Number.MAX_SAFE_INTEGER
    ? firstPostLedger - 1
    : firstLedger === Number.MAX_SAFE_INTEGER ? 1 : firstLedger;
  if (openingLedger <= 0) warnings.push("Cannot place opening inventory before post-proof transactions.");

  const opening: ProofMovement[] = baseline.qualifyingTow > 0 && baseline.qualifyingXrpCost > 0
    ? [{
        txHash: OPENING_HASH,
        ledgerIndex: Math.max(1, openingLedger),
        eventAt: baseline.proofStartedAt,
        type: "buy",
        xrpValue: baseline.qualifyingXrpCost,
        towAmount: baseline.qualifyingTow,
      }]
    : [];

  // Pre-proof transferred-in balances remain nonqualifying. Their provenance
  // cannot be established from the synthetic opening purchase alone.
  if (baseline.nonqualifyingTow > 0) {
    warnings.push("Nonqualifying opening inventory requires manual attribution before applying post-proof outflows.");
  }
  if (baseline.qualifyingTow > 0 && baseline.qualifyingXrpCost <= 0) {
    warnings.push("Opening qualifying tokens have no valid XRP acquisition cost.");
  }

  const lifecycle = replayProofCommitments(
    [...opening, ...baseline.postProofEvents],
    thresholdXrp,
    proofStartedAt
  );

  warnings.push(...lifecycle.warnings);
  const complete = historyVerifiedComplete &&
    baseline.complete &&
    lifecycle.complete &&
    warnings.length === 0;

  return {
    complete,
    warnings,
    baseline,
    lifecycle,
    openingInventoryTxHash: OPENING_HASH,
    safeToApply: false,
  };
}
