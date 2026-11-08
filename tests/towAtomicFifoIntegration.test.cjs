const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.join(__dirname,"..");
const sql=fs.readFileSync(path.join(root,"supabase/migrations/2026-11-07-tow-fifo-commitment-engine.sql"),"utf8");
const route=fs.readFileSync(path.join(root,"app/api/tired-sync/route.ts"),"utf8");
test("FIFO sync is disabled by default and invokes one combined transaction when enabled",()=>{
 assert.match(route,/TOW_ENABLE_FIFO_ACCOUNTING === "true"/);
 assert.match(route,/tow_ingest_and_reconcile_wallet_atomic/);
 assert.match(sql,/v_ingest := public\.tow_ingest_wallet_events_atomic/);
 assert.match(sql,/v_reconcile := public\.tow_reconcile_wallet_atomic/);
});
test("legacy position UUIDs are protected until source lots reconciled",()=>{
 assert.match(sql,/LEGACY_POSITION_RECONCILIATION_REQUIRED/);
 assert.match(sql,/references public\.tow_buy_positions\(id\)/);
});
test("opening inventory is allocated before first post-proof movement",()=>{
 const open=sql.indexOf("if not v_proof_started and v_event.event_at >= v_player.proof_started_at");
 const buy=sql.indexOf("if v_event.event_type = 'buy' then");
 assert.ok(open>=0&&buy>open);
 assert.match(sql,/tow_accounting_initialized/);
});
test("sell consumption is ordered across committed and uncommitted tokens",()=>{
 assert.match(sql,/union all/);
 assert.match(sql,/order by ledger_index,acquired_at,source_tx_hash,movement_kind,position_id/);
 assert.match(sql,/if v_slice.position_status='alive'/);
 assert.match(sql,/status='disqualified'/);
});
test("ambiguous transfers and protected claims fail closed",()=>{
 assert.match(sql,/MIXED_PROVENANCE_REQUIRES_REVIEW/);
 assert.match(sql,/Protected commitment consumed/);
 assert.match(sql,/MISSING_TRANSACTION_INDEX/);
});
test("per-commitment original reward is capped at 20 percent",()=>{
 assert.match(sql,/round\(v_allocated\*0\.2,6\)/);
});
