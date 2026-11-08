const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(require("node:path").join(__dirname, "../lib/towLedgerMovementInspection.ts"), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const shim = { exports: {} };
vm.runInNewContext(compiled, { module: shim, exports: shim.exports, Set, Date, Number, Math, Error });
const { inspectTowDelta } = shim.exports;
const W = "rWallet", I = "rIssuer";
const fields = (value) => ({
  LowLimit: { issuer: W, currency: "TOW" },
  HighLimit: { issuer: I, currency: "TOW" },
  Balance: { value: String(value), currency: "TOW" },
});
const entry = (node) => ({
  tx: { hash: "A".repeat(64) }, ledger_index: 100,
  meta: { TransactionResult: "tesSUCCESS", AffectedNodes: [node] },
});
test("modified trust-line delta uses signed wallet balance", () => {
  const e = entry({ ModifiedNode: {
    LedgerEntryType: "RippleState", FinalFields: fields(125),
    PreviousFields: { Balance: { value: "100", currency: "TOW" } },
  } });
  const r = inspectTowDelta(e, W, I, "TOW");
  assert.equal(r.reliable, true);
  assert.equal(r.deltaTow, 25);
});
test("reverse trust-line ordering inverts balance sign", () => {
  const e = entry({ ModifiedNode: {
    LedgerEntryType: "RippleState",
    FinalFields: { ...fields(80), LowLimit: { issuer: I, currency: "TOW" }, HighLimit: { issuer: W, currency: "TOW" } },
    PreviousFields: { Balance: { value: "100", currency: "TOW" } },
  } });
  assert.equal(inspectTowDelta(e, W, I, "TOW").deltaTow, 20);
});
test("created trust line begins at zero", () => {
  const r = inspectTowDelta(entry({ CreatedNode: {
    LedgerEntryType: "RippleState", NewFields: fields(50),
  } }), W, I, "TOW");
  assert.equal(r.deltaTow, 50);
});
test("missing previous balance fails closed", () => {
  const r = inspectTowDelta(entry({ ModifiedNode: {
    LedgerEntryType: "RippleState", FinalFields: fields(50),
  } }), W, I, "TOW");
  assert.equal(r.reliable, false);
  assert.equal(r.deltaTow, null);
});
test("non-TOW trust line is not a TOW movement", () => {
  const r = inspectTowDelta(entry({ CreatedNode: {
    LedgerEntryType: "RippleState", NewFields: {
      ...fields(50), Balance: { value: "50", currency: "USD" },
    },
  } }), W, I, "TOW");
  assert.equal(r.hasTowMovement, false);
  assert.equal(r.deltaTow, 0);
});

test("deleted trust line uses pre-delete balance rather than FinalFields as post-balance", () => {
  const r = inspectTowDelta(entry({ DeletedNode: {
    LedgerEntryType: "RippleState",
    FinalFields: fields(0),
    PreviousFields: { Balance: { value: "40", currency: "TOW" } },
  } }), W, I, "TOW");
  assert.equal(r.reliable, true);
  assert.equal(r.deltaTow, -40);
});
test("deleted zero-balance trust line does not invent a transfer", () => {
  const r = inspectTowDelta(entry({ DeletedNode: {
    LedgerEntryType: "RippleState", FinalFields: fields(0),
  } }), W, I, "TOW");
  assert.equal(r.reliable, true);
  assert.equal(r.deltaTow, 0);
});
test("deleted nonzero trust line without previous balance fails closed", () => {
  const r = inspectTowDelta(entry({ DeletedNode: {
    LedgerEntryType: "RippleState", FinalFields: fields(12),
  } }), W, I, "TOW");
  assert.equal(r.reliable, false);
  assert.equal(r.deltaTow, null);
});
