-- Atomic, append-only ingestion for verified wallet movements.
-- This is the durable ledger-event foundation for commitment reconciliation.
-- Existing position UUIDs, claim records and rewards are never rewritten.
begin;
create or replace function public.tow_ingest_wallet_events_atomic(
  p_wallet text,
  p_events jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event jsonb;
  v_hash text;
  v_type text;
  v_xrp numeric;
  v_tow numeric;
  v_ledger bigint;
  v_time timestamptz;
  v_count integer := 0;
  v_duplicate integer := 0;
  v_existing public.tow_wallet_events%rowtype;
  v_previous_ledger bigint := 0;
  v_previous_time timestamptz;
  v_verified boolean;
begin
  if p_wallet is null or p_wallet !~ '^r[1-9A-HJ-NP-Za-km-z]{24,34}$' then
    raise exception 'Invalid XRPL wallet';
  end if;
  if jsonb_typeof(p_events) <> 'array' or jsonb_array_length(p_events) > 1000 then
    raise exception 'Expected up to 1000 wallet events';
  end if;
  -- Lock the existing player row to serialize concurrent ingestion per wallet.
  select verified into v_verified from public.tow_players
    where wallet_address = p_wallet for update;
  if not found then raise exception 'Wallet is not registered'; end if;
  for v_event in select value from jsonb_array_elements(p_events) loop
    v_hash := upper(v_event->>'txHash');
    v_type := v_event->>'eventType';
    if coalesce(v_hash,'') !~ '^[0-9A-F]{64}$'
       or v_type not in ('buy','sell','transfer_in','transfer_out','reward') then
      raise exception 'Invalid transaction hash or movement type';
    end if;
    if v_event->>'walletAddress' is distinct from p_wallet then
      raise exception 'Mixed-wallet event batch';
    end if;
    if v_event->>'xrpValue' is null or v_event->>'towAmount' is null
       or v_event->>'ledgerIndex' is null or v_event->>'eventAt' is null then
      raise exception 'Missing movement amounts or ledger metadata';
    end if;
    v_xrp := (v_event->>'xrpValue')::numeric;
    v_tow := (v_event->>'towAmount')::numeric;
    v_ledger := (v_event->>'ledgerIndex')::bigint;
    v_time := (v_event->>'eventAt')::timestamptz;
    if v_xrp < 0 or v_tow <= 0 or v_ledger <= 0 or
       (v_type in ('buy','sell') and v_xrp <= 0) or
       (v_type not in ('buy','sell') and v_xrp <> 0) then
      raise exception 'Invalid movement values';
    end if;
    if v_ledger < v_previous_ledger or
       (v_ledger = v_previous_ledger and v_time < v_previous_time) then
      raise exception 'Movement batch not ledger ordered';
    end if;
    v_previous_ledger := v_ledger;
    v_previous_time := v_time;
    select * into v_existing from public.tow_wallet_events
      where wallet_address = p_wallet and tx_hash = v_hash;
    if found then
      if v_existing.event_type <> v_type or
         v_existing.xrp_value <> v_xrp or
         v_existing.tow_amount <> v_tow or
         v_existing.ledger_index is distinct from v_ledger or
         v_existing.event_at is distinct from v_time then
        raise exception 'Conflicting replay of existing transaction %', v_hash;
      end if;
      v_duplicate := v_duplicate + 1;
    else
      insert into public.tow_wallet_events(
        wallet_address,tx_hash,event_type,xrp_value,tow_amount,
        counterparty,ledger_index,event_at,raw_event
      ) values (
        p_wallet,v_hash,v_type,v_xrp,v_tow,
        nullif(v_event->>'counterparty',''),v_ledger,v_time,v_event->'rawEvent'
      );
      v_count := v_count + 1;
    end if;
  end loop;
  return jsonb_build_object('ok',true,'recorded',v_count,'duplicates',v_duplicate);
end;
$$;
revoke all on function public.tow_ingest_wallet_events_atomic(text,jsonb) from public,anon,authenticated;
grant execute on function public.tow_ingest_wallet_events_atomic(text,jsonb) to service_role;
commit;
