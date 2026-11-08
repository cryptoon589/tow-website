/**
 * Reconstruct a wallet's qualifying acquisition inventory at proof verification.
 * This is a READ-ONLY preview. It requires complete pre-verification XRPL history.
 * Outgoing tokens consume earliest qualifying purchases first; transferred-in
 * holdings are not eligible for XRP-purchase commitments.
 */
import type { ProofMovement } from "./towCommitmentLifecycle";

export type BaselineLot = {
  sourceTxHash: string;
  acquiredAt: string;
  remainingTow: number;
  remainingXrpCost: number;
};

export type ProofBaseline = {
  complete: boolean;
  warnings: string[];
  proofStartedAt: string;
  qualifyingTow: number;
  qualifyingXrpCost: number;
  nonqualifyingTow: number;
  commitmentsAtStart: number;
  lots: BaselineLot[];
  postProofEvents: ProofMovement[];
};

const EPS = 1e-7;

export function reconstructProofBaseline(
  events: ProofMovement[],
  proofStartedAt: string,
  thresholdXrp = 50
): ProofBaseline {
  const cutoff = new Date(proofStartedAt).getTime();
  if (!Number.isFinite(cutoff) || !Number.isFinite(thresholdXrp) || thresholdXrp <= 0) {
    throw new Error("Invalid proof start or threshold");
  }
  const warnings: string[] = [];
  let complete = true;
  const seen = new Set<string>();
  const lots: BaselineLot[] = [];
  let nonqualifyingTow = 0;
  const postProofEvents: ProofMovement[] = [];

  const ordered = [...events].sort((a, b) =>
    a.ledgerIndex - b.ledgerIndex ||
    (a.transactionIndex ?? 0) - (b.transactionIndex ?? 0) ||
    a.txHash.localeCompare(b.txHash)
  );

  for (const event of ordered) {
    const hash = String(event.txHash).toUpperCase();
    const time = new Date(event.eventAt).getTime();
    if (!/^[0-9A-F]{64}$/.test(hash) || !Number.isSafeInteger(event.ledgerIndex) ||
        event.ledgerIndex <= 0 || !Number.isFinite(time) ||
        !Number.isFinite(event.towAmount) || event.towAmount < 0 ||
        !Number.isFinite(event.xrpValue) || event.xrpValue < 0) {
      complete = false;
      warnings.push(`Invalid or undated event: ${hash}`);
      continue;
    }
    if (seen.has(hash)) {
      complete = false;
      warnings.push(`Duplicate event: ${hash}`);
      continue;
    }
    seen.add(hash);
    if (time >= cutoff) {
      postProofEvents.push(event);
      continue;
    }
    if (event.type === "buy") {
      if (event.xrpValue <= EPS || event.towAmount <= EPS) {
        complete = false;
        warnings.push(`Invalid buy: ${hash}`);
      } else {
        lots.push({
          sourceTxHash: hash,
          acquiredAt: event.eventAt,
          remainingTow: event.towAmount,
          remainingXrpCost: event.xrpValue,
        });
      }
    } else if (event.type === "transfer_in" || event.type === "reward") {
      nonqualifyingTow += event.towAmount;
    } else if (event.type === "sell" || event.type === "transfer_out") {
      if (nonqualifyingTow > EPS && lots.some((lot) => lot.remainingTow > EPS)) {
        complete = false;
        warnings.push(`Ambiguous mixed qualifying and nonqualifying inventory: ${hash}`);
      }
      let remaining = event.towAmount;
      for (const lot of lots) {
        if (remaining <= EPS) break;
        if (lot.remainingTow <= EPS) continue;
        const consumed = Math.min(remaining, lot.remainingTow);
        const removedCost = lot.remainingXrpCost * consumed / lot.remainingTow;
        lot.remainingTow = Math.max(0, lot.remainingTow - consumed);
        lot.remainingXrpCost = Math.max(0, lot.remainingXrpCost - removedCost);
        remaining -= consumed;
      }
      const fromNonqualifying = Math.min(remaining, nonqualifyingTow);
      nonqualifyingTow -= fromNonqualifying;
      remaining -= fromNonqualifying;
      if (remaining > EPS) {
        complete = false;
        warnings.push(`Unexplained pre-proof outflow: ${hash}`);
      }
    } else {
      complete = false;
      warnings.push(`Unknown event type: ${hash}`);
    }
  }

  const qualifyingTow = lots.reduce((sum, lot) => sum + lot.remainingTow, 0);
  const qualifyingXrpCost = lots.reduce((sum, lot) => sum + lot.remainingXrpCost, 0);
  return {
    complete,
    warnings,
    proofStartedAt: new Date(cutoff).toISOString(),
    qualifyingTow,
    qualifyingXrpCost,
    nonqualifyingTow,
    commitmentsAtStart: Math.floor((qualifyingXrpCost + EPS) / thresholdXrp),
    lots,
    postProofEvents,
  };
}
