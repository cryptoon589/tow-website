const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("app/api/tired-certification-status/route.ts", "utf8");

test("certification status is admin-only and read-only", () => {
  assert.match(source, /x-tow-sync-secret/);
  assert.match(source, /status: 401/);
  assert.doesNotMatch(source, /\.(insert|update|upsert|delete|rpc)\(/);
});

test("pilot eligibility checks coverage, proof, and legacy positions", () => {
  for (const blocker of ["PLAYER_PROOF_NOT_VERIFIED", "HISTORY_NOT_CERTIFIED", "BALANCE_NOT_CERTIFIED", "LEDGER_COVERAGE_INVALID", "LEGACY_POSITIONS_REQUIRE_RECONCILIATION", "PILOT_NOT_ENABLED"])
    assert.ok(source.includes(blocker), blocker);
});
