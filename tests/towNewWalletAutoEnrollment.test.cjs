const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const certify = fs.readFileSync("app/api/tired-certify-wallet/route.ts", "utf8");
const sync = fs.readFileSync("app/api/tired-sync/route.ts", "utf8");
test("new wallet enrollment is off by default and bounded by explicit proof cutoff", () => {
  for (const source of [certify, sync]) {
    assert.match(source, /TOW_ENABLE_NEW_WALLET_AUTO_ENROLLMENT/);
    assert.match(source, /TOW_NEW_WALLET_CUTOFF/);
    assert.match(source, /Number\.isFinite\(cutoffMs\)/);
  }
  assert.match(certify, /proofMs < cutoffMs/);
  assert.match(sync, /proof_started_at/);
});
test("automatic FIFO still requires independently certified ledger coverage", () => {
  assert.match(sync, /XRPL_HISTORY_COVERAGE_NOT_CERTIFIED/);
  assert.match(sync, /coverage\?\.verified_complete/);
  assert.match(sync, /coverage\?\.balance_verified/);
  assert.match(certify, /eligibleForCertification !== true/);
  assert.match(certify, /tow_certify_new_wallet_atomic/);
});
