/**
 * Read-only TOW movement reconciliation against account_tx metadata.
 * This is a conservative necessary-condition check, NOT a historical
 * certification: account_tx server ledger coverage, historical balances,
 * verification-time snapshots and exact FIFO lot origins remain unproven.
 */
import type { TowDeltaInspection } from "./towLedgerMovementInspection";

export type StoredTowMovement = {
  tx_hash: string;
  event_type: string;
  tow_amount: number | string | null;
};

export type TowMovementAudit = {
  readyForCertification: false;
  paginationExhausted: boolean;
  rpcMovementCount: number;
  storedEventCount: number;
  missingStoredMovements: string[];
  storedEventsWithoutRpcMovement: string[];
  untrustedRpcMovements: string[];
  amountMismatches: string[];
  duplicateRpcMovements: string[];
  duplicateStoredEvents: string[];
  blockers: string[];
};

const normalize = (s: string) => String(s ?? "").trim().toUpperCase();
const validHash = (s: string) => /^[A-F0-9]{64}$/.test(s);
const epsilon = 0.000001;

export function auditTowMovements(
  rpcMovements: TowDeltaInspection[],
  storedEvents: StoredTowMovement[],
  paginationExhausted: boolean,
  storedTruncated: boolean,
): TowMovementAudit {
  const blockers: string[] = [];
  const rpc = new Map<string, TowDeltaInspection>();
  const stored = new Map<string, StoredTowMovement>();
  const duplicateRpcMovements: string[] = [];
  const duplicateStoredEvents: string[] = [];
  const untrustedRpcMovements: string[] = [];
  const missingStoredMovements: string[] = [];
  const storedEventsWithoutRpcMovement: string[] = [];
  const amountMismatches: string[] = [];
  if (!paginationExhausted) blockers.push("XRPL account_tx pagination is incomplete.");
  if (storedTruncated) blockers.push("Stored wallet-event pagination is truncated.");
  for (const movement of rpcMovements) {
    const hash = normalize(movement.hash);
    if (!validHash(hash) || !movement.reliable || movement.deltaTow === null ||
        !Number.isFinite(movement.deltaTow)) {
      untrustedRpcMovements.push(hash);
    }
    if (rpc.has(hash)) duplicateRpcMovements.push(hash);
    rpc.set(hash, movement);
  }
  for (const event of storedEvents) {
    const hash = normalize(event.tx_hash);
    if (!validHash(hash)) blockers.push("Invalid stored transaction hash.");
    if (stored.has(hash)) duplicateStoredEvents.push(hash);
    stored.set(hash, event);
  }
  for (const [hash, movement] of rpc) {
    if (!movement.hasTowMovement) continue;
    const event = stored.get(hash);
    if (!event) { missingStoredMovements.push(hash); continue; }
    if (!movement.reliable || movement.deltaTow === null) continue;
    const amount = Number(event.tow_amount);
    const expectedType = movement.deltaTow > epsilon ? "buy" :
      movement.deltaTow < -epsilon ? "sell" : "none";
    // Direction and magnitude must agree. A neutral movement cannot be
    // certified as a purchase or sale.
    if (!Number.isFinite(amount) || amount < 0 ||
        expectedType === "none" || event.event_type !== expectedType ||
        Math.abs(amount - Math.abs(movement.deltaTow)) > epsilon) {
      amountMismatches.push(hash);
    }
  }
  for (const hash of stored.keys()) {
    const movement = rpc.get(hash);
    if (!movement || !movement.hasTowMovement) storedEventsWithoutRpcMovement.push(hash);
  }
  if (untrustedRpcMovements.length) blockers.push("Unreliable XRPL metadata or movement identity.");
  if (duplicateRpcMovements.length || duplicateStoredEvents.length)
    blockers.push("Duplicate XRPL or stored transaction identities.");
  if (missingStoredMovements.length) blockers.push("XRPL TOW movements missing from stored events.");
  if (storedEventsWithoutRpcMovement.length) blockers.push("Stored TOW events absent from retrieved XRPL movements.");
  if (amountMismatches.length) blockers.push("Stored event direction or TOW quantity differs from XRPL metadata.");
  blockers.push("Independent server ledger coverage and verification-time balances are not certified.");
  blockers.push("Purchase cost basis, DEX classification and FIFO commitment identities remain unverified.");
  return {
    readyForCertification: false, paginationExhausted, rpcMovementCount: rpcMovements.length,
    storedEventCount: storedEvents.length, missingStoredMovements,
    storedEventsWithoutRpcMovement, untrustedRpcMovements, amountMismatches,
    duplicateRpcMovements, duplicateStoredEvents, blockers,
  };
}
