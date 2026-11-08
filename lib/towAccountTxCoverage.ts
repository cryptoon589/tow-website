/**
 * Read-only XRPL account_tx coverage inspection.
 * Compare the transaction hashes returned by a COMPLETE account_tx pagination
 * with recorded wallet-event hashes. account_tx includes non-TOW transactions:
 * extra RPC hashes are candidates for classification, NOT missing TOW events.
 */
export type AccountTxCoverage = {
  completePagination: boolean;
  rpcTransactionCount: number;
  storedEventCount: number;
  storedHashesNotFoundOnRpc: string[];
  rpcHashesNotStoredAsTowEvents: string[];
  duplicateRpcHashes: string[];
  duplicateStoredHashes: string[];
  verifiedComplete: false;
  warnings: string[];
};

export function inspectAccountTxCoverage(
  rpcHashes: string[],
  storedEventHashes: string[],
  paginationExhausted: boolean
): AccountTxCoverage {
  const normalize = (hash: string) => String(hash).trim().toUpperCase();
  const valid = (hash: string) => /^[0-9A-F]{64}$/.test(hash);
  const rpc = rpcHashes.map(normalize);
  const stored = storedEventHashes.map(normalize);
  const rpcSet = new Set(rpc);
  const storedSet = new Set(stored);
  const duplicateRpcHashes = [...new Set(rpc.filter((hash, i) => rpc.indexOf(hash) !== i))];
  const duplicateStoredHashes = [...new Set(stored.filter((hash, i) => stored.indexOf(hash) !== i))];
  const storedHashesNotFoundOnRpc = [...storedSet].filter((hash) => !rpcSet.has(hash));
  const rpcHashesNotStoredAsTowEvents = [...rpcSet].filter((hash) => !storedSet.has(hash));
  const warnings: string[] = [];
  if (!paginationExhausted) warnings.push("account_tx pagination incomplete; RPC transaction list is partial.");
  if (rpc.some((hash) => !valid(hash)) || stored.some((hash) => !valid(hash)))
    warnings.push("Invalid transaction hashes detected.");
  if (duplicateRpcHashes.length) warnings.push("Duplicate RPC transaction hashes detected.");
  if (duplicateStoredHashes.length) warnings.push("Duplicate stored event hashes detected.");
  if (storedHashesNotFoundOnRpc.length)
    warnings.push("Stored wallet-event hashes absent from retrieved RPC account history.");
  warnings.push("Non-TOW account transactions require classification before completeness can be proven.");
  warnings.push("Historical TOW balances and the verification-time ledger remain unverified.");
  return {
    completePagination: paginationExhausted,
    rpcTransactionCount: rpc.length,
    storedEventCount: stored.length,
    storedHashesNotFoundOnRpc,
    rpcHashesNotStoredAsTowEvents,
    duplicateRpcHashes,
    duplicateStoredHashes,
    verifiedComplete: false,
    warnings,
  };
}
