-- Disposable database only. Covers pre-proof baseline, post-proof accumulation,
-- selective FIFO disqualification, rebuys and atomic rollback on bad provenance.
begin;
do $test$
declare
  w text := 'r'||repeat('B',25);
  x text := 'r'||repeat('C',25);
  h1 text := repeat('1',64);
  h2 text := repeat('2',64);
  h3 text := repeat('3',64);
  h4 text := repeat('4',64);
  h5 text := repeat('5',64);
  h6 text := repeat('6',64);
  v jsonb;
  n integer;
  a integer;
  d integer;
begin
  insert into public.tow_players(wallet_address,verified,proof_started_at)
  values(w,true,'2026-01-04T00:00:00Z'),
        (x,true,'2026-01-04T00:00:00Z');
  insert into public.tow_accounting_coverage(
    wallet_address,verified_complete,first_wallet_ledger,proof_ledger,
    checked_through_ledger,balance_verified
  ) values(w,true,10,13,20,true),(x,true,10,13,20,true);
  -- Intentionally misleading import timestamps: ledger 10/11 are pre-proof
  -- despite later event_at; ledger 14 is post-proof despite earlier event_at.
  -- 80 XRP / 800 TOW; sell 300 TOW before proof leaves 50 XRP of
  -- qualifying inventory. No pre-proof disqualification is allowed.
  v := public.tow_ingest_and_reconcile_wallet_atomic(w,jsonb_build_array(
    jsonb_build_object('walletAddress',w,'txHash',h1,'eventType','buy',
      'xrpValue',80,'towAmount',800,'ledgerIndex',10,
      'eventAt','2026-01-10T00:00:00Z'),
    jsonb_build_object('walletAddress',w,'txHash',h2,'eventType','sell',
      'xrpValue',1,'towAmount',300,'ledgerIndex',11,
      'eventAt','2026-01-10T00:00:00Z')
  ));
  select count(*) into n from public.tow_buy_positions where wallet_address=w;
  if n<>1 or (select status from public.tow_buy_positions where wallet_address=w)<>'alive'
  then raise exception 'Opening pre-proof sale incorrectly disqualified position'; end if;
  -- Two small post-proof purchases accumulate to another 50 XRP commitment.
  v := public.tow_ingest_and_reconcile_wallet_atomic(w,jsonb_build_array(
    jsonb_build_object('walletAddress',w,'txHash',h3,'eventType','buy',
      'xrpValue',20,'towAmount',200,'ledgerIndex',14,
      'eventAt','2026-01-03T00:00:00Z'),
    jsonb_build_object('walletAddress',w,'txHash',h4,'eventType','buy',
      'xrpValue',30,'towAmount',300,'ledgerIndex',15,
      'eventAt','2026-01-06T00:00:00Z')
  ));
  select count(*) into n from public.tow_buy_positions where wallet_address=w;
  if n<>2 then raise exception 'Small purchases failed to accumulate'; end if;
  -- Outflow consumes oldest source tokens, disqualifying only the opening position.
  v := public.tow_ingest_and_reconcile_wallet_atomic(w,jsonb_build_array(
    jsonb_build_object('walletAddress',w,'txHash',h5,'eventType','transfer_out',
      'xrpValue',0,'towAmount',100,'ledgerIndex',16,
      'eventAt','2026-01-07T00:00:00Z')
  ));
  select count(*) filter(where status='alive'),
    count(*) filter(where status='disqualified') into a,d
  from public.tow_buy_positions where wallet_address=w;
  if a<>1 or d<>1 then raise exception 'Transfer affected unrelated commitment'; end if;
  -- New buy qualifies independently; it cannot revive the disqualified one.
  v := public.tow_ingest_and_reconcile_wallet_atomic(w,jsonb_build_array(
    jsonb_build_object('walletAddress',w,'txHash',h6,'eventType','buy',
      'xrpValue',50,'towAmount',500,'ledgerIndex',17,
      'eventAt','2026-01-08T00:00:00Z')
  ));
  select count(*) filter(where status='alive'),
    count(*) filter(where status='disqualified') into a,d
  from public.tow_buy_positions where wallet_address=w;
  if a<>2 or d<>1 then raise exception 'Rebuy revived or removed original disqualification'; end if;
  -- A mixed-provenance batch must roll back its event insert.
  begin
    perform public.tow_ingest_and_reconcile_wallet_atomic(x,jsonb_build_array(
      jsonb_build_object('walletAddress',x,'txHash',repeat('7',64),
        'eventType','transfer_in','xrpValue',0,'towAmount',10,
        'ledgerIndex',10,'eventAt','2026-01-01T00:00:00Z')
    ));
    raise exception 'Expected provenance failure did not occur';
  exception when others then
    if sqlerrm not like '%MIXED_PROVENANCE_REQUIRES_REVIEW%' then raise; end if;
  end;
  if exists(select 1 from public.tow_wallet_events where wallet_address=x) then
    raise exception 'Atomic ingestion persisted event after reconciliation failure';
  end if;
  raise notice 'PASS: pre-proof sale, accumulated buys, selective transfer, rebuy and atomic rollback';
end;
$test$;
rollback;
