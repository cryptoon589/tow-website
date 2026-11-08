const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const ts=require("typescript");
const Module=require("node:module");
const path=require("node:path");
const filename=path.resolve(__dirname,"../lib/towMovementAudit.ts");
const js=ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const m=new Module(filename,module);m.filename=filename;m.paths=module.paths;m._compile(js,filename);
const {auditTowMovements}=m.exports;
const hash="A".repeat(64);
const move={hash,ledgerIndex:100,deltaTow:100,hasTowMovement:true,reliable:true,warnings:[]};
const event={tx_hash:hash,event_type:"buy",tow_amount:100};
test("matching movement still cannot certify historical coverage",()=>{
 const r=auditTowMovements([move],[event],true,false);
 assert.equal(r.readyForCertification,false);
 assert.equal(r.missingStoredMovements.length,0);
 assert.equal(r.amountMismatches.length,0);
 assert.ok(r.blockers.some(b=>b.includes("ledger coverage")));
});
test("missing stored event and incomplete pagination block",()=>{
 const r=auditTowMovements([move],[],false,false);
 assert.deepEqual(r.missingStoredMovements,[hash]);
 assert.ok(r.blockers.some(b=>b.includes("pagination")));
});
test("direction and amount mismatch are detected",()=>{
 for(const bad of [{...event,event_type:"sell"},{...event,tow_amount:99}]) {
  assert.deepEqual(auditTowMovements([move],[bad],true,false).amountMismatches,[hash]);
 }
});
test("unreliable metadata, duplicates and truncated storage block",()=>{
 const r=auditTowMovements([{...move,reliable:false,deltaTow:null},move],[event,event],true,true);
 assert.equal(r.readyForCertification,false);
 assert.deepEqual(r.duplicateRpcMovements,[hash]);
 assert.deepEqual(r.duplicateStoredEvents,[hash]);
 assert.ok(r.untrustedRpcMovements.length);
 assert.ok(r.blockers.some(b=>b.includes("truncated")));
});
