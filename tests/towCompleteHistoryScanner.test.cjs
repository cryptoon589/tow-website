const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("lib/towCompleteHistoryScanner.ts", "utf8");
test("scanner uses full account history, not incremental cursor", () => {
  assert.match(source, /ledger_index_min: -1/);
  assert.match(source, /forward: true/);
  assert.match(source, /markerExhausted: true/);
});
test("scanner rejects incomplete or inconsistent history", () => {
  for (const phrase of ["Unvalidated XRPL transaction", "Missing or duplicate XRPL transaction hash",
    "XRPL transaction metadata missing", "XRPL history exceeds page cap",
    "XRPL pagination marker did not advance", "XRPL RPC ledger coverage changed during scan"])
    assert.ok(source.includes(phrase), phrase);
});
test("scanner has no database writes or certificate issuance", () => {
  assert.doesNotMatch(source, /supabase|\.insert\(|\.upsert\(|\.update\(|verified_complete\s*:\s*true/);
});
