const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const ts=require("typescript");
const src=fs.readFileSync(require("node:path").join(__dirname,"../lib/towOpeningCommitmentAllocation.ts"),"utf8");
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const m={exports:{}};
vm.runInNewContext(js,{module:m,exports:m.exports,Set,Number,Math,Date,Error});
const {allocateOpeningCommitments}=m.exports;
const A="A".repeat(64),B="B".repeat(64);
const lot=(hash,tow,cost)=>({sourceTxHash:hash,acquiredAt:"2026-01-01T00:00:00Z",remainingTow:tow,remainingXrpCost:cost});
test("opening allocations preserve distinct acquisition prices and sources",()=>{
 const r=allocateOpeningCommitments([lot(A,100,30),lot(B,200,70)]);
 assert.equal(r.complete,true);
 assert.equal(r.commitments.length,2);
 assert.equal(r.commitments[0].costXrp,50);
 assert.equal(r.commitments[0].originalTow,100+200*20/70);
 assert.deepEqual(Array.from(r.commitments[0].slices,x=>x.sourceTxHash),[A,B]);
 assert.equal(r.commitments[1].slices[0].sourceTxHash,B);
});
test("subthreshold surviving inventory remains uncommitted",()=>{
 const r=allocateOpeningCommitments([lot(A,70,35)]);
 assert.equal(r.commitments.length,0);
 assert.equal(r.uncommittedTow,70);
 assert.equal(r.uncommittedCostXrp,35);
});
test("exact threshold yields one independent commitment",()=>{
 const r=allocateOpeningCommitments([lot(A,100,50)]);
 assert.equal(r.commitments.length,1);
 assert.equal(r.uncommittedCostXrp,0);
});
test("invalid lots block allocation",()=>{
 const r=allocateOpeningCommitments([lot(A,100,0)]);
 assert.equal(r.complete,false);
});
test("duplicate source lots are rejected",()=>{
 const r=allocateOpeningCommitments([lot(A,100,50),lot(A,100,50)]);
 assert.equal(r.complete,false);
 assert.equal(r.commitments.length,1);
});
