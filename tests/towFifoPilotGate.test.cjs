const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("app/api/tired-sync/route.ts", "utf8");

test("FIFO requires feature switch and explicit pilot or cutoff-eligible new wallet", () => {
  assert.match(source, /TOW_ENABLE_FIFO_ACCOUNTING === "true" &&\s*\(pilotWallets\.has\(wallet\) \|\| eligibleNewWallet\)/);
  assert.match(source, /process\.env\.TOW_FIFO_PILOT_WALLETS \?\? ""/);
  assert.match(source, /hasCommitmentMovements && fifoEnabled/);
});

test("unenrolled wallets remain on staging RPC", () => {
  assert.match(source, /: "tow_ingest_wallet_events_atomic"/);
});

test("pilot admission requires certified full-history and balance evidence", () => {
  assert.match(source, /\.from\("tow_accounting_coverage"\)/);
  assert.match(source, /!coverage\?\.verified_complete \|\| !coverage\?\.balance_verified/);
  assert.match(source, /Number\(coverage\.checked_through_ledger\) < newestEventLedger/);
  assert.match(source, /XRPL_HISTORY_COVERAGE_NOT_CERTIFIED/);
  assert.match(source, /status: 409/);
});
