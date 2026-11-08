/**
 * Pure fail-closed historical coverage gate for Proof of Tiredness.
 * A scanner checkpoint alone is NOT evidence of complete wallet history.
 * No RPC requests or database writes are performed here.
 */
export type HistoryCoverageEvidence = {
  walletAddress: string;
  firstAvailableLedger: number | null;
  firstWalletLedger: number | null;
  verificationLedger: number | null;
  scannedFromLedger: number | null;
  scannedThroughLedger: number | null;
  rpcMarkerExhausted: boolean;
  ledgerRangeValidated: boolean;
  eventCountFromRpc: number | null;
  eventCountStored: number | null;
  tokenBalanceAtVerification: number | null;
  reconstructedBalanceAtVerification: number | null;
  unclassifiedTowMovements: number;
  timestampMismatches: number;
  conflictingTxHashes: number;
};

export type HistoryCoverageReport = {
  verifiedComplete: boolean;
  blockers: string[];
  balanceDifference: number | null;
};

export function assessHistoryCoverage(e: HistoryCoverageEvidence): HistoryCoverageReport {
  const blockers: string[] = [];
  const integer = (n: number | null): n is number => n !== null && Number.isSafeInteger(n) && n > 0;
  if (!integer(e.firstAvailableLedger) || !integer(e.firstWalletLedger) ||
      !integer(e.verificationLedger) || !integer(e.scannedFromLedger) ||
      !integer(e.scannedThroughLedger)) {
    blockers.push("Missing validated ledger boundaries.");
  } else {
    if (e.firstAvailableLedger > e.firstWalletLedger)
      blockers.push("RPC server history starts after the wallet's earliest transaction.");
    if (e.scannedFromLedger > e.firstWalletLedger)
      blockers.push("Wallet scan starts after the wallet's earliest transaction.");
    if (e.scannedThroughLedger < e.verificationLedger)
      blockers.push("Wallet scan does not reach the verification ledger.");
  }
  if (!e.rpcMarkerExhausted) blockers.push("XRPL account_tx pagination is incomplete.");
  if (!e.ledgerRangeValidated) blockers.push("XRPL ledger range was not independently validated.");
  if (e.eventCountFromRpc === null || e.eventCountStored === null ||
      !Number.isSafeInteger(e.eventCountFromRpc) || !Number.isSafeInteger(e.eventCountStored) ||
      e.eventCountFromRpc < 0 || e.eventCountStored < 0 ||
      e.eventCountFromRpc !== e.eventCountStored) {
    blockers.push("RPC and stored TOW event counts are not verified equal.");
  }
  if (e.unclassifiedTowMovements !== 0)
    blockers.push("Some TOW movements could not be classified.");
  if (e.timestampMismatches !== 0)
    blockers.push("Transaction timestamps are inconsistent with XRPL.");
  if (e.conflictingTxHashes !== 0)
    blockers.push("Duplicate or conflicting transaction hashes were found.");

  const validBalances = e.tokenBalanceAtVerification !== null &&
    e.reconstructedBalanceAtVerification !== null &&
    Number.isFinite(e.tokenBalanceAtVerification) &&
    Number.isFinite(e.reconstructedBalanceAtVerification) &&
    e.tokenBalanceAtVerification >= 0 &&
    e.reconstructedBalanceAtVerification >= 0;
  const balanceDifference = validBalances
    ? e.reconstructedBalanceAtVerification! - e.tokenBalanceAtVerification!
    : null;
  if (balanceDifference === null || Math.abs(balanceDifference) > 0.000001)
    blockers.push("Reconstructed token balance does not match an independently verified verification-time balance.");

  return { verifiedComplete: blockers.length === 0, blockers, balanceDifference };
}
