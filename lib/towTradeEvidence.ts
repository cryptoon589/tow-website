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
