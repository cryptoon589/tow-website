-- ISOLATED TEST DATABASE ONLY.
-- Prerequisites: existing Proof of Tiredness schema and all staged FIFO/ingest
-- migrations applied to a disposable database. This test never commits.
-- Execute with psql -v ON_ERROR_STOP=1 -f <this-file>.
begin;
do $test$
declare
  w text := 'r' || repeat('A',25);
  buy_hash text := repeat('A',64);
  sell_hash text := repeat('B',64);
  buy_event jsonb;
  sell_event jsonb;
  result jsonb;
  positions integer;
  disqualified integer;
  alive integer;
  position_ids uuid[];
  total_tow numeric;
begin
  if exists(select 1 from public.tow_players where wallet_address=w) then
    raise exception 'Fixture wallet already exists: refuse to overwrite';
  end if;
  insert into public.tow_players(wallet_address,verified,proof_started_at)
  values(w,true,'2026-01-02T00:00:00Z');
  insert into public.tow_accounting_coverage(
    wallet_address,verified_complete,checked_at,first_wallet_ledger,
    proof_ledger,checked_through_ledger,balance_verified,notes
  ) values(w,true,now(),100,101,102,true,'TEST FIXTURE ONLY');
  buy_event := jsonb_build_object(
    'walletAddress',w,'txHash',buy_hash,'eventType','buy',
    'xrpValue',100.000012,'towAmount',1000,'ledgerIndex',100,
    'eventAt','2026-01-01T00:00:00Z',
    'rawEvent',jsonb_build_object('tx',jsonb_build_object('Fee','12'),'meta',jsonb_build_object('TransactionIndex',0))
  );
  sell_event := jsonb_build_object(
    'walletAddress',w,'txHash',sell_hash,'eventType','sell',
    'xrpValue',10,'towAmount',100,'ledgerIndex',102,
    'eventAt','2026-01-03T00:00:00Z',
    'rawEvent',jsonb_build_object('tx',jsonb_build_object('Fee','0'),'meta',jsonb_build_object('TransactionIndex',0))
  );
  result := public.tow_ingest_and_reconcile_wallet_atomic(
    w,jsonb_build_array(buy_event,sell_event));
  if result->>'ok' <> 'true' or (result->>'positionsCreated')::integer <> 2
     or (result->>'disqualified')::integer <> 1 then
    raise exception 'Unexpected first replay: %',result;
  end if;
  select count(*),count(*) filter(where status='alive'),
    count(*) filter(where status='disqualified'),
    sum(tow_amount),array_agg(id order by buy_tx_hash)
  into positions,alive,disqualified,total_tow,position_ids
  from public.tow_buy_positions where wallet_address=w;
  if positions<>2 or alive<>1 or disqualified<>1 or total_tow<>1000 then
    raise exception 'Incorrect independent FIFO commitments';
  end if;
  result := public.tow_ingest_and_reconcile_wallet_atomic(
    w,jsonb_build_array(buy_event,sell_event));
  if (result->>'positionsCreated')::integer <> 0
     or (result->>'disqualified')::integer <> 0
     or (result->>'duplicates')::integer <> 2 then
    raise exception 'Duplicate replay mutated positions: %',result;
  end if;
  if (select array_agg(id order by buy_tx_hash)
      from public.tow_buy_positions where wallet_address=w)
     is distinct from position_ids then
    raise exception 'Idempotent replay changed position UUIDs';
  end if;
  raise notice 'PASS: 100 XRP creates 2 positions; 100 TOW sell disqualifies only oldest; replay preserves UUIDs';
end;
$test$;
rollback;
