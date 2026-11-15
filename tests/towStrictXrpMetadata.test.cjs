const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const src = fs.readFileSync("app/api/tired-scan-wallet/route.ts","utf8");
const start = src.indexOf("function getXrpDeltaFromMeta(");
const end = src.indexOf("\nfunction getTxObject(",start);
assert.ok(start>=0 && end>start);
const js = ts.transpileModule(src.slice(start,end),{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
const context = {
 getLedgerEntryType:n=>(n.ModifiedNode||n.CreatedNode||n.DeletedNode)?.LedgerEntryType,
 getFinalFields:n=>(n.ModifiedNode||n.CreatedNode||n.DeletedNode)?.FinalFields,
 getPreviousFields:n=>(n.ModifiedNode||n.CreatedNode||n.DeletedNode)?.PreviousFields,
 BigInt,Number,String,Array,Error
};
vm.createContext(context);
vm.runInContext(js,context);
const wallet="rWalletFixture";
const root=(before,after)=>({ModifiedNode:{LedgerEntryType:"AccountRoot",FinalFields:{Account:wallet,Balance:after},PreviousFields:before===undefined?{}:{Balance:before}}});
const check=(nodes)=>context.getXrpDeltaFromMeta({AffectedNodes:nodes},wallet);
test("fee-only XRP movement is measured exactly",()=>assert.equal(check([root("1000000000","999999988")]),-0.000012));
test("unchanged XRP balance is zero",()=>assert.equal(check([root("100","100")]),0));
test("unrelated AccountRoot is ignored",()=>assert.equal(check([{ModifiedNode:{LedgerEntryType:"AccountRoot",FinalFields:{Account:"rOther",Balance:"1"}}}]),0));
test("missing affected nodes is not proof of zero",()=>assert.throws(()=>context.getXrpDeltaFromMeta({},wallet),/UNVERIFIED_XRP_BALANCE_METADATA/));
test("missing previous balance fails closed",()=>assert.throws(()=>check([root(undefined,"100")]),/UNVERIFIED_XRP_BALANCE_METADATA/));
test("malformed final balance fails closed",()=>assert.throws(()=>check([root("100","invalid")]),/UNVERIFIED_XRP_BALANCE_METADATA/));
test("duplicate account roots fail closed",()=>assert.throws(()=>check([root("100","99"),root("99","98")]),/UNVERIFIED_XRP_BALANCE_METADATA/));
test("unsafe numeric delta fails closed",()=>assert.throws(()=>check([root("999999999999999999999999","0")]),/UNVERIFIED_XRP_BALANCE_METADATA/));
