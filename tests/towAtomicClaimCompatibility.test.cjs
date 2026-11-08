const test=require("node:test"),assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const route=fs.readFileSync(path.join(__dirname,"../app/api/tired-claim-execute/route.ts"),"utf8");
const migration=fs.readFileSync(path.join(__dirname,"../supabase/migrations/2026-11-07-tow-atomic-claim-execute.sql"),"utf8");
test("claim route retains existing auth, input and response API",()=>{
 assert.match(route,/x-tow-claim-secret/);
 assert.match(route,/body\?\.claimCode/);
 assert.match(route,/body\?\.telegramUsername/);
 assert.match(route,/return NextResponse\.json\(data\)/);
});
test("claim route uses one atomic RPC instead of partial updates",()=>{
 assert.match(route,/\.rpc\("tow_execute_claim_atomic"/);
 assert.doesNotMatch(route,/\.from\("tow_buy_positions"\)/);
 assert.doesNotMatch(route,/\.from\("tow_survivor_archives"\)/);
});
test("SQL serializes claim, locks position, and revokes public execution",()=>{
 assert.match(migration,/for update/);
 assert.match(migration,/v_position\.status <> 'alive'/);
 assert.match(migration,/revoke all on function public\.tow_execute_claim_atomic/);
 assert.match(migration,/grant execute on function public\.tow_execute_claim_atomic.*service_role/);
});
test("claim calculation matches main's survival and loyalty tiers",()=>{
 assert.match(migration,/when v_days >= 84 then 15/);
 assert.match(migration,/when v_days >= 56 then 7/);
 assert.match(migration,/else 2\.5/);
 assert.match(migration,/floor\(v_days::numeric \/ 28\) \* 0\.25/);
});
