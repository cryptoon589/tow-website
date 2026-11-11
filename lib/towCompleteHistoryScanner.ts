import { inspectTowDelta } from "./towLedgerMovementInspection";

/** Read-only full account_tx pagination. Never advances a cursor or issues certification. */
export async function scanCompleteTowHistory(input: {
  rpcUrl: string; wallet: string; issuer: string; currency: string;
  maxPages?: number; fetcher?: typeof fetch;
}) {
  const fetcher = input.fetcher ?? fetch;
  const maxPages = input.maxPages ?? 100;
  if (!Number.isSafeInteger(maxPages) || maxPages < 1 || maxPages > 1000)
    throw new Error("Invalid page cap");
  let marker: unknown;
  let previousLedger = 0;
  let fixedMaxLedger: number | null = null;
  let firstAvailableLedger: number | null = null;
  let scannedThroughLedger: number | null = null;
  let firstWalletLedger: number | null = null;
  const seen = new Set<string>();
  const movements: { hash: string; ledgerIndex: number; deltaTow: number }[] = [];
  let transactions = 0;
  for (let page = 0; page < maxPages; page++) {
    const params: Record<string, unknown> = {
      account: input.wallet, ledger_index_min: -1, ledger_index_max: fixedMaxLedger ?? -1,
      forward: true, binary: false, limit: 200,
    };
    if (marker !== undefined) params.marker = marker;
    const response = await fetcher(input.rpcUrl, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: "account_tx", params: [params] }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error("XRPL RPC HTTP failure");
    const json = await response.json();
    const result = json?.result;
    if (!result || result.status !== "success" || result.error || !Array.isArray(result.transactions))
      throw new Error("XRPL RPC rejected or malformed account_tx result");
    const min = Number(result.ledger_index_min);
    const max = Number(result.ledger_index_max);
    if (!Number.isSafeInteger(min) || min <= 0 || !Number.isSafeInteger(max) || max < min)
      throw new Error("XRPL RPC did not attest its validated ledger range");
    if (fixedMaxLedger === null) fixedMaxLedger = max;
    else if (max !== fixedMaxLedger) throw new Error("XRPL RPC ledger upper bound changed during pagination");
    if (firstAvailableLedger === null) firstAvailableLedger = min;
    else if (min !== firstAvailableLedger) throw new Error("XRPL RPC ledger coverage changed during scan");
    if (scannedThroughLedger !== null && max < scannedThroughLedger)
      throw new Error("XRPL RPC ledger coverage regressed");
    scannedThroughLedger = max;
    for (const entry of result.transactions) {
      if (entry?.validated !== true) throw new Error("Unvalidated XRPL transaction");
      const tx = entry.tx_json ?? entry.tx ?? entry;
      const hash = String(tx?.hash ?? entry.hash ?? "").toUpperCase();
      const ledger = Number(entry.ledger_index ?? tx?.ledger_index);
      if (!/^[0-9A-F]{64}$/.test(hash) || seen.has(hash))
        throw new Error("Missing or duplicate XRPL transaction hash");
      if (!Number.isSafeInteger(ledger) || ledger < min || ledger > max)
        throw new Error("XRPL transaction outside validated ledger range");
      if (ledger < previousLedger) throw new Error("XRPL forward pagination ledger order regressed");
      previousLedger = ledger;
      if (!entry.meta && !entry.metaData && !entry.metadata)
        throw new Error("XRPL transaction metadata missing");
      seen.add(hash);
      transactions++;
      firstWalletLedger = firstWalletLedger === null ? ledger : Math.min(firstWalletLedger, ledger);
      const meta = entry.meta ?? entry.metaData ?? entry.metadata;
      const resultCode = String(meta.TransactionResult ?? meta.transaction_result ?? "");
      if (resultCode !== "tesSUCCESS") {
        if (!resultCode.startsWith("tec") || (Array.isArray(meta.AffectedNodes) && meta.AffectedNodes.some(
          (node: any) => {
            const item = node.ModifiedNode ?? node.CreatedNode ?? node.DeletedNode;
            return item?.LedgerEntryType === "RippleState";
          }
        ))) throw new Error("Unexpected failed XRPL transaction metadata: " + hash);
        continue;
      }
      const inspection = inspectTowDelta(entry, input.wallet, input.issuer, input.currency);
      if (!inspection.reliable) throw new Error(`Unverifiable XRPL metadata for ${hash}: ${inspection.warnings.join("; ")}`);
      if (Math.abs(inspection.deltaTow ?? 0) > 0.000001)
        movements.push({ hash, ledgerIndex: ledger, deltaTow: inspection.deltaTow! });
    }
    const next = result.marker;
    if (next === undefined || next === null) {
      return { firstAvailableLedger, firstWalletLedger, scannedThroughLedger,
        markerExhausted: true as const, transactionCount: transactions, movements };
    }
    if (JSON.stringify(next) === JSON.stringify(marker)) throw new Error("XRPL pagination marker did not advance");
    marker = next;
  }
  throw new Error("XRPL history exceeds page cap; certification forbidden");
}
