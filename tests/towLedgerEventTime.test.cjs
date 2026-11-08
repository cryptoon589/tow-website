const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const ts=require("typescript");
const Module=require("node:module");
const path=require("node:path");
const filename=path.resolve(__dirname,"../lib/towLedgerEventTime.ts");
const js=ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const m=new Module(filename,module);m.filename=filename;m.paths=module.paths;m._compile(js,filename);
const {xrplLedgerTimestamp,extractLedgerDatedMovements}=m.exports;
test("XRPL epoch produces correct transaction time",()=>{
 assert.equal(xrplLedgerTimestamp({tx:{date:833831230}}),"2026-06-03T19:47:10.000Z");
});
test("missing or malformed date fails closed",()=>{
 for(const raw of [{tx:{}},{tx:{date:-1}},{tx:{date:"1.1"}},{tx:{date:"9007199254740992"}},{}])
  assert.equal(xrplLedgerTimestamp(raw),null);
});
test("historical replay uses chain time and reports imported timestamp drift",()=>{
 const r=extractLedgerDatedMovements([{
  tx_hash:"A".repeat(64),event_type:"buy",ledger_index:104678453,
  tow_amount:"123.4",xrp_value:"50",event_at:"2026-06-04T19:02:44Z",
  raw_event:{tx:{date:833831230}}
 }]);
 assert.equal(r.invalidHashes.length,0);
 assert.equal(r.timestampDisagreements.length,1);
 assert.equal(r.movements[0].eventAt,"2026-06-03T19:47:10.000Z");
});
