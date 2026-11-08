const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const Module = require("node:module");
const filename = require("node:path").resolve(__dirname, "../lib/towLegacyProvenanceDiagnostic.ts");
const js = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
}).outputText;
const m = new Module(filename, module);
m.filename = filename;
m.paths = module.paths;
m._compile(js, filename);
const { inspectLegacyPositionProvenance } = m.exports;
const hash = "A".repeat(64);
const wallet = "rWallet";
const buy = [{ wallet_address: wallet, tx_hash: hash, event_type: "buy" }];
test("two legacy positions can refer to the same real buy without mutation", () => {
  const positions = [1, 2].map(n => ({id: String(n),wallet_address:wallet,buy_tx_hash:hash+"_"+n}));
  const report = inspectLegacyPositionProvenance(positions,buy);
  assert.deepEqual(report.map(r=>r.status),["matched_purchase","matched_purchase"]);
  assert.deepEqual(report.map(r=>r.syntheticOrdinal),[1,2]);
  assert.ok(report.every(r=>r.ledgerTxHash===hash && r.safeToMigrate===false));
  assert.equal(positions[0].buy_tx_hash,hash+"_1");
});
test("wrong wallet and sell event do not match", () => {
  const position=[{id:"1",wallet_address:wallet,buy_tx_hash:hash+"_1"}];
  assert.equal(inspectLegacyPositionProvenance(position,[{...buy[0],wallet_address:"other"}])[0].status,"missing_purchase");
  assert.equal(inspectLegacyPositionProvenance(position,[{...buy[0],event_type:"sell"}])[0].status,"missing_purchase");
});
test("duplicate buy events are ambiguous, not silently accepted", () => {
  const p=[{id:"1",wallet_address:wallet,buy_tx_hash:hash+"_1"}];
  assert.equal(inspectLegacyPositionProvenance(p,[...buy,...buy])[0].status,"ambiguous_purchase");
});
test("invalid synthetic ordinal and malformed hash fail closed", () => {
  const values=[hash+"_0",hash+"_01",hash+"_9007199254740992","NOT_A_HASH"];
  for(const ref of values) {
    const report=inspectLegacyPositionProvenance([{id:"1",wallet_address:wallet,buy_tx_hash:ref}],buy)[0];
    assert.equal(report.status,"invalid_reference");
    assert.equal(report.safeToMigrate,false);
  }
});
