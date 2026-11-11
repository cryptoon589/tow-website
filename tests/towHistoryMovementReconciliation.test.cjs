const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const vm = require("node:vm");
const moduleExports = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync("lib/towHistoryMovementReconciliation.ts","utf8"),
 {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText,{exports:moduleExports});
const compare = moduleExports.compareTowMovements;
const hash = "A".repeat(64);
const rpc = [{hash,ledgerIndex:123,deltaTow:12}];
const stored = [{txHash:hash.toLowerCase(),ledgerIndex:123,eventType:"buy",towAmount:12}];
test("identical history matches",()=>assert.equal(compare(rpc,stored).matches,true));
test("missing stored movement blocks",()=>assert.equal(compare(rpc,[]).matches,false));
test("extra stored movement blocks",()=>assert.equal(compare([],stored).matches,false));
test("amount mismatch blocks",()=>assert.equal(compare(rpc,[{...stored[0],towAmount:11}]).matches,false));
test("ledger mismatch blocks",()=>assert.equal(compare(rpc,[{...stored[0],ledgerIndex:124}]).matches,false));
test("direction mismatch blocks",()=>assert.equal(compare(rpc,[{...stored[0],eventType:"sell"}]).matches,false));
test("duplicate hashes block",()=>assert.equal(compare([...rpc,...rpc],stored).matches,false));
