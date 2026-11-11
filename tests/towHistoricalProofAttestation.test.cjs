const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("lib/towHistoricalProofAttestation.ts", "utf8");
test("historical attestation checks validated ledger close time and historical trust line", () => {
  assert.match(source, /method: "POST"/);
  assert.match(source, /"ledger"/);
  assert.match(source, /"account_lines"/);
  assert.match(source, /result\?\.validated !== true/);
  assert.match(source, /lines\?\.validated !== true/);
});
test("attestation fails closed on incomplete historical trust line", () => {
  assert.match(source, /lines\.marker/);
  assert.match(source, /matching\.length !== 1/);
  assert.match(source, /Proof ledger boundary cannot be independently established/);
});
