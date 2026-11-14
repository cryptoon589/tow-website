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

test("renewal SQL keeps proof identity, monotonic coverage, and legacy guards", () => {
  const sql = fs.readFileSync("supabase/migrations/2026-11-14-tow-safe-certification-renewal.sql", "utf8");
  assert.match(sql, /tow_certify_new_wallet_atomic/);
  assert.match(sql, /c\.first_wallet_ledger = p_first_wallet_ledger/);
  assert.match(sql, /c\.proof_ledger = p_proof_ledger/);
  assert.match(sql, /c\.checked_through_ledger <= p_checked_through_ledger/);
  assert.match(sql, /CERTIFICATION_RENEWAL_REQUIRES_REVIEW/);
  assert.match(sql, /EXISTING_ACCOUNTING_OR_LEGACY_POSITIONS/);
  assert.match(sql, /p_expected_proof_started_at is distinct from v_player\.proof_started_at/);
  assert.match(sql, /p_expected_event_count <> v_count/);
});

test("scanner never assigns FIFO XRP cost from an unverified AccountRoot trade delta", () => {
  const scan = fs.readFileSync("app/api/tired-scan-wallet/route.ts", "utf8");
  assert.match(scan, /UNVERIFIED_TOW_TRADE_PROVENANCE/);
  assert.match(scan, /tx\?\.TransactionType === "OfferCreate"/);
  assert.match(scan, /tx\?\.TransactionType === "Payment"/);
  assert.ok(scan.indexOf("UNVERIFIED_TOW_TRADE_PROVENANCE") < scan.indexOf("const xrpDelta = getXrpDeltaFromMeta"));
});

test("independent verifier permits renewal only with initialized certified proof identity", () => {
  const verify = fs.readFileSync("app/api/tired-verify-history/route.ts", "utf8");
  const certify = fs.readFileSync("app/api/tired-certify-wallet/route.ts", "utf8");
  assert.match(verify, /tow_accounting_initialized/);
  assert.match(verify, /tow_accounting_coverage/);
  assert.match(verify, /previouslyCertifiedAndInitialized/);
  assert.match(verify, /CERTIFICATION_RENEWAL_PROOF_IDENTITY_MISMATCH/);
  assert.match(verify, /LEGACY_POSITIONS_REQUIRE_RECONCILIATION/);
  assert.match(verify, /renewalEligible:/);
  assert.match(certify, /evidence\.renewalEligible !== true/);
});
