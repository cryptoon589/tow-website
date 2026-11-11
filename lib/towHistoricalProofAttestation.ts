/** Read-only XRPL historical balance and proof-ledger attestation. */
const RIPPLE_EPOCH = 946684800;
async function rpc(url: string, method: string, params: Record<string, unknown>, fetcher: typeof fetch) {
  const response = await fetcher(url, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ method, params: [params] }), cache: "no-store" });
  if (!response.ok) throw new Error(`XRPL ${method} HTTP error`);
  const data = await response.json();
  if (data?.result?.status !== "success" || data?.result?.error) throw new Error(`XRPL ${method} unavailable`);
  return data.result;
}

function normalizeCurrency(raw: string) {
  const upper = raw.toUpperCase();
  if (!/^[0-9A-F]{40}$/.test(upper)) return upper;
  return (upper.match(/../g) ?? []).map(b => String.fromCharCode(parseInt(b, 16))).join("").replace(/\0/g, "").trim().toUpperCase();
}

export async function attestProofLedgerAndBalance(input: {
  rpcUrl: string; wallet: string; issuer: string; currency: string;
  proofStartedAt: string; verificationLedger: number; fetcher?: typeof fetch;
}) {
  const fetcher = input.fetcher ?? fetch;
  const proofMs = Date.parse(input.proofStartedAt);
  if (!Number.isFinite(proofMs) || !Number.isSafeInteger(input.verificationLedger) || input.verificationLedger < 2)
    throw new Error("Invalid proof timestamp or ledger");
  // Binary search validated close times; ledger close_time must precede proof.
  // A ledger closing at exactly the proof timestamp is ambiguous and rejected.
  const cache = new Map<number, number>();
  async function closeMs(index: number) {
    if (cache.has(index)) return cache.get(index)!;
    const result = await rpc(input.rpcUrl, "ledger", { ledger_index: index, transactions: false, expand: false }, fetcher);
    if (result?.validated !== true || Number(result?.ledger?.ledger_index ?? result?.ledger?.seqNum) !== index)
      throw new Error("Requested ledger is not independently validated");
    const close = Number(result.ledger.close_time);
    if (!Number.isSafeInteger(close) || close < 0) throw new Error("Invalid ledger close time");
    const ms = (close + RIPPLE_EPOCH) * 1000;
    cache.set(index, ms);
    return ms;
  }
  let lo = 1, hi = input.verificationLedger;
  if (await closeMs(hi) < proofMs) throw new Error("Verification ledger predates proof timestamp");
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (await closeMs(mid) < proofMs) lo = mid + 1;
    else hi = mid;
  }
  if (lo <= 1 || await closeMs(lo) === proofMs || await closeMs(lo - 1) >= proofMs)
    throw new Error("Proof ledger boundary cannot be independently established");
  // lo is first ledger closing after proof; preceding ledger is the verified pre-proof snapshot.
  const proofLedger = lo - 1;
  const lines = await rpc(input.rpcUrl, "account_lines", {
    account: input.wallet, ledger_index: proofLedger, limit: 400,
  }, fetcher);
  if (lines?.validated !== true || Number(lines.ledger_index) !== proofLedger || !Array.isArray(lines.lines) || lines.marker)
    throw new Error("Historical account_lines snapshot is unavailable, incomplete, or unvalidated");
  const matching = lines.lines.filter((line: any) =>
    line.account === input.issuer && normalizeCurrency(String(line.currency ?? "")) === normalizeCurrency(input.currency));
  if (matching.length !== 1) throw new Error("Historical TOW trust line is absent or ambiguous");
  const balance = Number(matching[0].balance);
  if (!Number.isFinite(balance) || balance < 0) throw new Error("Invalid historical TOW balance");
  return { proofLedger, tokenBalanceAtProof: balance, proofBoundaryVerified: true as const,
    balanceIndependentlyVerified: true as const };
}
