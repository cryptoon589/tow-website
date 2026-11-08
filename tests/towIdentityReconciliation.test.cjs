const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(require("node:path").join(__dirname, "../lib/towIdentityReconciliation.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const shim = { exports: {} };
vm.runInNewContext(compiled, { module: shim, exports: shim.exports, Set, Date, Number, Math, Error });
const { reconcileCommitmentIdentities } = shim.exports;
const proposed = {
  id: "A".repeat(64) + "_1", createdAt: "2026-11-01T00:00:00Z",
  sourceTxHash: "A".repeat(64), originalTow: 1000, remainingTow: 1000,
  costXrp: 50, status: "alive", disqualifiedAt: null, disqualifiedBy: null,
  acquiredBeforeProof: false,
};
const stored = {
  id: "db-1", buy_tx_hash: proposed.sourceTxHash, status: "alive",
  created_at: proposed.createdAt, tow_amount: 1000, buy_value_xrp: 50,
  unlocked_reward_tow: 0,
};
test("exact uniquely identified, unclaimed position can be preview-matched", () => {
  const r = reconcileCommitmentIdentities([stored], [proposed]);
  assert.equal(r.matches.length, 1);
  assert.equal(r.unmatchedStored.length, 0);
  assert.equal(r.safeToApply, false);
});
test("legacy synthetic mismatch cannot be matched by count alone", () => {
  const r = reconcileCommitmentIdentities([{ ...stored, buy_tx_hash: "old_fake_hash" }], [proposed]);
  assert.equal(r.matches.length, 0);
  assert.equal(r.unmatchedStored.length, 1);
  assert.equal(r.unmatchedPreview.length, 1);
});
test("claimed or paid position is protected from reassignment", () => {
  const r = reconcileCommitmentIdentities([{ ...stored, claimed_at: "2026-11-02T00:00:00Z" }], [proposed]);
  assert.equal(r.matches.length, 0);
  assert.equal(r.protectedStored.length, 1);
});
test("ambiguous duplicate candidate cannot be silently mapped", () => {
  const r = reconcileCommitmentIdentities([stored, { ...stored, id: "db-2" }], [proposed]);
  assert.equal(r.matches.length, 0);
  assert.ok(r.blockers.some((x) => x.includes("Ambiguous")));
});

test("synthetic preview ID is not mistaken for the on-ledger source hash", () => {
  const r = reconcileCommitmentIdentities([{ ...stored, buy_tx_hash: proposed.id }], [proposed]);
  assert.equal(r.matches.length, 0);
  assert.equal(r.safeToApply, false);
});
