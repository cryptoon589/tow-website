/** Independently resolve a proof timestamp to validated XRPL ledger and trust-line balance.
 * Historical account_lines requires a server retaining the requested ledger state.
 * Fail closed when unavailable; do not substitute today's balance.
 */
export async function verifyHistoricalTowBalance(input: {
  rpcUrl: string; wallet: string; issuer: string; currency: string;
  proofStartedAt: string; firstLedger: number; lastLedger: number;
  fetcher?: typeof fetch;
}) {
  const fetcher = input.fetcher ?? fetch;
  const proofMs = Date.parse(input.proofStartedAt);
  if (!Number.isFinite(proofMs) || !Number.isSafeInteger(input.firstLedger) ||
      !Number.isSafeInteger(input.lastLedger) || input.firstLedger < 1 || input.lastLedger < input.firstLedger)
    throw new Error("Invalid proof timestamp or ledger bounds");
  async function rpc(method: string, params: Record<string, unknown>) {
    const response = await fetcher(input.rpcUrl, { method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method, params: [params] }), cache: "no-store" });
    if (!response.ok) throw new Error(`XRPL ${method} HTTP error`);
    const data = (await response.json())?.result;
    if (!data || data.error || data.status !== "success")
      throw new Error(`XRPL ${method} historical state unavailable`);
    return data;
  }
  async function closeTime(index: number) {
    const data = await rpc("ledger", { ledger_index: index, transactions: false, expand: false });
    const ledger = data.ledger;
    if (!ledger || data.validated !== true || Number(data.ledger_index ?? ledger.ledger_index) !== index)
      throw new Error("Ledger not independently validated");
    const seconds = Number(ledger.close_time);
    if (!Number.isSafeInteger(seconds) || seconds < 0) throw new Error("Ledger close time missing");
    return (seconds + 946684800) * 1000;
  }
  // First validated ledger closed on or after the server's proof timestamp.
  let lo = input.firstLedger, hi = input.lastLedger;
  if (await closeTime(hi) < proofMs) throw new Error("History does not reach proof timestamp");
  if (await closeTime(lo) >= proofMs) throw new Error("Proof predates available wallet history");
  while (lo + 1 < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (await closeTime(mid) < proofMs) lo = mid;
    else hi = mid;
  }
  const beforeClose = await closeTime(lo);
  const afterClose = await closeTime(hi);
  if (!(beforeClose < proofMs && proofMs < afterClose))
    throw new Error("Proof timestamp is ambiguous at ledger boundary");
  // Ledger lo is the last closed ledger strictly before proof activation.
  // Request its historical state, not the current trust-line balance.
  const lines: any[] = [];
  let marker: unknown;
  for (let page = 0; page < 100; page++) {
    const params: Record<string, unknown> = { account: input.wallet, peer: input.issuer,
      ledger_index: lo, limit: 200 };
    if (marker !== undefined) params.marker = marker;
    const result = await rpc("account_lines", params);
    if (Number(result.ledger_index) !== lo || result.validated !== true || !Array.isArray(result.lines))
      throw new Error("Historical account_lines not independently validated");
    lines.push(...result.lines);
    if (result.marker === undefined || result.marker === null) {
      const matching = lines.filter(line => line.account === input.issuer &&
        String(line.currency).toUpperCase() === input.currency.toUpperCase());
      if (matching.length > 1) throw new Error("Ambiguous historical TOW trust line");
      const balance = matching.length ? Number(matching[0].balance) : 0;
      if (!Number.isFinite(balance) || balance < 0)
        throw new Error("Invalid historical TOW balance");
      return { proofLedger: hi, balanceLedger: lo, tokenBalanceAtVerification: balance,
        beforeCloseTime: new Date(beforeClose).toISOString(), afterCloseTime: new Date(afterClose).toISOString() };
    }
    if (JSON.stringify(marker) === JSON.stringify(result.marker)) throw new Error("Trust-line marker stalled");
    marker = result.marker;
  }
  throw new Error("Historical account_lines pagination incomplete");
}
