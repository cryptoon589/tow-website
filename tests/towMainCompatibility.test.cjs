const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const scan=fs.readFileSync(path.join(__dirname,"../app/api/tired-scan-wallet/route.ts"),"utf8");
const status=fs.readFileSync(path.join(__dirname,"../app/api/tired-status/route.ts"),"utf8");
const sync=fs.readFileSync(path.join(__dirname,"../app/api/tired-sync/route.ts"),"utf8");
const mainCompatibleRoutes=["tired-scan-wallet","tired-status","tired-sync"];
test("scanner requires every sync result to acknowledge its matching tx hash",()=>{
 assert.match(scan,/syncResult\.results\.length !== events\.length/);
 assert.match(scan,/events\[index\]\.txHash/);
 assert.match(scan,/r\?\.ok !== true/);
});
test("scanner rejects invalid ledger indices before checkpoint",()=>{
 assert.match(scan,/Number\.isSafeInteger\(ledgerIndex\)/);
 assert.match(scan,/checkpoint NOT advanced/);
});
test("status counts only explicitly disqualified positions",()=>{
 assert.match(status,/normalizedPositions\.filter\(\(position\) => position\.status === "disqualified"\)\.length/);
});
test("existing main API routes retain POST and GET exports",()=>{
 assert.match(scan,/export async function POST\(/);
 assert.match(sync,/export async function POST\(/);
 assert.match(status,/export async function GET\(/);
});
