const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(require("node:path").join(__dirname, "../lib/towProofBaseline.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const shim = { exports: {} };
vm.runInNewContext(compiled, { module: shim, exports: shim.exports, Set, Date, Number, Math, Error });
const { reconstructProofBaseline } = shim.exports;
const cutoff = "2026-11-01T00:00:00Z";
const tx = (digit, day, type, xrpValue, towAmount) => ({
  txHash: digit.repeat(64),
  ledgerIndex: day,
  eventAt: new Date(Date.UTC(2026, 9, day)).toISOString(),
  type, xrpValue, towAmount,
});

test("pre-verification buys establish initial eligible cost", () => {
  const r = reconstructProofBaseline([tx("a", 1, "buy", 100, 1000)], cutoff);
  assert.equal(r.complete, true);
  assert.equal(r.commitmentsAtStart, 2);
  assert.equal(r.qualifyingTow, 1000);
});

test("historical sale removes proportional acquisition cost, not proceeds", () => {
  const r = reconstructProofBaseline([
    tx("a", 1, "buy", 100, 1000),
    tx("b", 2, "sell", 500, 500),
  ], cutoff);
  assert.equal(r.complete, true);
  assert.equal(r.qualifyingXrpCost, 50);
  assert.equal(r.commitmentsAtStart, 1);
});

test("new purchases after verification are separated from starting balance", () => {
  const after = { ...tx("b", 2, "buy", 50, 500), eventAt: "2026-11-02T00:00:00Z" };
  const r = reconstructProofBaseline([tx("a", 1, "buy", 50, 500), after], cutoff);
  assert.equal(r.commitmentsAtStart, 1);
  assert.equal(r.postProofEvents.length, 1);
});

test("unexplained historical token outflow fails closed", () => {
  const r = reconstructProofBaseline([tx("a", 1, "sell", 10, 100)], cutoff);
  assert.equal(r.complete, false);
  assert.ok(r.warnings.length > 0);
});

test("mixed transferred-in tokens fail closed on ambiguous sale", () => {
  const r = reconstructProofBaseline([
    tx("a", 1, "buy", 50, 500),
    tx("b", 2, "transfer_in", 0, 200),
    tx("c", 3, "sell", 10, 100),
  ], cutoff);
  assert.equal(r.complete, false);
});
