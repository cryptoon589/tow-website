/** Exact, read-only comparison of independent XRPL TOW deltas and stored events. */
export type RpcTowMovement = { hash: string; ledgerIndex: number; deltaTow: number };
export type StoredTowMovement = { txHash: string; ledgerIndex: number | null; eventType: string; towAmount: number };

export function compareTowMovements(rpc: RpcTowMovement[], stored: StoredTowMovement[]) {
  const blockers: string[] = [];
  const rpcMap = new Map<string, RpcTowMovement>();
  const storedMap = new Map<string, StoredTowMovement>();
  for (const movement of rpc) {
    const hash = String(movement.hash).toUpperCase();
    if (!/^[0-9A-F]{64}$/.test(hash) || rpcMap.has(hash) ||
        !Number.isSafeInteger(movement.ledgerIndex) || movement.ledgerIndex <= 0 ||
        !Number.isFinite(movement.deltaTow) || Math.abs(movement.deltaTow) <= 0.000001)
      blockers.push(`Invalid or duplicate RPC movement: ${hash}`);
    else rpcMap.set(hash, movement);
  }
  for (const event of stored) {
    const hash = String(event.txHash).toUpperCase();
    if (!/^[0-9A-F]{64}$/.test(hash) || storedMap.has(hash) ||
        !Number.isSafeInteger(event.ledgerIndex) || Number(event.ledgerIndex) <= 0 ||
        !Number.isFinite(event.towAmount) || event.towAmount <= 0 ||
        !["buy","sell","transfer_in","transfer_out","reward"].includes(event.eventType))
      blockers.push(`Invalid or duplicate stored event: ${hash}`);
    else storedMap.set(hash, event);
  }
  for (const [hash, movement] of rpcMap) {
    const event = storedMap.get(hash);
    if (!event) { blockers.push(`Missing stored TOW event: ${hash}`); continue; }
    const signedAmount = ["buy","transfer_in","reward"].includes(event.eventType)
      ? event.towAmount : -event.towAmount;
    if (movement.ledgerIndex !== event.ledgerIndex || Math.abs(movement.deltaTow - signedAmount) > 0.000001)
      blockers.push(`Ledger or amount mismatch: ${hash}`);
  }
  for (const hash of storedMap.keys())
    if (!rpcMap.has(hash)) blockers.push(`Stored event absent from XRPL movement history: ${hash}`);
  return { matches: blockers.length === 0, blockers, rpcCount: rpcMap.size, storedCount: storedMap.size };
}
