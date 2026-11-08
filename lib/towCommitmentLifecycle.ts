/**
 * Deterministic simulation of Proof of Tiredness commitment lifecycles.
 * No database access or writes. Only replay VERIFIED, complete ledger history.
 *
 * Each qualifying 50 XRP of acquired TOW creates an independently tracked
 * commitment. Sales and transfers out touch oldest qualifying TOW first.
 * A touched commitment is permanently disqualified, even if tokens are
 * later repurchased. This is intentionally stricter than a portfolio-level
 * cost-basis check.
 */
export type ProofMovement = {
  txHash: string;
  ledgerIndex: number;
  transactionIndex?: number;
  eventAt: string;
  type: "buy" | "sell" | "transfer_in" | "transfer_out" | "reward";
  xrpValue: number;
  towAmount: number;
};

export type ProofCommitment = {
  id: string;
  createdAt: string;
  sourceTxHash: string;
  originalTow: number;
  remainingTow: number;
  costXrp: number;
  status: "alive" | "disqualified";
  disqualifiedAt: string | null;
  disqualifiedBy: string | null;
};

export type ProofReplay = {
  complete: boolean;
  warnings: string[];
  commitments: ProofCommitment[];
  uncommittedTow: number;
  uncommittedCostXrp: number;
  nonqualifyingTow: number;
};

const EPS = 0.0000001;

export function replayProofCommitments(
  movements: ProofMovement[],
  thresholdXrp = 50
): ProofReplay {
  if (!Number.isFinite(thresholdXrp) || thresholdXrp <= 0) {
    throw new Error("Invalid threshold");
  }

  const commitments: ProofCommitment[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  let complete = true;
  let uncommittedTow = 0;
  let uncommittedCostXrp = 0;
  let nonqualifyingTow = 0;

  const ordered = [...movements].sort((a, b) =>
    a.ledgerIndex - b.ledgerIndex ||
    (a.transactionIndex ?? 0) - (b.transactionIndex ?? 0) ||
    a.txHash.localeCompare(b.txHash)
  );

  for (const event of ordered) {
    const hash = String(event.txHash).toUpperCase();
    if (!/^[0-9A-F]{64}$/.test(hash) ||
        !Number.isSafeInteger(event.ledgerIndex) || event.ledgerIndex <= 0 ||
        !Number.isFinite(event.towAmount) || event.towAmount < 0 ||
        !Number.isFinite(event.xrpValue) || event.xrpValue < 0 ||
        !event.eventAt || !Number.isFinite(new Date(event.eventAt).getTime())) {
      complete = false;
      warnings.push(`Invalid event or timestamp: ${hash}`);
      continue;
    }
    if (seen.has(hash)) {
      complete = false;
      warnings.push(`Duplicate transaction: ${hash}`);
      continue;
    }
    seen.add(hash);

    if (event.type === "buy") {
      if (event.xrpValue <= EPS || event.towAmount <= EPS) {
        complete = false;
        warnings.push(`Invalid buy amounts: ${hash}`);
        continue;
      }
      const totalTow = uncommittedTow + event.towAmount;
      const totalCost = uncommittedCostXrp + event.xrpValue;
      // Build full 50 XRP commitments from the accumulated acquisition pool.
      // Each slice is proportional to its cost and starts when threshold is met.
      let poolTow = totalTow;
      let poolCost = totalCost;
      let sequence = 0;
      while (poolCost + EPS >= thresholdXrp) {
        const sliceTow = poolTow * (thresholdXrp / poolCost);
        commitments.push({
          id: `${hash}_${++sequence}`,
          createdAt: event.eventAt,
          sourceTxHash: hash,
          originalTow: sliceTow,
          remainingTow: sliceTow,
          costXrp: thresholdXrp,
          status: "alive",
          disqualifiedAt: null,
          disqualifiedBy: null,
        });
        poolTow = Math.max(0, poolTow - sliceTow);
        poolCost = Math.max(0, poolCost - thresholdXrp);
      }
      uncommittedTow = poolTow;
      uncommittedCostXrp = poolCost;
    } else if (event.type === "transfer_in" || event.type === "reward") {
      nonqualifyingTow += event.towAmount;
    } else if (event.type === "sell" || event.type === "transfer_out") {
      let remaining = event.towAmount;
      // Mixing qualifying and nonqualifying holdings is ambiguous without
      // wallet-specific provenance. Fail closed for automatic application.
      if (nonqualifyingTow > EPS && (commitments.some((c) => c.remainingTow > EPS) || uncommittedTow > EPS)) {
        complete = false;
        warnings.push(`Mixed qualifying and transferred holdings: ${hash}`);
      }

      // Oldest-first: consume committed lots before uncommitted purchases.
      for (const commitment of commitments) {
        if (remaining <= EPS) break;
        if (commitment.remainingTow <= EPS) continue;
        const consumed = Math.min(remaining, commitment.remainingTow);
        commitment.remainingTow = Math.max(0, commitment.remainingTow - consumed);
        remaining -= consumed;
        if (commitment.status === "alive") {
          commitment.status = "disqualified";
          commitment.disqualifiedAt = event.eventAt;
          commitment.disqualifiedBy = hash;
        }
      }

      if (remaining > EPS && uncommittedTow > EPS) {
        const consumed = Math.min(remaining, uncommittedTow);
        const costConsumed = uncommittedCostXrp * (consumed / uncommittedTow);
        uncommittedTow = Math.max(0, uncommittedTow - consumed);
        uncommittedCostXrp = Math.max(0, uncommittedCostXrp - costConsumed);
        remaining -= consumed;
      }
      if (remaining > EPS && nonqualifyingTow > EPS) {
        const consumed = Math.min(remaining, nonqualifyingTow);
        nonqualifyingTow -= consumed;
        remaining -= consumed;
      }
      if (remaining > EPS) {
        complete = false;
        warnings.push(`Outgoing amount exceeds known holdings: ${hash}`);
      }
    } else {
      complete = false;
      warnings.push(`Unknown event type: ${hash}`);
    }
  }

  return {
    complete,
    warnings,
    commitments,
    uncommittedTow,
    uncommittedCostXrp,
    nonqualifyingTow,
  };
}
