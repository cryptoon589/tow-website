const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync(require("node:path").join(__dirname,"../lib/towPurchaseLotInventory.ts"),"utf8");
const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const moduleShim={exports:{}};
vm.runInNewContext(js,{module:moduleShim,exports:moduleShim.exports,Set,Number,Math,Date,Error});
const {replayPurchaseLots}=moduleShim.exports;
const A="A".repeat(64), B="B".repeat(64), C="C".repeat(64), D="D".repeat(64);
const ev=(hash,ledger,type,tow,xrp=0)=>({txHash:hash,ledgerIndex:ledger,eventAt:"2026-11-01T00:00:00Z",type,towAmount:tow,xrpValue:xrp});
test("FIFO preserves each purchase cost instead of subtracting sale proceeds",()=>{
 const r=replayPurchaseLots([ev(A,1,"buy",100,50),ev(B,2,"buy",100,200),ev(C,3,"sell",50,500)]);
 assert.equal(r.complete,true);
 assert.equal(r.lots[0].remainingTow,50);
 assert.equal(r.lots[0].remainingCostXrp,25);
 assert.equal(r.lots[1].remainingCostXrp,200);
 assert.equal(r.totalRemainingXrpCost,225);
});
test("outflow crossing lots consumes oldest lot then next",()=>{
 const r=replayPurchaseLots([ev(A,1,"buy",100,50),ev(B,2,"buy",100,200),ev(C,3,"transfer_out",120)]);
 assert.deepEqual(Array.from(r.consumed,x=>[x.sourceTxHash,x.towConsumed]),[[A,100],[B,20]]);
 assert.equal(r.lots[0].remainingCostXrp,0);
 assert.equal(r.lots[1].remainingCostXrp,160);
});
test("repurchase does not restore spent purchase lot",()=>{
 const r=replayPurchaseLots([ev(A,1,"buy",100,50),ev(B,2,"sell",100,30),ev(C,3,"buy",100,50)]);
 assert.equal(r.lots[0].remainingTow,0);
 assert.equal(r.lots[1].remainingTow,100);
});
test("mixed incoming transfers fail closed",()=>{
 const r=replayPurchaseLots([ev(A,1,"buy",100,50),ev(B,2,"transfer_in",50),ev(C,3,"sell",10,5)]);
 assert.equal(r.complete,false);
 assert.ok(r.warnings.some(w=>w.includes("Ambiguous")));
});
test("duplicate tx hash does not double count",()=>{
 const r=replayPurchaseLots([ev(A,1,"buy",100,50),ev(A,2,"buy",100,50)]);
 assert.equal(r.complete,false);
 assert.equal(r.lots.length,1);
});
test("overselling flags missing inventory",()=>{
 const r=replayPurchaseLots([ev(A,1,"buy",10,50),ev(B,2,"sell",20,50)]);
 assert.equal(r.complete,false);
 assert.ok(r.warnings.some(w=>w.includes("exceeds inventory")));
});
test("ledger ordering wins over input order",()=>{
 const r=replayPurchaseLots([ev(B,2,"buy",100,200),ev(A,1,"buy",100,50),ev(C,3,"sell",10,1)]);
 assert.equal(r.consumed[0].sourceTxHash,A);
});
test("invalid or missing XRP cost fails closed",()=>{
 const r=replayPurchaseLots([ev(A,1,"buy",100,0)]);
 assert.equal(r.complete,false);
 assert.equal(r.lots.length,0);
});
