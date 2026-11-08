/**
 * Read-only deterministic allocation of surviving purchase lots into 50 XRP
 * opening commitments. Preserves source-lot provenance and acquisition prices.
 * No persistence and no mapping to existing position UUIDs.
 */
import type { BaselineLot } from "./towProofBaseline";

export type OpeningSlice = {
  sourceTxHash: string;
  towAmount: number;
  costXrp: number;
};
export type OpeningCommitment = {
  ordinal: number;
  costXrp: number;
  originalTow: number;
  slices: OpeningSlice[];
};
export type OpeningAllocation = {
  complete: boolean;
  warnings: string[];
  commitments: OpeningCommitment[];
  uncommittedSlices: OpeningSlice[];
  uncommittedCostXrp: number;
  uncommittedTow: number;
};
const EPS = 1e-8;
const round = (n: number) => Number(n.toFixed(10));

export function allocateOpeningCommitments(
  lots: BaselineLot[],
  thresholdXrp = 50
): OpeningAllocation {
  if (!Number.isFinite(thresholdXrp) || thresholdXrp <= 0)
    throw new Error("Invalid commitment threshold");
  const warnings: string[] = [];
  const commitments: OpeningCommitment[] = [];
  const uncommittedSlices: OpeningSlice[] = [];
  const seen = new Set<string>();
  let current: OpeningSlice[] = [];
  let cost = 0;
  let tow = 0;
  for (const lot of lots) {
    const hash = String(lot.sourceTxHash ?? "").toUpperCase();
    if (!/^[0-9A-F]{64}$/.test(hash) || seen.has(hash) ||
      !Number.isFinite(new Date(lot.acquiredAt).getTime()) ||
      !Number.isFinite(lot.remainingTow) || lot.remainingTow < 0 ||
      !Number.isFinite(lot.remainingXrpCost) || lot.remainingXrpCost < 0 ||
      (lot.remainingTow <= EPS) !== (lot.remainingXrpCost <= EPS)) {
      warnings.push(`Invalid or duplicate surviving purchase lot: ${hash}`);
      continue;
    }
    seen.add(hash);
    let lotTow = lot.remainingTow;
    let lotCost = lot.remainingXrpCost;
    while (lotCost > EPS) {
      const required = thresholdXrp - cost;
      const takeCost = Math.min(required, lotCost);
      const takeTow = lotTow * (takeCost / lotCost);
      current.push({ sourceTxHash: hash, costXrp: round(takeCost), towAmount: round(takeTow) });
      cost += takeCost;
      tow += takeTow;
      lotCost -= takeCost;
      lotTow -= takeTow;
      if (cost + EPS >= thresholdXrp) {
        commitments.push({
          ordinal: commitments.length + 1,
          costXrp: thresholdXrp,
          originalTow: round(tow),
          slices: current,
        });
        current = [];
        cost = 0;
        tow = 0;
      }
    }
  }
  uncommittedSlices.push(...current);
  return {
    complete: warnings.length === 0,
    warnings,
    commitments,
    uncommittedSlices,
    uncommittedCostXrp: round(cost),
    uncommittedTow: round(tow),
  };
}
