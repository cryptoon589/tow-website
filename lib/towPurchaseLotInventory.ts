/**
 * Ledger-cost FIFO inventory. Read-only accounting primitive.
 * Preserves individual purchase lots rather than blending prices, and
 * attributes outgoing TOW to the oldest acquired lot first.
 * Does NOT decide whether a commitment can be migrated or paid.
 */
import type { ProofMovement } from "./towCommitmentLifecycle";

export type InventoryLot = {
  txHash: string;
  acquiredAt: string;
  acquiredLedger: number;
  originalTow: number;
  originalCostXrp: number;
  remainingTow: number;
  remainingCostXrp: number;
};
export type InventoryConsumption = {
  outgoingTxHash: string;
  sourceTxHash: string;
  towConsumed: number;
  xrpCostConsumed: number;
};
export type InventoryReplay = {
  complete: boolean;
  warnings: string[];
  lots: InventoryLot[];
  consumed: InventoryConsumption[];
  nonqualifyingTow: number;
  totalRemainingTow: number;
  totalRemainingXrpCost: number;
};
const EPS = 1e-8;
const precision = (n: number) => Number(n.toFixed(10));

export function replayPurchaseLots(events: ProofMovement[]): InventoryReplay {
  const warnings: string[] = [];
  const seen = new Set<string>();
  const lots: InventoryLot[] = [];
  const consumed: InventoryConsumption[] = [];
  let nonqualifyingTow = 0;
  const ordered = [...events].sort((a,b) =>
    a.ledgerIndex - b.ledgerIndex ||
    (a.transactionIndex ?? 0) - (b.transactionIndex ?? 0) ||
    a.txHash.localeCompare(b.txHash)
  );
  for (const event of ordered) {
    const hash = String(event.txHash ?? "").toUpperCase();
    if (!/^[0-9A-F]{64}$/.test(hash) ||
      !Number.isSafeInteger(event.ledgerIndex) || event.ledgerIndex <= 0 ||
      !Number.isFinite(new Date(event.eventAt).getTime()) ||
      !Number.isFinite(event.towAmount) || event.towAmount <= 0 ||
      !Number.isFinite(event.xrpValue) || event.xrpValue < 0 ||
      !Number.isSafeInteger(event.transactionIndex ?? 0) ||
      (event.transactionIndex ?? 0) < 0) {
      warnings.push(`Invalid movement: ${hash}`);
      continue;
    }
    if (seen.has(hash)) {
      warnings.push(`Duplicate movement: ${hash}`);
      continue;
    }
    seen.add(hash);
    if (event.type === "buy") {
      if (event.xrpValue <= EPS) {
        warnings.push(`Purchase missing XRP cost: ${hash}`);
        continue;
      }
      lots.push({
        txHash: hash, acquiredAt: event.eventAt, acquiredLedger: event.ledgerIndex,
        originalTow: event.towAmount, originalCostXrp: event.xrpValue,
        remainingTow: event.towAmount, remainingCostXrp: event.xrpValue,
      });
      continue;
    }
    if (event.type === "transfer_in" || event.type === "reward") {
      nonqualifyingTow += event.towAmount;
      continue;
    }
    if (event.type !== "sell" && event.type !== "transfer_out") {
      warnings.push(`Unknown movement: ${hash}`);
      continue;
    }
    if (nonqualifyingTow > EPS && lots.some(lot => lot.remainingTow > EPS)) {
      warnings.push(`Ambiguous mixed purchase/transfer provenance: ${hash}`);
    }
    let remaining = event.towAmount;
    for (const lot of lots) {
      if (remaining <= EPS) break;
      if (lot.remainingTow <= EPS) continue;
      const take = Math.min(remaining, lot.remainingTow);
      const cost = lot.remainingCostXrp * take / lot.remainingTow;
      lot.remainingTow = precision(Math.max(0, lot.remainingTow - take));
      lot.remainingCostXrp = precision(Math.max(0, lot.remainingCostXrp - cost));
      consumed.push({
        outgoingTxHash: hash, sourceTxHash: lot.txHash,
        towConsumed: precision(take), xrpCostConsumed: precision(cost),
      });
      remaining -= take;
    }
    if (remaining > EPS) {
      const take = Math.min(remaining, nonqualifyingTow);
      nonqualifyingTow = precision(Math.max(0, nonqualifyingTow - take));
      remaining -= take;
    }
    if (remaining > EPS) warnings.push(`Outgoing TOW exceeds inventory: ${hash}`);
  }
  return {
    complete: warnings.length === 0, warnings, lots, consumed,
    nonqualifyingTow: precision(nonqualifyingTow),
    totalRemainingTow: precision(lots.reduce((s,l) => s + l.remainingTow,0)),
    totalRemainingXrpCost: precision(lots.reduce((s,l) => s + l.remainingCostXrp,0)),
  };
}
