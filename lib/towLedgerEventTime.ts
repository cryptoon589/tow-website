/**
 * XRPL transaction time is seconds since 2000-01-01T00:00:00Z.
 * Historical FIFO replay MUST use this signed ledger date, never the
 * scanner/import timestamp in tow_wallet_events.event_at.
 * Fail closed when the original XRPL date is unavailable or malformed.
 */
export function xrplLedgerTimestamp(rawEvent: unknown): string | null {
  if (!rawEvent || typeof rawEvent !== "object") return null;
  const raw = rawEvent as Record<string, unknown>;
  const tx = raw.tx ?? raw.tx_json;
  if (!tx || typeof tx !== "object") return null;
  const date = (tx as Record<string, unknown>).date;
  if ((typeof date !== "number" && typeof date !== "string") ||
      !/^(0|[1-9][0-9]*)$/.test(String(date))) return null;
  const seconds = Number(date);
  if (!Number.isSafeInteger(seconds) || seconds <= 0) return null;
  const ms = (seconds + 946684800) * 1000;
  if (!Number.isSafeInteger(ms) || ms > 8640000000000000) return null;
  return new Date(ms).toISOString();
}

export type RawStoredMovement = {
  tx_hash: string; event_type: string; ledger_index: number;
  tow_amount: string | number; xrp_value: string | number;
  event_at: string; raw_event: unknown;
};
export type HistoricalMovement = {
  txHash: string; type: string; ledgerIndex: number;
  towAmount: number; xrpValue: number; eventAt: string;
};
/** No database writes. Returns invalid hashes rather than guessing times. */
export function extractLedgerDatedMovements(rows: RawStoredMovement[]): {
  movements: HistoricalMovement[]; invalidHashes: string[];
  timestampDisagreements: string[];
} {
  const movements: HistoricalMovement[] = [];
  const invalidHashes: string[] = [];
  const timestampDisagreements: string[] = [];
  for (const row of rows) {
    const eventAt = xrplLedgerTimestamp(row.raw_event);
    const towAmount = Number(row.tow_amount);
    const xrpValue = Number(row.xrp_value);
    if (!eventAt || !/^[A-F0-9]{64}$/i.test(row.tx_hash) ||
        !Number.isSafeInteger(row.ledger_index) || row.ledger_index <= 0 ||
        !Number.isFinite(towAmount) || towAmount <= 0 ||
        !Number.isFinite(xrpValue) || xrpValue < 0) {
      invalidHashes.push(row.tx_hash);
      continue;
    }
    if (!Number.isFinite(Date.parse(row.event_at)) ||
        Math.abs(Date.parse(row.event_at) - Date.parse(eventAt)) > 60000)
      timestampDisagreements.push(row.tx_hash);
    movements.push({
      txHash: row.tx_hash.toUpperCase(), type: row.event_type,
      ledgerIndex: row.ledger_index, towAmount, xrpValue, eventAt,
    });
  }
  return { movements, invalidHashes, timestampDisagreements };
}
