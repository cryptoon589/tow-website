const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(require("node:path").join(__dirname, "../lib/towCommitmentLifecycle.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleShim = { exports: {} };
vm.runInNewContext(compiled, { module: moduleShim, exports: moduleShim.exports, Set, Date, Number, Math, Error }, { filename: "towCommitmentLifecycle.js" });
const { replayProofCommitments } = moduleShim.exports;

const tx = (digit, ledgerIndex, type, xrpValue, towAmount) => ({
  txHash: digit.repeat(64), ledgerIndex, type, xrpValue, towAmount,
  eventAt: new Date(Date.UTC(2026, 9, ledgerIndex)).toISOString(),
});

test("100 XRP creates two commitments", () => {
  const r = replayProofCommitments([tx("a", 1, "buy", 100, 1000)]);
  assert.equal(r.complete, true);
  assert.equal(r.commitments.length, 2);
  assert.equal(r.commitments.filter((p) => p.status === "alive").length, 2);
});

test("partial sell permanently disqualifies touched oldest commitment only", () => {
  const r = replayProofCommitments([
    tx("a", 1, "buy", 100, 1000),
    tx("b", 2, "sell", 20, 200),
  ]);
  assert.deepEqual(Array.from(r.commitments, (p) => p.status), ["disqualified", "alive"]);
  assert.equal(r.commitments[0].remainingTow, 300);
});

test("sell across both commitments disqualifies both", () => {
  const r = replayProofCommitments([
    tx("a", 1, "buy", 100, 1000),
    tx("b", 2, "sell", 60, 600),
  ]);
  assert.equal(r.commitments.filter((p) => p.status === "alive").length, 0);
});

test("rebuy creates a new streak without resurrecting disqualified lots", () => {
  const r = replayProofCommitments([
    tx("a", 1, "buy", 100, 1000),
    tx("b", 2, "sell", 60, 600),
    tx("c", 3, "buy", 60, 600),
  ]);
  assert.equal(r.commitments.length, 3);
  assert.deepEqual(Array.from(r.commitments, (p) => p.status), [
    "disqualified", "disqualified", "alive",
  ]);
  assert.equal(r.commitments[2].createdAt, tx("c", 3, "buy", 60, 600).eventAt);
});

test("subthreshold purchases accumulate until reaching 50 XRP", () => {
  const r = replayProofCommitments([
    tx("a", 1, "buy", 30, 300),
    tx("b", 2, "buy", 20, 200),
  ]);
  assert.equal(r.commitments.length, 1);
  assert.equal(r.commitments[0].originalTow, 500);
});

test("transfer-out disqualifies a touched commitment", () => {
  const r = replayProofCommitments([
    tx("a", 1, "buy", 50, 500),
    tx("b", 2, "transfer_out", 0, 10),
  ]);
  assert.equal(r.commitments[0].status, "disqualified");
});

test("mixed transferred and purchased tokens require manual reconciliation", () => {
  const r = replayProofCommitments([
    tx("a", 1, "buy", 50, 500),
    tx("b", 2, "transfer_in", 0, 200),
    tx("c", 3, "sell", 10, 100),
  ]);
  assert.equal(r.complete, false);
  assert.ok(r.warnings.some((w) => w.includes("Mixed")));
});

test("missing historical holdings fail closed", () => {
  const r = replayProofCommitments([tx("a", 1, "sell", 10, 100)]);
  assert.equal(r.complete, false);
});

test("duplicate events cannot create duplicate commitments", () => {
  const buy = tx("a", 1, "buy", 50, 500);
  const r = replayProofCommitments([buy, buy]);
  assert.equal(r.complete, false);
  assert.equal(r.commitments.length, 1);
});

test("pre-verification acquisition begins streak at verification", () => {
  const started = "2026-11-01T00:00:00.000Z";
  const r = replayProofCommitments([tx("a", 1, "buy", 50, 500)], 50, started);
  assert.equal(r.complete, true);
  assert.equal(r.commitments[0].createdAt, started);
  assert.equal(r.commitments[0].acquiredBeforeProof, true);
});

test("historical sells are flagged for baseline reconstruction", () => {
  const r = replayProofCommitments([
    tx("a", 1, "buy", 100, 1000),
    tx("b", 2, "sell", 20, 100),
  ], 50, "2026-11-01T00:00:00.000Z");
  assert.equal(r.complete, false);
  assert.ok(r.warnings.some((warning) => warning.includes("Pre-verification outflow")));
});
