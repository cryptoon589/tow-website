/**
 * Independent, read-only XRPL RippleState TOW delta inspection.
 * Does NOT infer XRP cost, DEX execution, or purchase/sale classification.
 * Missing PreviousFields on ModifiedNode is not silently treated as zero.
 */
export type TowDeltaInspection = {
  hash: string;
  ledgerIndex: number;
  deltaTow: number | null;
  hasTowMovement: boolean;
  reliable: boolean;
  warnings: string[];
};

function normalizeCurrency(value: unknown): string {
  const raw = String(value ?? "").toUpperCase();
  if (!/^[0-9A-F]{40}$/.test(raw)) return raw;
  const bytes = raw.match(/../g) ?? [];
  const decoded = bytes.map((b) => String.fromCharCode(parseInt(b, 16))).join("");
  return decoded.replace(/\0/g, "").trim().toUpperCase();
}

function balanceForWallet(fields: any, wallet: string, issuer: string, currency: string): number | null {
  const low = String(fields?.LowLimit?.issuer ?? "");
  const high = String(fields?.HighLimit?.issuer ?? "");
  if (!((low === wallet && high === issuer) || (high === wallet && low === issuer))) return null;
  if (normalizeCurrency(fields?.Balance?.currency ?? fields?.LowLimit?.currency) !== normalizeCurrency(currency)) return null;
  const value = Number(fields?.Balance?.value);
  if (!Number.isFinite(value)) return null;
  return low === wallet ? value : -value;
}

export function inspectTowDelta(
  entry: any,
  wallet: string,
  issuer: string,
  currency: string
): TowDeltaInspection {
  const tx = entry?.tx_json ?? entry?.tx ?? entry;
  const meta = entry?.meta ?? entry?.metaData ?? entry?.metadata;
  const hash = String(tx?.hash ?? entry?.hash ?? "").toUpperCase();
  const ledgerIndex = Number(entry?.ledger_index ?? tx?.ledger_index ?? 0);
  const warnings: string[] = [];
  if (!/^[0-9A-F]{64}$/.test(hash) || !Number.isSafeInteger(ledgerIndex) || ledgerIndex <= 0)
    warnings.push("Missing or invalid transaction identity.");
  if (!meta || !Array.isArray(meta.AffectedNodes))
    warnings.push("Missing transaction metadata.");
  if (meta?.TransactionResult !== "tesSUCCESS")
    warnings.push("Transaction is not confirmed successful.");

  let delta = 0;
  let matched = 0;
  for (const node of meta?.AffectedNodes ?? []) {
    const kind = node?.ModifiedNode ? "modified" : node?.CreatedNode ? "created" : node?.DeletedNode ? "deleted" : "";
    const wrapper = node?.ModifiedNode ?? node?.CreatedNode ?? node?.DeletedNode;
    if (wrapper?.LedgerEntryType !== "RippleState") continue;
    const after = wrapper?.FinalFields ?? wrapper?.NewFields;
    const before = wrapper?.PreviousFields;
    // DeletedNode.FinalFields describe the state BEFORE deletion, not the
    // post-transaction state. A deleted trust line has a zero ending balance.
    const afterValue = balanceForWallet(after, wallet, issuer, currency);
    if (afterValue === null) continue;
    matched++;
    const beforeValue = before ? balanceForWallet({
      ...after, ...before,
      LowLimit: before.LowLimit ?? after?.LowLimit,
      HighLimit: before.HighLimit ?? after?.HighLimit,
      Balance: before.Balance ?? after?.Balance,
    }, wallet, issuer, currency) : null;
    if (kind === "modified" && beforeValue === null) {
      warnings.push("Modified TOW trust line has no verifiable previous balance.");
      continue;
    }
    if (kind === "deleted") {
      if (beforeValue === null) {
        // A zero-balance trust line can be deleted without any TOW transfer.
        // Do not invent an outgoing movement from its FinalFields balance.
        if (Math.abs(afterValue) > 1e-12) {
          warnings.push("Deleted TOW trust line has nonzero balance without PreviousFields.");
        }
        continue;
      }
      delta -= beforeValue;
      continue;
    }
    delta += kind === "created" ? afterValue : afterValue - beforeValue!;

  }
  if (matched > 1) warnings.push("Multiple matching TOW trust line nodes in one transaction.");
  const reliable = warnings.length === 0;
  return {
    hash,
    ledgerIndex,
    deltaTow: reliable ? Number(delta.toFixed(6)) : null,
    hasTowMovement: matched > 0,
    reliable,
    warnings,
  };
}
