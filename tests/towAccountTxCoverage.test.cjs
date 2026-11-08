const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(require("node:path").join(__dirname, "../lib/towAccountTxCoverage.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const shim = { exports: {} };
vm.runInNewContext(compiled, { module: shim, exports: shim.exports, Set, Number, Math, Error });
const { inspectAccountTxCoverage } = shim.exports;
const A = "A".repeat(64), B = "B".repeat(64), C = "C".repeat(64);
test("complete account_tx pagination does not imply verified TOW classification", () => {
  const r = inspectAccountTxCoverage([A, B], [A], true);
  assert.equal(r.completePagination, true);
  assert.equal(r.verifiedComplete, false);
  assert.deepEqual(Array.from(r.rpcHashesNotStoredAsTowEvents), [B]);
});
test("stored hash absent from account history is reported", () => {
  const r = inspectAccountTxCoverage([A], [A, C], true);
  assert.deepEqual(Array.from(r.storedHashesNotFoundOnRpc), [C]);
});
test("partial pagination cannot be considered complete", () => {
  const r = inspectAccountTxCoverage([A], [A], false);
  assert.equal(r.completePagination, false);
  assert.ok(r.warnings.some((w) => w.includes("pagination")));
});
test("duplicate hashes are detected", () => {
  const r = inspectAccountTxCoverage([A, A], [B, B], true);
  assert.deepEqual(Array.from(r.duplicateRpcHashes), [A]);
  assert.deepEqual(Array.from(r.duplicateStoredHashes), [B]);
});
test("case-normalized hash comparison avoids false mismatches", () => {
  const r = inspectAccountTxCoverage([A.toLowerCase()], [A], true);
  assert.equal(r.storedHashesNotFoundOnRpc.length, 0);
});
