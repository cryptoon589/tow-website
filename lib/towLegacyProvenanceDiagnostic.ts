/**
 * Read-only legacy position provenance diagnostics.
 *
 * Legacy proof positions can use a synthetic _1, _2, ... suffix to represent
 * separate 50 XRP commitments funded by one XRPL purchase. The suffix is NOT
 * part of the on-ledger transaction hash. Never overwrite the stored value.
 *
 * This helper identifies candidate purchase events; it does not certify FIFO
 * inventory, history completeness, or authorization to migrate positions.
 */
export type LegacyPositionReference = {
  id: string;
  wallet_address: string;
  buy_tx_hash: string;
};
export type PurchaseEventReference = {
  wallet_address: string;
  tx_hash: string;
  event_type: string;
};
export type LegacyProvenanceDiagnostic = {
  positionId: string;
  originalReference: string;
  ledgerTxHash: string | null;
  syntheticOrdinal: number | null;
  matchingBuyEvents: number;
  status: "matched_purchase" | "missing_purchase" | "ambiguous_purchase" | "invalid_reference";
  safeToMigrate: false;
};

const HASH = /^[A-Fa-f0-9]{64}$/;
const SUFFIXED_HASH = /^([A-Fa-f0-9]{64})_([1-9][0-9]*)$/;

export function inspectLegacyPositionProvenance(
  positions: LegacyPositionReference[],
  events: PurchaseEventReference[],
): LegacyProvenanceDiagnostic[] {
  return positions.map((position) => {
    const reference = position.buy_tx_hash.trim();
    const suffixed = SUFFIXED_HASH.exec(reference);
    const hash = suffixed ? suffixed[1] : HASH.test(reference) ? reference : null;
    const ordinal = suffixed ? Number(suffixed[2]) : null;
    const validOrdinal = ordinal === null || (Number.isSafeInteger(ordinal) && ordinal > 0);
    const matches = hash && validOrdinal
      ? events.filter((event) =>
          event.wallet_address === position.wallet_address &&
          event.tx_hash.toUpperCase() === hash.toUpperCase() &&
          event.event_type === "buy"
        ).length
      : 0;
    return {
      positionId: position.id,
      originalReference: position.buy_tx_hash,
      ledgerTxHash: hash && validOrdinal ? hash.toUpperCase() : null,
      syntheticOrdinal: validOrdinal ? ordinal : null,
      matchingBuyEvents: matches,
      status: !hash || !validOrdinal ? "invalid_reference"
        : matches === 0 ? "missing_purchase"
        : matches > 1 ? "ambiguous_purchase"
        : "matched_purchase",
      safeToMigrate: false,
    };
  });
}
