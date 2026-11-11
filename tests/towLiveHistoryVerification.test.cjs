const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("app/api/tired-verify-history/route.ts", "utf8");
test("live verification integrates independent scan and stored-event comparison", () => {
  assert.match(source, /scanCompleteTowHistory\(/);
  assert.match(source, /compareTowMovements\(/);
});
test("live verification never writes a certificate or mutates accounting", () => {
  assert.doesNotMatch(source, /\.upsert\(|\.insert\(|\.update\(|\.delete\(|\.rpc\(/);
  assert.match(source, /certified: false/);
});
test("independent historical balance and proof ledger are required", () => {
  assert.match(source, /attestProofLedgerAndBalance\(/);
  assert.match(source, /HISTORICAL_BALANCE_RECONSTRUCTION_MISMATCH/);
  assert.match(source, /INDEPENDENT_HISTORICAL_PROOF_ATTESTATION_FAILED/);
});
