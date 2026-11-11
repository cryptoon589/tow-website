import { assessHistoryCoverage, type HistoryCoverageEvidence } from "./towHistoryCoverage";

/** Independent evidence required before a wallet may be certified for FIFO. */
export type CertificationEvidence = HistoryCoverageEvidence & {
  proofVerified: boolean;
  existingLegacyPositions: number;
  legacyPositionsReconciled: boolean;
  validatedTransactionCount: number;
  unvalidatedTransactionCount: number;
  duplicateTransactionHashes: number;
  proofLedgerIndependentlyVerified: boolean;
  tokenBalanceIndependentlyVerified: boolean;
};

export function evaluateCertificationEvidence(e: CertificationEvidence) {
  const report = assessHistoryCoverage(e);
  const blockers = [...report.blockers];
  if (!e.proofVerified) blockers.push("Player proof is not verified.");
  if (!e.proofLedgerIndependentlyVerified) blockers.push("Proof-start ledger is not independently verified.");
  if (!e.tokenBalanceIndependentlyVerified) blockers.push("Verification-time token balance is not independently verified.");
  if (!Number.isSafeInteger(e.validatedTransactionCount) || e.validatedTransactionCount < 0 ||
      e.validatedTransactionCount !== e.eventCountFromRpc + (e.validatedTransactionCount - e.eventCountFromRpc)) {
    blockers.push("Invalid validated transaction count.");
  }
  if (e.unvalidatedTransactionCount !== 0) blockers.push("Unvalidated XRPL transactions present.");
  if (e.duplicateTransactionHashes !== 0) blockers.push("Duplicate XRPL transactions present.");
  if (e.existingLegacyPositions > 0 && !e.legacyPositionsReconciled)
    blockers.push("Existing positions require explicit reconciliation.");
  return { eligible: blockers.length === 0, blockers, balanceDifference: report.balanceDifference };
}
