const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const sql=fs.readFileSync(path.join(__dirname,"../supabase/migrations/2026-11-07-tow-legacy-position-reconciliation.sql"),"utf8");
test("legacy reconciliation manifest retains existing position UUIDs",()=>{
  assert.match(sql,/position_id uuid primary key references public\.tow_buy_positions\(id\)/);
  assert.doesNotMatch(sql,/update public\.tow_buy_positions/);
  assert.doesNotMatch(sql,/delete from public\.tow_buy_positions/);
});
test("mapping validator rejects missing source buys and protected payouts",()=>{
  assert.match(sql,/e\.event_type<>'buy'/);
  assert.match(sql,/p\.status in \('claimed','paid'\)/);
  assert.match(sql,/p\.reward_tx_hash is not null/);
  assert.match(sql,/m\.source_tow>e\.tow_amount/);
  assert.match(sql,/m\.source_cost_xrp>e\.xrp_value/);
});
test("manifest is explicitly not an authorization to rewrite live records",()=>{
  assert.match(sql,/'safeToApply',false/);
  assert.match(sql,/'requiresIndependentHistoryAndSliceVerification',true/);
  assert.match(sql,/revoke all on function public\.tow_validate_legacy_mapping/);
});
