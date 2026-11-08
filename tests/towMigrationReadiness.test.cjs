const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(require("node:path").join(__dirname, "../lib/towMigrationReadiness.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const shim = { exports: {} };
vm.runInNewContext(compiled, { module: shim, exports: shim.exports, Set, Date, Number, Math, Error });
const { assessProofMigration } = shim.exports;
const base = () => ({
  verified: true, proofStartedAt: "2026-11-01T00:00:00Z",
  lastScannedLedger: 100, eventsCount: 3, eventHistoryComplete: true,
  baselineComplete: true, lifecycleComplete: true,
  predictedAliveCount: 1, predictedDisqualifiedCount: 0,
  positions: [{
    id: "one", buy_tx_hash: "hash", status: "alive",
    created_at: "2026-11-01T00:00:00Z", tow_amount: 1000,
    remaining_tow: 1000, unlocked_reward_tow: 0,
    reward_status: "pending",
  }],
});
test("no migration may auto-apply before atomic identity mapping", () => {
  const r = assessProofMigration(base());
  assert.equal(r.safeToAutoApply, false);
  assert.equal(r.requiresManualReview, true);
});
test("previously claimed rewards block migration", () => {
  const input = base();
  input.positions[0].status = "claimed";
  input.positions[0].claimed_at = "2026-11-02T00:00:00Z";
  input.predictedAliveCount = 0;
  const r = assessProofMigration(input);
  assert.equal(r.existing.claimedOrPaid, 1);
  assert.ok(r.blockers.some((x) => x.includes("claims")));
});
test("unverified history and mismatched active counts are blockers", () => {
  const input = base();
  input.eventHistoryComplete = false;
  input.predictedAliveCount = 2;
  const r = assessProofMigration(input);
  assert.ok(r.blockers.some((x) => x.includes("history")));
  assert.ok(r.blockers.some((x) => x.includes("mismatch")));
});
test("missing remaining TOW is reported", () => {
  const input = base();
  input.positions[0].remaining_tow = null;
  const r = assessProofMigration(input);
  assert.ok(r.warnings.some((x) => x.includes("remaining_tow")));
});
