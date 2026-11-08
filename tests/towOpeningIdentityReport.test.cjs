const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),vm=require("node:vm"),ts=require("typescript");
const src=fs.readFileSync(require("node:path").join(__dirname,"../lib/towOpeningIdentityReport.ts"),"utf8");
const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const m={exports:{}};vm.runInNewContext(js,{module:m,exports:m.exports,Set,Math,Number,Date,Error});
const {reconcileOpeningIdentities}=m.exports;
const A="A".repeat(64),B="B".repeat(64);
const p={id:"uuid1",buy_tx_hash:A,status:"alive",created_at:"2026-01-01",tow_amount:100,buy_value_xrp:50,unlocked_reward_tow:0};
const o={ordinal:1,costXrp:50,originalTow:100,slices:[{sourceTxHash:A,towAmount:100,costXrp:50}]};
test("unique exact provenance can be proposed without authorizing writes",()=>{
 const r=reconcileOpeningIdentities([p],[o]);
 assert.equal(r.exactMatches.length,1);
 assert.equal(r.safeToApply,false);
});
test("legacy synthetic hash is not assumed to match",()=>{
 const r=reconcileOpeningIdentities([{...p,buy_tx_hash:"synthetic"}],[o]);
 assert.equal(r.exactMatches.length,0);
 assert.equal(r.unmatchedPositions.length,1);
});
test("multiple source purchases cannot be matched by a single hash",()=>{
 const r=reconcileOpeningIdentities([p],[{...o,slices:[{sourceTxHash:A,towAmount:50,costXrp:25},{sourceTxHash:B,towAmount:50,costXrp:25}]}]);
 assert.equal(r.exactMatches.length,0);
 assert.ok(r.blockers.some(x=>x.includes("multi-lot")));
});
test("claimed and rewarded positions are protected",()=>{
 const r=reconcileOpeningIdentities([{...p,unlocked_reward_tow:10}],[o]);
 assert.equal(r.exactMatches.length,0);
});
test("one position cannot map to two reconstructed commitments",()=>{
 const r=reconcileOpeningIdentities([p],[o,{...o,ordinal:2}]);
 assert.equal(r.exactMatches.length,1);
 assert.equal(r.unmatchedOpenings.length,1);
});
