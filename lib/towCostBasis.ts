/**
 * Deterministic, read-only cost-basis reconciliation.
 *
 * The input must be a COMPLETE, correctly classified wallet history.
 * This module does not infer missing transactions or mutate positions.
 */
export type LedgerMovement = {
  txHash: string;
  ledgerIndex: number;
  transactionIndex?: number | null;
  eventAt: string | null;
  type: "buy" | "sell" | "transfer_in" | "transfer_out" | "reward";
  xrpValue: number;
  towAmount: number;
};

export type CostLot = {
  txHash: string;
  ledgerIndex: number;
  acquiredAt: string | null;
  originalTow: number;
  remainingTow: number;
  originalXrp: number;
  remainingXrp: number;
};

export type MovementAudit = {
  txHash: string;
  type: LedgerMovement["type"];
  ledgerIndex: number;
  eventAt: string | null;
  costRemovedXrp: number;
  unaccountedTow: number;
  remainingQualifyingTow: number;
  remainingCostXrp: number;
  qualifyingCommitments: number;
};

export type CostBasisAudit = {
  complete: boolean;
  warnings: string[];
  lots: CostLot[];
  movements: MovementAudit[];
  remainingQualifyingTow: number;
  remainingCostXrp: number;
  qualifyingCommitments: number;
};

const EPS = 0.000001;

export function reconcileCostBasis(
  movements: LedgerMovement[],
  thresholdXrp = 50
): CostBasisAudit {
  if (!Number.isFinite(thresholdXrp) || thresholdXrp <= 0) {
    throw new Error("Invalid commitment threshold");
  }

  const warnings: string[] = [];
  const seen = new Set<string>();
  const lots: CostLot[] = [];
  const audit: MovementAudit[] = [];
  const ordered = [...movements].sort((a, b) =>
    a.ledgerIndex - b.ledgerIndex ||
    (a.transactionIndex ?? 0) - (b.transactionIndex ?? 0) ||
    a.txHash.localeCompare(b.txHash)
  );

  let unqualifiedBalance = 0;
  let complete = true;

  for (const event of ordered) {
    if (!/^[a-fA-F0-9]{64}$/.test(event.txHash) ||
        !Number.isSafeInteger(event.ledgerIndex) || event.ledgerIndex <= 0 ||
        !Number.isFinite(event.towAmount) || event.towAmount < 0 ||
        !Number.isFinite(event.xrpValue) || event.xrpValue < 0) {
      complete = false;
      warnings.push(`Invalid ledger event: ${event.txHash}`);
      continue;
    }
    const hash = event.txHash.toUpperCase();
    if (seen.has(hash)) {
      complete = false;
      warnings.push(`Duplicate transaction: ${hash}`);
      continue;
    }
    seen.add(hash);

    if (!event.eventAt || !Number.isFinite(new Date(event.eventAt).getTime())) {
      complete = false;
      warnings.push(`Missing verified ledger time: ${hash}`);
    }

    let costRemovedXrp = 0;
    let unaccountedTow = 0;
    if (event.type === "buy") {
      if (event.towAmount > EPS && event.xrpValue > EPS) {
        lots.push({
          txHash: hash,
          ledgerIndex: event.ledgerIndex,
          acquiredAt: event.eventAt,
          originalTow: event.towAmount,
          remainingTow: event.towAmount,
          originalXrp: event.xrpValue,
          remainingXrp: event.xrpValue,
        });
      } else {
        complete = false;
        warnings.push(`Buy missing amount or XRP consideration: ${hash}`);
      }
    } else if (event.type === "transfer_in" || event.type === "reward") {
      unqualifiedBalance += event.towAmount;
    } else if (event.type === "sell" || event.type === "transfer_out") {
      // Consume qualifying acquisition lots FIFO, preserving their actual XRP
      // cost basis. XRP proceeds from a sale never reduce historical cost.
      // Consume known nonqualifying tokens first to avoid falsely reducing
      // reward eligibility for transferred-in holdings.
      let remaining = event.towAmount;
      if (unqualifiedBalance > EPS && lots.some((lot) => lot.remainingTow > EPS)) {
        complete = false;
        warnings.push(`Mixed acquired and transferred holdings at ${hash}; allocation requires a declared policy and wallet reconciliation`);
      }
      const nonqualifyingUsed = Math.min(remaining, unqualifiedBalance);
      unqualifiedBalance -= nonqualifyingUsed;
      remaining -= nonqualifyingUsed;
      for (const lot of lots) {
        if (remaining <= EPS) break;
        if (lot.remainingTow <= EPS) continue;
        const used = Math.min(remaining, lot.remainingTow);
        const removed = lot.remainingXrp * (used / lot.remainingTow);
        lot.remainingTow = Math.max(0, lot.remainingTow - used);
        lot.remainingXrp = Math.max(0, lot.remainingXrp - removed);
        costRemovedXrp += removed;
        remaining -= used;
      }
      if (remaining > EPS) {
        unaccountedTow = remaining;
        complete = false;
        warnings.push(`Outgoing TOW exceeds recorded inventory by ${remaining.toFixed(6)} at ${hash}; wallet history may be incomplete`);
      }
    } else {
      complete = false;
      warnings.push(`Unknown event type at ${hash}`);
    }

    const remainingQualifyingTow = lots.reduce((sum, lot) => sum + lot.remainingTow, 0);
    const remainingCostXrp = lots.reduce((sum, lot) => sum + lot.remainingXrp, 0);
    audit.push({
      txHash: hash,
      type: event.type,
      ledgerIndex: event.ledgerIndex,
      eventAt: event.eventAt,
      costRemovedXrp,
      unaccountedTow,
      remainingQualifyingTow,
      remainingCostXrp,
      qualifyingCommitments: Math.floor((remainingCostXrp + EPS) / thresholdXrp),
    });
  }

  const remainingQualifyingTow = lots.reduce((sum, lot) => sum + lot.remainingTow, 0);
  const remainingCostXrp = lots.reduce((sum, lot) => sum + lot.remainingXrp, 0);

  return {
    complete,
    warnings,
    lots,
    movements: audit,
    remainingQualifyingTow,
    remainingCostXrp,
    qualifyingCommitments: Math.floor((remainingCostXrp + EPS) / thresholdXrp),
  };
}
