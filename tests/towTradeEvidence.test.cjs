const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const source = fs.readFileSync("lib/towTradeEvidence.ts","utf8");
const js = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2019}}).outputText;
const testExports = {};
vm.runInNewContext(js,{exports:testExports,BigInt,Number,String,Array,Error});
const assess = testExports.assessUncertifiedTradeEvidence;
const wallet = "rFixtureWallet";
const hash = "A".repeat(64);
const make = (before,after,fee="12",sender=wallet)=>({
 txHash:hash,walletAddress:wallet,towDelta:10,
 tx:{Account:sender,Fee:fee,TransactionType:"OfferCreate"},
 meta:{TransactionResult:"tesSUCCESS",AffectedNodes:[{ModifiedNode:{
 LedgerEntryType:"AccountRoot",FinalFields:{Account:wallet,Balance:after},
 PreviousFields:before===undefined?{}:{Balance:before}
 }},{ModifiedNode:{LedgerEntryType:"Offer",PreviousFields:{TakerPays:"2000000",TakerGets:{currency:"TOW",issuer:"rIssuer",value:"20"}},FinalFields:{Account:wallet,TakerPays:"1000000",TakerGets:{currency:"TOW",issuer:"rIssuer",value:"10"}}}}]}
});
test("buy excludes transaction fee and remains uncertified",()=>{
 const r=assess(make("100000000","94999988"));
 assert.equal(r.netXrpExcludingFee,-5);
 assert.equal(r.networkFeeXrp,0.000012);
 assert.equal(r.independentlyAttested,false);
 assert.equal(r.direction,"buy");
});
test("sell excludes fee and remains uncertified",()=>{
 const v=make("100000000","102999988");v.towDelta=-10;
 const r=assess(v);assert.equal(r.netXrpExcludingFee,3);assert.equal(r.direction,"sell");
 assert.equal(r.independentlyAttested,false);
});
test("non-sender never subtracts someone else's fee",()=>{
 const v=make("100000000","95000000","12","rOther");
 assert.equal(assess(v).netXrpExcludingFee,-5);
});
test("missing prior balance fails closed",()=>assert.throws(()=>assess(make(undefined,"95000000")),/INVALID_XRP_DROPS_EVIDENCE/));
test("duplicate account roots fail closed",()=>{
 const v=make("100000000","95000000");v.meta.AffectedNodes.push(v.meta.AffectedNodes[0]);
 assert.throws(()=>assess(v),/UNVERIFIED_TRADE_XRP_ACCOUNT_ROOT/);
});
test("buy with XRP inflow fails",()=>assert.throws(()=>assess(make("100000000","110000000")),/TRADE_BUY_XRP_DIRECTION_MISMATCH/));
test("sell with XRP outflow fails",()=>{
 const v=make("100000000","90000000");v.towDelta=-10;
 assert.throws(()=>assess(v),/TRADE_SELL_XRP_DIRECTION_MISMATCH/);
});
test("failed transaction fails",()=>{
 const v=make("100000000","95000000");v.meta.TransactionResult="tecFAILED";
 assert.throws(()=>assess(v),/INVALID_TRADE_EVIDENCE/);
});
test("missing fee on sender fails",()=>{const v=make("100000000","95000000");delete v.tx.Fee;assert.throws(()=>assess(v),/INVALID_XRP_DROPS_EVIDENCE/);});
test("oversized XRP delta fails",()=>assert.throws(()=>assess(make("99999999999999999999","1")),/XRP_DELTA_OUT_OF_SAFE_RANGE/));

test("no execution node fails even with plausible XRP and TOW deltas",()=>{
 const v=make("100000000","94999988");v.meta.AffectedNodes.pop();
 assert.throws(()=>assess(v),/MISSING_DEX_EXECUTION_PROVENANCE/);
});
test("unrelated account cannot claim another wallet's execution",()=>{
 const v=make("100000000","94999988","12","rOther");
 v.meta.AffectedNodes[1].ModifiedNode.FinalFields.Account="rThird";
 assert.throws(()=>assess(v),/UNATTRIBUTED_DEX_EXECUTION/);
});
test("non-DEX transaction cannot claim trade evidence",()=>{
 const v=make("100000000","94999988");v.tx.TransactionType="TrustSet";
 assert.throws(()=>assess(v),/UNSUPPORTED_DEX_TRADE_TRANSACTION/);
});

test("offer node without previous executed amounts is rejected",()=>{
 const v=make("100000000","94999988");
 delete v.meta.AffectedNodes[1].ModifiedNode.PreviousFields;
 assert.throws(()=>assess(v),/UNVERIFIED_DEX_EXECUTED_FILL/);
});
test("unchanged offer is not execution evidence",()=>{
 const v=make("100000000","94999988");
 v.meta.AffectedNodes[1].ModifiedNode.FinalFields.TakerPays="2000000";
 assert.throws(()=>assess(v),/UNVERIFIED_DEX_EXECUTED_FILL/);
});
test("one-sided offer movement is not a verified fill",()=>{
 const v=make("100000000","94999988");
 v.meta.AffectedNodes[1].ModifiedNode.FinalFields.TakerGets.value="20";
 assert.throws(()=>assess(v),/UNVERIFIED_DEX_EXECUTED_FILL/);
});
test("deleted offer without full executed amounts fails closed",()=>{
 const v=make("100000000","94999988");
 v.meta.AffectedNodes[1]={DeletedNode:v.meta.AffectedNodes[1].ModifiedNode};
 assert.throws(()=>assess(v),/UNVERIFIED_DEX_EXECUTED_FILL/);
});
