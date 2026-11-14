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

test("wallet scanner invokes independent certification only after durable sync and checkpoint", () => {
  const scan = fs.readFileSync("app/api/tired-scan-wallet/route.ts", "utf8");
  const sync = scan.indexOf("const syncResult = await syncEvents");
  const checkpoint = scan.indexOf("last_scanned_ledger: highestLedgerSeen");
  const cert = scan.indexOf('/api/tired-certify-wallet');
  assert.ok(sync >= 0 && checkpoint > sync && cert > checkpoint);
  assert.match(scan, /TOW_ENABLE_NEW_WALLET_AUTO_ENROLLMENT === "true"/);
  assert.match(scan, /TOW_ENABLE_CERTIFICATE_ISSUANCE === "true"/);
  assert.match(scan, /certificationResult\?\.accountingStatus === "reconciled"/);
  assert.match(scan, /"certified_replay_failed"/);
  assert.match(scan, /"certified_accounting_disabled"/);
  assert.match(scan, /"not_eligible"/);
});

test("stale coverage stages eligible new wallets without reconciling, while pilots remain blocked", () => {
  assert.match(sync, /if \(!eligibleNewWallet\) \{[\s\S]*?XRPL_HISTORY_COVERAGE_NOT_CERTIFIED/);
  assert.match(sync, /For automatically enrolled new wallets, stage the next ledger range/);
  assert.match(sync, /certifiedForBatch = false;/);
  assert.match(sync, /fifoEnabled && certifiedForBatch/);
});
