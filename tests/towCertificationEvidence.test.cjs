const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const source = fs.readFileSync("lib/towCertificationEvidence.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const exports = {};
const coverage = { assessHistoryCoverage: () => ({ blockers: [], balanceDifference: 0 }) };
vm.runInNewContext(compiled, { exports, require: () => coverage });
const evaluate = exports.evaluateCertificationEvidence;
const valid = { proofVerified:true, existingLegacyPositions:0, legacyPositionsReconciled:false,
  validatedTransactionCount:2, unvalidatedTransactionCount:0, duplicateTransactionHashes:0,
  proofLedgerIndependentlyVerified:true, tokenBalanceIndependentlyVerified:true, eventCountFromRpc:2 };
test("complete independent evidence can pass", () => assert.equal(evaluate(valid).eligible,true));
test("missing independent proof ledger blocks certification", () => assert.equal(evaluate({...valid,proofLedgerIndependentlyVerified:false}).eligible,false));
test("unvalidated transactions block certification", () => assert.equal(evaluate({...valid,unvalidatedTransactionCount:1}).eligible,false));
test("legacy positions require reconciliation", () => assert.equal(evaluate({...valid,existingLegacyPositions:1}).eligible,false));
test("insufficient validated transaction count blocks certification", () => assert.equal(evaluate({...valid,validatedTransactionCount:1}).eligible,false));
