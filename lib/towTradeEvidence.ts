/**
 * Independent, read-only XRPL trade evidence assessment.
 * This module does NOT classify an event as a certified buy/sell and cannot
 * write to accounting tables. Trade execution metadata still needs separate
 * provenance verification before certificate issuance.
 */
export type TradeEvidence = {
  txHash: string;
  direction: "buy" | "sell";
  towAmount: number;
  netXrpExcludingFee: number;
  networkFeeXrp: number;
  observedXrpDelta: number;
  independentlyAttested: false;
  reason: "DEX_EXECUTION_PROVENANCE_NOT_ATTESTED";
};

function drops(value: unknown): bigint {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)$/.test(value)) {
    throw new Error("INVALID_XRP_DROPS_EVIDENCE");
  }
  return BigInt(value);
}

function safeXrp(value: bigint): number {
  const max = BigInt(Number.MAX_SAFE_INTEGER);
  if (value > max || -value > max) throw new Error("XRP_DELTA_OUT_OF_SAFE_RANGE");
  return Number(value) / 1_000_000;
}

export function assessUncertifiedTradeEvidence(input: {
  txHash: string;
  tx: any;
  meta: any;
  walletAddress: string;
  towDelta: number;
}): TradeEvidence {
  const { txHash, tx, meta, walletAddress, towDelta } = input;
  if (!/^[0-9A-Fa-f]{64}$/.test(txHash) || !walletAddress ||
      !Number.isFinite(towDelta) || Math.abs(towDelta) < 0.000001 ||
      meta?.TransactionResult !== "tesSUCCESS" ||
      !Array.isArray(meta?.AffectedNodes)) {
    throw new Error("INVALID_TRADE_EVIDENCE");
  }
  // Require execution evidence rather than inferring a DEX trade from
  // coincident XRP/TOW balance changes. This is a prerequisite, NOT a
  // complete offer/AMM fill or counterparty-cost attestation.
  if (tx?.TransactionType !== "OfferCreate" && tx?.TransactionType !== "Payment") {
    throw new Error("UNSUPPORTED_DEX_TRADE_TRANSACTION");
  }
  const executionNodes = meta.AffectedNodes.filter((node: any) => {
    const wrapper = node?.ModifiedNode ?? node?.DeletedNode;
    return wrapper?.LedgerEntryType === "Offer" || wrapper?.LedgerEntryType === "AMM";
  });
  if (executionNodes.length === 0) {
    throw new Error("MISSING_DEX_EXECUTION_PROVENANCE");
  }
  // A modified offer only proves execution when BOTH funded sides decrease.
  // An Offer node that merely exists in metadata is not a fill. Deleted
  // offers and AMM nodes need their own independently verified accounting.
  const parseIssued = (value: any): number | null => {
    if (!value || typeof value !== "object" ||
        typeof value.value !== "string" ||
        !/^(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value.value)) return null;
    const n = Number(value.value);
    return Number.isFinite(n) && n > 0 ? n : null;
  };
  const parseAsset = (value: any): number | null =>
    typeof value === "string" && /^(0|[1-9][0-9]*)$/.test(value)
      ? Number(value) : parseIssued(value);
  const executedOffer = executionNodes.some((node: any) => {
    const item = node?.ModifiedNode;
    if (item?.LedgerEntryType !== "Offer") return false;
    const previous = item.PreviousFields;
    const final = item.FinalFields;
    if (!previous || !final) return false;
    const beforePays = parseAsset(previous.TakerPays);
    const afterPays = parseAsset(final.TakerPays);
    const beforeGets = parseAsset(previous.TakerGets);
    const afterGets = parseAsset(final.TakerGets);
    if ([beforePays,afterPays,beforeGets,afterGets].some(v => v === null)) return false;
    const sameAsset = (a: any,b: any) =>
      typeof a === "string" && typeof b === "string" ||
      typeof a === "object" && typeof b === "object" &&
      a.currency === b.currency && a.issuer === b.issuer;
    return sameAsset(previous.TakerPays,final.TakerPays) &&
      sameAsset(previous.TakerGets,final.TakerGets) &&
      beforePays! > afterPays! && beforeGets! > afterGets!;
  });
  if (!executedOffer) throw new Error("UNVERIFIED_DEX_EXECUTED_FILL");
  // The wallet must be a participant in the submitted transaction or in
  // an executed offer. Otherwise its balance changes cannot be attributed
  // to the claimed execution.
  const participates = tx?.Account === walletAddress ||
    executionNodes.some((node: any) => {
      const wrapper = node?.ModifiedNode ?? node?.DeletedNode;
      return (wrapper?.FinalFields?.Account ?? wrapper?.PreviousFields?.Account) === walletAddress;
    });
  if (!participates) throw new Error("UNATTRIBUTED_DEX_EXECUTION");
  const roots = meta.AffectedNodes.filter((n: any) => {
    const item = n?.ModifiedNode;
    return item?.LedgerEntryType === "AccountRoot" &&
      item?.FinalFields?.Account === walletAddress;
  });
  if (roots.length !== 1) throw new Error("UNVERIFIED_TRADE_XRP_ACCOUNT_ROOT");
  const root = roots[0].ModifiedNode;
  const before = drops(root?.PreviousFields?.Balance);
  const after = drops(root?.FinalFields?.Balance);
  const fee = tx?.Account === walletAddress ? drops(tx?.Fee) : BigInt(0);
  const net = after - before + fee;
  if (towDelta > 0 && net >= BigInt(0)) {
    throw new Error("TRADE_BUY_XRP_DIRECTION_MISMATCH");
  }
  if (towDelta < 0 && net <= BigInt(0)) {
    throw new Error("TRADE_SELL_XRP_DIRECTION_MISMATCH");
  }
  return {
    txHash: txHash.toUpperCase(),
    direction: towDelta > 0 ? "buy" : "sell",
    towAmount: Math.abs(towDelta),
    netXrpExcludingFee: safeXrp(net),
    networkFeeXrp: safeXrp(fee),
    observedXrpDelta: safeXrp(after - before),
    independentlyAttested: false,
    reason: "DEX_EXECUTION_PROVENANCE_NOT_ATTESTED",
  };
}
