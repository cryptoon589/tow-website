const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(require("node:path").join(__dirname, "../lib/towCostBasis.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleShim = { exports: {} };
vm.runInNewContext(compiled, { module: moduleShim, exports: moduleShim.exports, Set, Date, Number, Math, Error }, { filename: "towCostBasis.js" });
const { reconcileCostBasis } = moduleShim.exports;

const hash = (digit) => digit.repeat(64);
const movement = (digit, ledgerIndex, type, xrpValue, towAmount) => ({
  txHash: hash(digit), ledgerIndex, type, xrpValue, towAmount, eventAt: "2026-10-27T12:00:00Z",
});

test("profitable sale reduces remaining original cost, not XRP proceeds", () => {
  const result = reconcileCostBasis([
    movement("a", 10, "buy", 100, 1000),
    movement("b", 11, "sell", 100, 500),
  ]);
  assert.equal(result.complete, true);
  assert.equal(result.remainingCostXrp, 50);
  assert.equal(result.remainingQualifyingTow, 500);
  assert.equal(result.qualifyingCommitments, 1);
});

test("loss-making sale also removes proportional cost basis", () => {
  const result = reconcileCostBasis([
    movement("a", 10, "buy", 100, 1000),
    movement("b", 11, "sell", 10, 500),
  ]);
  assert.equal(result.remainingCostXrp, 50);
  assert.equal(result.qualifyingCommitments, 1);
});

test("ledger order beats input order and event timestamps", () => {
  const result = reconcileCostBasis([
    movement("b", 11, "sell", 50, 500),
    movement("a", 10, "buy", 100, 1000),
  ]);
  assert.equal(result.complete, true);
  assert.equal(result.remainingQualifyingTow, 500);
});

test("transfer out reduces qualifying token inventory without XRP proceeds", () => {
  const result = reconcileCostBasis([
    movement("a", 10, "buy", 100, 1000),
    movement("b", 11, "transfer_out", 0, 250),
  ]);
  assert.equal(result.remainingCostXrp, 75);
  assert.equal(result.qualifyingCommitments, 1);
});

test("incomplete wallet history fails closed", () => {
  const result = reconcileCostBasis([movement("b", 11, "sell", 20, 500)]);
  assert.equal(result.complete, false);
  assert.equal(result.qualifyingCommitments, 0);
  assert.ok(result.warnings.length > 0);
});

test("duplicate transactions cannot inflate commitments", () => {
  const buy = movement("a", 10, "buy", 50, 1000);
  const result = reconcileCostBasis([buy, buy]);
  assert.equal(result.complete, false);
  assert.equal(result.remainingCostXrp, 50);
});
