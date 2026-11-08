const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(require("node:path").join(__dirname, "../lib/towHistoryCoverage.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const shim = { exports: {} };
vm.runInNewContext(compiled, { module: shim, exports: shim.exports, Number, Math, Error });
const { assessHistoryCoverage } = shim.exports;
const valid = () => ({
  walletAddress: "rExample",
  firstAvailableLedger: 1, firstWalletLedger: 10,
  verificationLedger: 100, scannedFromLedger: 1, scannedThroughLedger: 101,
  rpcMarkerExhausted: true, ledgerRangeValidated: true,
  eventCountFromRpc: 3, eventCountStored: 3,
  tokenBalanceAtVerification: 1000, reconstructedBalanceAtVerification: 1000,
  unclassifiedTowMovements: 0, timestampMismatches: 0, conflictingTxHashes: 0,
});
test("complete independently verified evidence passes coverage gate", () => {
  assert.equal(assessHistoryCoverage(valid()).verifiedComplete, true);
});
test("checkpoint without verified beginning is insufficient", () => {
  const evidence = valid(); evidence.scannedFromLedger = 11;
  assert.equal(assessHistoryCoverage(evidence).verifiedComplete, false);
});
test("incomplete pagination blocks coverage", () => {
  const evidence = valid(); evidence.rpcMarkerExhausted = false;
  assert.equal(assessHistoryCoverage(evidence).verifiedComplete, false);
});
test("balance mismatch blocks coverage despite matching event counts", () => {
  const evidence = valid(); evidence.reconstructedBalanceAtVerification = 999;
  assert.equal(assessHistoryCoverage(evidence).verifiedComplete, false);
});
test("missing historical balance blocks coverage", () => {
  const evidence = valid(); evidence.tokenBalanceAtVerification = null;
  assert.equal(assessHistoryCoverage(evidence).verifiedComplete, false);
});
test("unclassified movements and timestamp mismatches block coverage", () => {
  const evidence = valid(); evidence.unclassifiedTowMovements = 1; evidence.timestampMismatches = 1;
  assert.equal(assessHistoryCoverage(evidence).verifiedComplete, false);
});
