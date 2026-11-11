const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("lib/towHistoricalBalanceVerification.ts","utf8");
const route = fs.readFileSync("app/api/tired-verify-history/route.ts","utf8");
test("proof ledger resolved using validated ledger close timestamps",()=>{
 assert.match(source,/data.validated !== true/);
 assert.match(source,/beforeClose < proofMs && proofMs < afterClose/);
 assert.match(source,/ledger_index: index/);
});
test("historical balance comes from ledger-indexed account_lines, not current balance",()=>{
 assert.match(source,/ledger_index: lo/);
 assert.match(source,/result.validated !== true/);
 assert.match(source,/Historical account_lines pagination incomplete/);
});
test("live report blocks mismatched historical inventory and ambiguous proof ledger",()=>{
 assert.match(route,/HISTORICAL_BALANCE_RECONSTRUCTION_MISMATCH/);
 assert.match(route,/PROOF_LEDGER_TRANSACTION_ORDER_REQUIRES_REVIEW/);
 assert.match(route,/HISTORICAL_TOKEN_BALANCE_OR_PROOF_LEDGER_UNAVAILABLE/);
 assert.match(route,/certified: false/);
});
