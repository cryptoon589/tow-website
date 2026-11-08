/**
 * Build a conservative, read-only identity reconciliation report.
 * Legacy synthetic IDs cannot safely be matched by purchase tx alone.
 * No updates, deletions, or claim rewrites are produced.
 */
import type { ProofCommitment } from "./towCommitmentLifecycle";

export type StoredCommitment = {
  id: string;
  buy_tx_hash: string;
  status: string;
  created_at: string;
  tow_amount: number;
  buy_value_xrp: number;
  claimed_at?: string | null;
  reward_tx_hash?: string | null;
  reward_sent_at?: string | null;
  unlocked_reward_tow?: number | null;
};

export type IdentityMatch = {
  storedId: string;
  previewId: string;
  confidence: "exact";
};

export type IdentityReconciliation = {
  safeToApply: false;
  matches: IdentityMatch[];
  unmatchedStored: string[];
  unmatchedPreview: string[];
  protectedStored: string[];
  blockers: string[];
};

const EPS = 1e-6;

export function reconcileCommitmentIdentities(
  stored: StoredCommitment[],
  preview: ProofCommitment[]
): IdentityReconciliation {
  const blockers: string[] = [];
  const matches: IdentityMatch[] = [];
  const protectedStored: string[] = [];
  const matchedStored = new Set<string>();
  const matchedPreview = new Set<string>();

  const storedIds = new Set<string>();
  for (const row of stored) {
    if (storedIds.has(row.id)) blockers.push(`Duplicate stored position id: ${row.id}`);
    storedIds.add(row.id);
    if (row.status === "claimed" || row.status === "paid" ||
        Boolean(row.claimed_at || row.reward_sent_at || row.reward_tx_hash) ||
        (row.unlocked_reward_tow ?? 0) > 0) {
      protectedStored.push(row.id);
    }
  }
  const previewIds = new Set<string>();
  for (const row of preview) {
    if (previewIds.has(row.id)) blockers.push(`Duplicate preview commitment id: ${row.id}`);
    previewIds.add(row.id);
  }

  // Require exact, uniquely identifying source purchase tx + timestamp + original
  // token amount + original cost + status. Never infer identity from order.
  for (const proposed of preview) {
    const candidates = stored.filter((row) =>
      !matchedStored.has(row.id) &&
      row.buy_tx_hash.toUpperCase() === proposed.sourceTxHash.toUpperCase() &&
      new Date(row.created_at).getTime() === new Date(proposed.createdAt).getTime() &&
      Math.abs(row.tow_amount - proposed.originalTow) <= EPS &&
      Math.abs(row.buy_value_xrp - proposed.costXrp) <= EPS &&
      row.status === proposed.status
    );
    if (candidates.length === 1 && !protectedStored.includes(candidates[0].id)) {
      matches.push({ storedId: candidates[0].id, previewId: proposed.id, confidence: "exact" });
      matchedStored.add(candidates[0].id);
      matchedPreview.add(proposed.id);
    } else if (candidates.length > 1) {
      blockers.push(`Ambiguous stored position identity for ${proposed.id}`);
    }
  }
  const unmatchedStored = stored.filter((row) => !matchedStored.has(row.id)).map((row) => row.id);
  const unmatchedPreview = preview.filter((row) => !matchedPreview.has(row.id)).map((row) => row.id);
  if (protectedStored.length) blockers.push("Claimed or rewarded positions must be preserved without reassignment.");
  if (unmatchedStored.length || unmatchedPreview.length) {
    blockers.push("Unmatched position identities require manual mapping or a staged migration.");
  }
  // Even exact matches cannot be written until database locking, history
  // coverage, idempotency, and payout preservation have been independently proven.
  blockers.push("Atomic reconciliation and historical ledger coverage are not yet established.");
  return { safeToApply: false, matches, unmatchedStored, unmatchedPreview, protectedStored, blockers };
}
