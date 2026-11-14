const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");

// Execute the actual scanner Payment branch against deterministic metadata fixtures.
// No network, database, real wallets or production flags are involved.
const source = fs.readFileSync("app/api/tired-scan-wallet/route.ts", "utf8");
const start = source.indexOf('  if (txType === "Payment") {');
const end = source.indexOf('  } else {\n    // Do not classify arbitrary new XRPL transaction types', start);
assert.ok(start >= 0 && end > start, "scanner Payment branch must exist");
const paymentBranch = source.slice(start, end) + "\n  }";
const js = ts.transpileModule(paymentBranch, {compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
const issuerAddress = "rIssuerFixture";
const walletAddress = "rSenderFixture";
const destination = "rReceiverFixture";
const amount = {currency:"TOW",issuer:issuerAddress,value:"125"};
const feeNode = {
  ModifiedNode:{
    LedgerEntryType:"AccountRoot",
    FinalFields:{Account:walletAddress,Balance:"999999988"},
    PreviousFields:{Balance:"1000000000"}
  }
};
function run(overrides = {}) {
  const tx = {TransactionType:"Payment",Account:walletAddress,Destination:destination,
    Amount:amount,Fee:"12",...overrides.tx};
  const meta = {TransactionResult:"tesSUCCESS",delivered_amount:amount,
    AffectedNodes:[feeNode],...overrides.meta};
  const context = {tx,meta,txType:"Payment",txHash:"fixture-hash",
    walletAddress:overrides.walletAddress || walletAddress,
    issuerAddress,currencyCode:"TOW",
    towDelta:overrides.towDelta ?? -125,
    currenciesMatch:(a,b)=>a===b,
    BigInt,Number,String,Object,Array,Math,Error};
  vm.runInNewContext(js,context,{timeout:1000});
}
test("accepts a direct, fully delivered TOW transfer with exact sender fee",()=>assert.doesNotThrow(()=>run()));
test("rejects missing sender previous XRP balance",()=>assert.throws(()=>run({meta:{AffectedNodes:[{ModifiedNode:{LedgerEntryType:"AccountRoot",FinalFields:{Account:walletAddress,Balance:"999999988"}}}]}}),/UNVERIFIED_DIRECT_PAYMENT_XRP_FEE/));
test("rejects additional sender XRP movement",()=>assert.throws(()=>run({meta:{AffectedNodes:[{ModifiedNode:{LedgerEntryType:"AccountRoot",FinalFields:{Account:walletAddress,Balance:"999999000"},PreviousFields:{Balance:"1000000000"}}}]}}),/UNVERIFIED_DIRECT_PAYMENT_XRP_FEE/));
test("rejects missing delivered amount",()=>assert.throws(()=>run({meta:{delivered_amount:null}}),/UNVERIFIED_TOW_TRADE_PROVENANCE/));
test("rejects partial delivery",()=>assert.throws(()=>run({meta:{delivered_amount:{...amount,value:"124"}}}),/UNVERIFIED_TOW_TRADE_PROVENANCE/));
test("rejects path payments",()=>assert.throws(()=>run({tx:{Paths:[]}}),/UNVERIFIED_TOW_TRADE_PROVENANCE/));
test("rejects offer execution nodes",()=>assert.throws(()=>run({meta:{AffectedNodes:[feeNode,{ModifiedNode:{LedgerEntryType:"Offer"}}]}}),/UNVERIFIED_TOW_TRADE_PROVENANCE/));
test("rejects failed transactions",()=>assert.throws(()=>run({meta:{TransactionResult:"tecPATH_DRY"}}),/UNVERIFIED_TOW_TRADE_PROVENANCE/));
test("rejects issuer endpoint",()=>assert.throws(()=>run({tx:{Destination:issuerAddress}}),/UNVERIFIED_TOW_TRADE_PROVENANCE/));
test("rejects malformed flags",()=>assert.throws(()=>run({tx:{Flags:"0"}}),/UNVERIFIED_TOW_TRADE_PROVENANCE/));
test("rejects mismatched signed TOW delta",()=>assert.throws(()=>run({towDelta:-124}),/UNVERIFIED_TOW_TRADE_PROVENANCE/));
