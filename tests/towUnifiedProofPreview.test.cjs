const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const path = require("node:path");
const cache = {};
function load(name) {
  if (cache[name]) return cache[name];
  const source = fs.readFileSync(path.join(__dirname, "../lib", name + ".ts"), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const shim = { exports: {} };
  cache[name] = shim.exports;
  const localRequire = (id) => id.startsWith("./") ? load(id.slice(2)) : require(id);
  vm.runInNewContext(compiled, {
    module: shim, exports: shim.exports, require: localRequire,
    Set, Date, Number, Math, Error,
  }, { filename: name + ".js" });
  return shim.exports;
}
const { previewVerifiedProof } = load("towUnifiedProofPreview");
const cutoff = "2026-11-01T00:00:00Z";
const tx = (digit, ledgerIndex, eventAt, type, xrpValue, towAmount) => ({
  txHash: digit.repeat(64), ledgerIndex, eventAt, type, xrpValue, towAmount,
});
test("opening balance creates commitments starting at verification", () => {
  const r = previewVerifiedProof([
    tx("a", 10, "2026-10-01T00:00:00Z", "buy", 100, 1000),
  ], cutoff, 50, true);
  assert.equal(r.complete, true);
  assert.equal(r.lifecycle.commitments.length, 2);
  assert.equal(r.lifecycle.commitments[0].createdAt, new Date(cutoff).toISOString());
  assert.equal(r.safeToApply, false);
});
test("historical sells affect opening inventory but not a new disqualification", () => {
  const r = previewVerifiedProof([
    tx("a", 10, "2026-10-01T00:00:00Z", "buy", 100, 1000),
    tx("b", 11, "2026-10-02T00:00:00Z", "sell", 200, 500),
  ], cutoff, 50, true);
  assert.equal(r.lifecycle.commitments.length, 1);
  assert.equal(r.lifecycle.commitments[0].status, "alive");
});
test("post-proof sale permanently disqualifies opening commitment", () => {
  const r = previewVerifiedProof([
    tx("a", 10, "2026-10-01T00:00:00Z", "buy", 100, 1000),
    tx("b", 20, "2026-11-02T00:00:00Z", "sell", 50, 100),
  ], cutoff, 50, true);
  assert.equal(r.lifecycle.commitments.filter((p) => p.status === "disqualified").length, 1);
  assert.equal(r.lifecycle.commitments.filter((p) => p.status === "alive").length, 1);
});
test("incomplete historical coverage blocks trustworthy preview", () => {
  const r = previewVerifiedProof([
    tx("a", 10, "2026-10-01T00:00:00Z", "buy", 50, 500),
  ], cutoff, 50, false);
  assert.equal(r.complete, false);
  assert.ok(r.warnings.some((w) => w.includes("Full XRPL history")));
});
