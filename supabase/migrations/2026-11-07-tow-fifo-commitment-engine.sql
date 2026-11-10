-- Additive per-purchase inventory for an eventual atomic wallet accounting cutover.
-- No existing position UUIDs are rewritten. This RPC refuses legacy wallets
-- until their positions have been reconciled to exact source purchase lots.
begin;
create table if not exists public.tow_accounting_lots (
  wallet_address text not null,
  source_tx_hash text not null,
  acquired_at timestamptz not null,
  ledger_index bigint not null,
  available_tow numeric not null check (available_tow >= 0),
  available_cost_xrp numeric not null check (available_cost_xrp >= 0),
  primary key(wallet_address,source_tx_hash)
);
create table if not exists public.tow_accounting_slices (
  position_id uuid not null references public.tow_buy_positions(id),
  wallet_address text not null,
  source_tx_hash text not null,
  original_tow numeric not null check(original_tow > 0),
  remaining_tow numeric not null check(remaining_tow >= 0),
  primary key(position_id,source_tx_hash),
  foreign key(wallet_address,source_tx_hash)
    references public.tow_accounting_lots(wallet_address,source_tx_hash)
);
create table if not exists public.tow_accounting_processed (
  wallet_address text not null,
  tx_hash text not null,
  primary key(wallet_address,tx_hash)
);
-- A wallet must have independent XRPL history verification before writes.
-- There is deliberately no automatic certification based on event counts.
create table if not exists public.tow_accounting_coverage (
  wallet_address text primary key,
  verified_complete boolean not null default false,
  checked_at timestamptz,
  first_wallet_ledger bigint,
  proof_ledger bigint,
  checked_through_ledger bigint,
  balance_verified boolean not null default false,
  notes text
);
alter table public.tow_accounting_coverage enable row level security;
create table if not exists public.tow_accounting_initialized (
  wallet_address text primary key,
  initialized_at timestamptz not null
);
alter table public.tow_accounting_initialized enable row level security;
create index if not exists tow_accounting_slices_wallet_idx
  on public.tow_accounting_slices(wallet_address,position_id);
alter table public.tow_accounting_lots enable row level security;
alter table public.tow_accounting_slices enable row level security;
alter table public.tow_accounting_processed enable row level security;

create or replace function public.tow_allocate_available_commitments(
  p_wallet text, p_created_at timestamptz, p_trigger_hash text
) returns integer language plpgsql security definer set search_path = public as $allocate$
declare
  v_lot public.tow_accounting_lots%rowtype;
  v_pool_cost numeric;
  v_needed numeric;
  v_cost numeric;
  v_take numeric;
  v_allocated numeric;
  v_position uuid;
  v_count integer := 0;
  v_sequence integer;
begin
  loop
    select coalesce(sum(available_cost_xrp),0) into v_pool_cost
    from public.tow_accounting_lots where wallet_address=p_wallet;
    exit when v_pool_cost < 50;
    v_needed := 50;
    v_allocated := 0;
    select count(*)+1 into v_sequence from public.tow_buy_positions
      where wallet_address=p_wallet;
    insert into public.tow_buy_positions(
      wallet_address,buy_tx_hash,buy_value_xrp,tow_amount,max_reward_tow,
      status,created_at
    ) values (
      p_wallet,p_trigger_hash||'_FIFO_'||lpad(v_sequence::text,10,'0'),
      50,0,0,'alive',p_created_at
    ) returning id into v_position;
    for v_lot in
      select * from public.tow_accounting_lots
      where wallet_address=p_wallet and available_cost_xrp>0
      order by ledger_index,acquired_at,source_tx_hash
    loop
      exit when v_needed <= 0.00000001;
      v_cost := least(v_needed,v_lot.available_cost_xrp);
      v_take := v_lot.available_tow*v_cost/v_lot.available_cost_xrp;
      insert into public.tow_accounting_slices(
        position_id,wallet_address,source_tx_hash,original_tow,remaining_tow
      ) values(v_position,p_wallet,v_lot.source_tx_hash,v_take,v_take);
      update public.tow_accounting_lots
      set available_tow=greatest(0,available_tow-v_take),
          available_cost_xrp=greatest(0,available_cost_xrp-v_cost)
      where wallet_address=p_wallet and source_tx_hash=v_lot.source_tx_hash;
      v_allocated:=v_allocated+v_take;
      v_needed:=v_needed-v_cost;
    end loop;
    if v_needed > 0.00000001 or v_allocated <= 0 then
      raise exception 'Commitment allocation failed';
    end if;
    update public.tow_buy_positions
    set tow_amount=v_allocated,max_reward_tow=round(v_allocated*0.2,6),
        remaining_tow=v_allocated
    where id=v_position;
    v_count:=v_count+1;
  end loop;
  return v_count;
end;
$allocate$;
revoke all on function public.tow_allocate_available_commitments(text,timestamptz,text)
  from public,anon,authenticated;
grant execute on function public.tow_allocate_available_commitments(text,timestamptz,text) to service_role;

create or replace function public.tow_reconcile_wallet_atomic(p_wallet text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_player public.tow_players%rowtype;
  v_event public.tow_wallet_events%rowtype;
  v_lot public.tow_accounting_lots%rowtype;
  v_slice record;
  v_existing integer;
  v_remaining numeric;
  v_take numeric;
  v_cost numeric;
  v_pool_cost numeric;
  v_pool_tow numeric;
  v_needed numeric;
  v_allocated numeric;
  v_position uuid;
  v_sequence integer;
  v_positions_created integer := 0;
  v_disqualified integer := 0;
  v_processed integer := 0;
  v_proof_started boolean := false;
  v_last_processed_ledger bigint;
  v_has_transfer boolean;
  v_proof_ledger bigint;
begin
  select * into v_player from public.tow_players
  where wallet_address = p_wallet for update;
  if not found then raise exception 'Unregistered wallet'; end if;
  if not coalesce(v_player.verified,false) or v_player.proof_started_at is null then
    raise exception 'Verified proof start required before accounting';
  end if;
  if not exists (
    select 1 from public.tow_accounting_coverage
    where wallet_address=p_wallet and verified_complete=true
      and balance_verified=true and first_wallet_ledger is not null
      and proof_ledger is not null and checked_through_ledger is not null
      and first_wallet_ledger<=proof_ledger
      and checked_through_ledger>=proof_ledger
      and checked_through_ledger>=coalesce(
        (select max(ledger_index) from public.tow_wallet_events
         where wallet_address=p_wallet),proof_ledger)
  ) then raise exception 'XRPL_HISTORY_COVERAGE_NOT_CERTIFIED'; end if;
  -- Historical event_at may be import time. Proof phase is determined
  -- exclusively from independently certified proof_ledger, not event_at.
  -- If a transaction shares the proof ledger, it is treated as pre-proof
  -- until its transaction index is independently verified.
  select proof_ledger into v_proof_ledger
  from public.tow_accounting_coverage where wallet_address=p_wallet;
  -- A legacy wallet must be mapped to its existing UUIDs before this engine
  -- may touch it. Never create replacement commitments over live positions.
  select count(*) into v_existing from public.tow_buy_positions
  where wallet_address = p_wallet;
  -- An existing position is NEVER enough to authorize a replay.
  -- A verified legacy migration must atomically install purchase slices,
  -- processed-event markers AND the initialized marker together. Until then
  -- block the wallet, even if someone staged partial slice mappings.
  select exists(select 1 from public.tow_accounting_initialized
    where wallet_address=p_wallet) into v_proof_started;
  if v_existing > 0 and not v_proof_started then
    raise exception 'LEGACY_POSITION_RECONCILIATION_REQUIRED';
  end if;
  if v_existing > 0 and not exists(
    select 1 from public.tow_accounting_slices where wallet_address=p_wallet
  ) then
    raise exception 'LEGACY_POSITION_RECONCILIATION_REQUIRED';
  end if;
  -- Proof-ledger equality is ambiguous without the proof transaction index.
  -- Do not silently treat same-ledger transactions as pre-proof.
  if exists (
    select 1 from public.tow_wallet_events
    where wallet_address=p_wallet and ledger_index=v_proof_ledger
  ) then
    raise exception 'PROOF_LEDGER_TRANSACTION_ORDER_REQUIRES_REVIEW';
  end if;
  -- Transfers/rewards cannot be assumed to be purchase-funded inventory.
  -- No partial application when provenance is ambiguous.
  select exists(
    select 1 from public.tow_wallet_events
    where wallet_address = p_wallet and event_type in ('transfer_in','reward')
  ) into v_has_transfer;
  if v_has_transfer then raise exception 'MIXED_PROVENANCE_REQUIRES_REVIEW'; end if;
  -- Require historical events to have a usable deterministic order.
  if exists(
    select 1 from public.tow_wallet_events where wallet_address = p_wallet
    and (ledger_index is null or ledger_index <= 0 or event_at is null)
  ) then raise exception 'INCOMPLETE_LEDGER_ORDER'; end if;
  -- Multiple movements can share a ledger. Require transaction ordering metadata
  -- instead of sorting them arbitrarily by hash.
  if exists(
    select 1 from public.tow_wallet_events
    where wallet_address=p_wallet
    group by ledger_index having count(*)>1
      and count(*) filter (
        where raw_event->'meta'->>'TransactionIndex' is null
      )>0
  ) then raise exception 'MISSING_TRANSACTION_INDEX'; end if;
  for v_event in
    select * from public.tow_wallet_events
    where wallet_address = p_wallet
    order by ledger_index,coalesce((raw_event->'meta'->>'TransactionIndex')::integer,0),tx_hash
  loop
    if exists(select 1 from public.tow_accounting_processed
              where wallet_address = p_wallet and tx_hash = v_event.tx_hash) then
      continue;
    end if;
    -- Before processing the first post-proof movement, freeze the surviving
    -- pre-proof purchase inventory into independent commitments.
    if not exists(select 1 from public.tow_accounting_processed
                  where wallet_address=p_wallet and tx_hash=v_event.tx_hash) then
      select max(e.ledger_index) into v_last_processed_ledger
      from public.tow_accounting_processed p
      join public.tow_wallet_events e on e.wallet_address=p.wallet_address
       and e.tx_hash=p.tx_hash where p.wallet_address=p_wallet;
      if v_last_processed_ledger is not null and v_event.ledger_index < v_last_processed_ledger then
        raise exception 'OUT_OF_ORDER_LEDGER_REPLAY';
      end if;
    end if;
    if not v_proof_started and v_event.ledger_index > v_proof_ledger then
      v_positions_created := v_positions_created +
        public.tow_allocate_available_commitments(
          p_wallet,v_player.proof_started_at,v_event.tx_hash);
      insert into public.tow_accounting_initialized(wallet_address,initialized_at)
      values(p_wallet,v_player.proof_started_at);
      v_proof_started := true;
    end if;
    if v_event.event_type = 'buy' then
      if v_event.xrp_value <= 0 or v_event.tow_amount <= 0 then
        raise exception 'Invalid buy %',v_event.tx_hash;
      end if;
      -- Stored xrp_value includes the submitting account's network fee.
      -- Only actual XRP spent acquiring TOW contributes to a 50 XRP threshold.
      -- Fail closed when fee metadata is absent or malformed.
      if v_event.raw_event->'tx'->>'Fee' is null
         or (v_event.raw_event->'tx'->>'Fee') !~ '^[0-9]+'
         or (v_event.raw_event->'tx'->>'Fee') ~ '[^0-9]' then
        raise exception 'BUY_NETWORK_FEE_NOT_VERIFIED %',v_event.tx_hash;
      end if;
      v_cost := v_event.xrp_value -
        ((v_event.raw_event->'tx'->>'Fee')::numeric / 1000000);
      if v_cost <= 0 then
        raise exception 'BUY_NET_XRP_COST_INVALID %',v_event.tx_hash;
      end if;
      insert into public.tow_accounting_lots(
        wallet_address,source_tx_hash,acquired_at,ledger_index,
        available_tow,available_cost_xrp
      ) values (
        p_wallet,v_event.tx_hash,v_event.event_at,v_event.ledger_index,
        v_event.tow_amount,v_cost
      );
    elsif v_event.event_type in ('sell','transfer_out') then
      v_remaining := v_event.tow_amount;
      if v_remaining <= 0 then raise exception 'Invalid outgoing amount'; end if;
      -- Consume exact acquired purchase tokens oldest-first, regardless of
      -- whether a token belongs to a commitment or the uncommitted remainder.
      -- For a single source purchase, allocated slices precede its remainder.
      for v_slice in
        select movement_kind,position_id,source_tx_hash,remaining_tow,
               available_cost_xrp,position_status
        from (
          select 0 as movement_kind,s.position_id,s.source_tx_hash,
                 s.remaining_tow,0::numeric as available_cost_xrp,
                 p.status as position_status,l.ledger_index,l.acquired_at,
                 p.buy_tx_hash as commitment_order
          from public.tow_accounting_slices s
          join public.tow_buy_positions p on p.id=s.position_id
          join public.tow_accounting_lots l
            on l.wallet_address=s.wallet_address
           and l.source_tx_hash=s.source_tx_hash
          where s.wallet_address=p_wallet and s.remaining_tow>0
          union all
          select 1 as movement_kind,null::uuid as position_id,
                 l.source_tx_hash,l.available_tow as remaining_tow,
                 l.available_cost_xrp,null::text as position_status,
                 l.ledger_index,l.acquired_at,
                 null::text as commitment_order
          from public.tow_accounting_lots l
          where l.wallet_address=p_wallet and l.available_tow>0
        ) inventory
        order by ledger_index,acquired_at,source_tx_hash,movement_kind,commitment_order
      loop
        exit when v_remaining <= 0.00000001;
        v_take := least(v_remaining,v_slice.remaining_tow);
        if v_slice.movement_kind = 0 then
          if v_slice.position_status in ('claimed','paid') then
            raise exception 'Protected commitment consumed; manual review required';
          end if;
          update public.tow_accounting_slices
            set remaining_tow=greatest(0,remaining_tow-v_take)
          where position_id=v_slice.position_id
            and source_tx_hash=v_slice.source_tx_hash;
          update public.tow_buy_positions
            set remaining_tow=(
              select coalesce(sum(remaining_tow),0)
              from public.tow_accounting_slices where position_id=v_slice.position_id
            )
          where id=v_slice.position_id;
          if v_slice.position_status='alive' then
            update public.tow_buy_positions
              set status='disqualified',disqualified_at=v_event.event_at,
                  sell_tx_hash=v_event.tx_hash
              where id=v_slice.position_id and status='alive';
            v_disqualified:=v_disqualified+1;
          end if;
        else
          v_cost:=v_slice.available_cost_xrp*v_take/v_slice.remaining_tow;
          update public.tow_accounting_lots
            set available_tow=greatest(0,available_tow-v_take),
                available_cost_xrp=greatest(0,available_cost_xrp-v_cost)
          where wallet_address=p_wallet and source_tx_hash=v_slice.source_tx_hash;
        end if;
        v_remaining:=v_remaining-v_take;
      end loop;
      if v_remaining > 0.00000001 then
        raise exception 'Outgoing TOW exceeds known purchase inventory';
      end if;
    else
      raise exception 'Unsupported event type %',v_event.event_type;
    end if;
    if v_event.ledger_index > v_proof_ledger then
      v_positions_created := v_positions_created +
        public.tow_allocate_available_commitments(p_wallet,greatest(v_player.proof_started_at,v_event.event_at),v_event.tx_hash);
    end if;
    insert into public.tow_accounting_processed(wallet_address,tx_hash)
    values(p_wallet,v_event.tx_hash);
    v_processed:=v_processed+1;
  end loop;
  -- An already-verified holder can have no post-proof movement yet.
  -- Their opening commitments must still begin at proof verification.
  if not v_proof_started then
    v_positions_created := v_positions_created +
      public.tow_allocate_available_commitments(
        p_wallet,v_player.proof_started_at,'OPENING_'||p_wallet);
    insert into public.tow_accounting_initialized(wallet_address,initialized_at)
      values(p_wallet,v_player.proof_started_at);
  end if;
  return jsonb_build_object('ok',true,'positionsCreated',v_positions_created,
    'disqualified',v_disqualified,'processed',v_processed);
end;
$$;
revoke all on function public.tow_reconcile_wallet_atomic(text)
  from public,anon,authenticated;
grant execute on function public.tow_reconcile_wallet_atomic(text) to service_role;
-- Ingestion and reconciliation share one PostgreSQL transaction. A failed
-- allocation rolls back all new events and position changes.
create or replace function public.tow_ingest_and_reconcile_wallet_atomic(
  p_wallet text,p_events jsonb
) returns jsonb language plpgsql security definer set search_path = public as $combined$
declare
  v_ingest jsonb;
  v_reconcile jsonb;
begin
  v_ingest := public.tow_ingest_wallet_events_atomic(p_wallet,p_events);
  v_reconcile := public.tow_reconcile_wallet_atomic(p_wallet);
  return v_reconcile || jsonb_build_object(
    'recorded',v_ingest->'recorded','duplicates',v_ingest->'duplicates');
end;
$combined$;
revoke all on function public.tow_ingest_and_reconcile_wallet_atomic(text,jsonb)
  from public,anon,authenticated;
grant execute on function public.tow_ingest_and_reconcile_wallet_atomic(text,jsonb)
  to service_role;
commit;
 then
        raise exception 'BUY_NETWORK_FEE_NOT_VERIFIED %',v_event.tx_hash;
      end if;
      v_cost := v_event.xrp_value -
        ((v_event.raw_event->'tx'->>'Fee')::numeric / 1000000);
      if v_cost <= 0 then
        raise exception 'BUY_NET_XRP_COST_INVALID %',v_event.tx_hash;
      end if;
      insert into public.tow_accounting_lots(
        wallet_address,source_tx_hash,acquired_at,ledger_index,
        available_tow,available_cost_xrp
      ) values (
        p_wallet,v_event.tx_hash,v_event.event_at,v_event.ledger_index,
        v_event.tow_amount,v_event.xrp_value
      );
    elsif v_event.event_type in ('sell','transfer_out') then
      v_remaining := v_event.tow_amount;
      if v_remaining <= 0 then raise exception 'Invalid outgoing amount'; end if;
      -- Consume exact acquired purchase tokens oldest-first, regardless of
      -- whether a token belongs to a commitment or the uncommitted remainder.
      -- For a single source purchase, allocated slices precede its remainder.
      for v_slice in
        select movement_kind,position_id,source_tx_hash,remaining_tow,
               available_cost_xrp,position_status
        from (
          select 0 as movement_kind,s.position_id,s.source_tx_hash,
                 s.remaining_tow,0::numeric as available_cost_xrp,
                 p.status as position_status,l.ledger_index,l.acquired_at,
                 p.buy_tx_hash as commitment_order
          from public.tow_accounting_slices s
          join public.tow_buy_positions p on p.id=s.position_id
          join public.tow_accounting_lots l
            on l.wallet_address=s.wallet_address
           and l.source_tx_hash=s.source_tx_hash
          where s.wallet_address=p_wallet and s.remaining_tow>0
          union all
          select 1 as movement_kind,null::uuid as position_id,
                 l.source_tx_hash,l.available_tow as remaining_tow,
                 l.available_cost_xrp,null::text as position_status,
                 l.ledger_index,l.acquired_at,
                 null::text as commitment_order
          from public.tow_accounting_lots l
          where l.wallet_address=p_wallet and l.available_tow>0
        ) inventory
        order by ledger_index,acquired_at,source_tx_hash,movement_kind,commitment_order
      loop
        exit when v_remaining <= 0.00000001;
        v_take := least(v_remaining,v_slice.remaining_tow);
        if v_slice.movement_kind = 0 then
          if v_slice.position_status in ('claimed','paid') then
            raise exception 'Protected commitment consumed; manual review required';
          end if;
          update public.tow_accounting_slices
            set remaining_tow=greatest(0,remaining_tow-v_take)
          where position_id=v_slice.position_id
            and source_tx_hash=v_slice.source_tx_hash;
          update public.tow_buy_positions
            set remaining_tow=(
              select coalesce(sum(remaining_tow),0)
              from public.tow_accounting_slices where position_id=v_slice.position_id
            )
          where id=v_slice.position_id;
          if v_slice.position_status='alive' then
            update public.tow_buy_positions
              set status='disqualified',disqualified_at=v_event.event_at,
                  sell_tx_hash=v_event.tx_hash
              where id=v_slice.position_id and status='alive';
            v_disqualified:=v_disqualified+1;
          end if;
        else
          v_cost:=v_slice.available_cost_xrp*v_take/v_slice.remaining_tow;
          update public.tow_accounting_lots
            set available_tow=greatest(0,available_tow-v_take),
                available_cost_xrp=greatest(0,available_cost_xrp-v_cost)
          where wallet_address=p_wallet and source_tx_hash=v_slice.source_tx_hash;
        end if;
        v_remaining:=v_remaining-v_take;
      end loop;
      if v_remaining > 0.00000001 then
        raise exception 'Outgoing TOW exceeds known purchase inventory';
      end if;
    else
      raise exception 'Unsupported event type %',v_event.event_type;
    end if;
    if v_event.ledger_index > v_proof_ledger then
      v_positions_created := v_positions_created +
        public.tow_allocate_available_commitments(p_wallet,greatest(v_player.proof_started_at,v_event.event_at),v_event.tx_hash);
    end if;
    insert into public.tow_accounting_processed(wallet_address,tx_hash)
    values(p_wallet,v_event.tx_hash);
    v_processed:=v_processed+1;
  end loop;
  -- An already-verified holder can have no post-proof movement yet.
  -- Their opening commitments must still begin at proof verification.
  if not v_proof_started then
    v_positions_created := v_positions_created +
      public.tow_allocate_available_commitments(
        p_wallet,v_player.proof_started_at,'OPENING_'||p_wallet);
    insert into public.tow_accounting_initialized(wallet_address,initialized_at)
      values(p_wallet,v_player.proof_started_at);
  end if;
  return jsonb_build_object('ok',true,'positionsCreated',v_positions_created,
    'disqualified',v_disqualified,'processed',v_processed);
end;
$$;
revoke all on function public.tow_reconcile_wallet_atomic(text)
  from public,anon,authenticated;
grant execute on function public.tow_reconcile_wallet_atomic(text) to service_role;
-- Ingestion and reconciliation share one PostgreSQL transaction. A failed
-- allocation rolls back all new events and position changes.
create or replace function public.tow_ingest_and_reconcile_wallet_atomic(
  p_wallet text,p_events jsonb
) returns jsonb language plpgsql security definer set search_path = public as $combined$
declare
  v_ingest jsonb;
  v_reconcile jsonb;
begin
  v_ingest := public.tow_ingest_wallet_events_atomic(p_wallet,p_events);
  v_reconcile := public.tow_reconcile_wallet_atomic(p_wallet);
  return v_reconcile || jsonb_build_object(
    'recorded',v_ingest->'recorded','duplicates',v_ingest->'duplicates');
end;
$combined$;
revoke all on function public.tow_ingest_and_reconcile_wallet_atomic(text,jsonb)
  from public,anon,authenticated;
grant execute on function public.tow_ingest_and_reconcile_wallet_atomic(text,jsonb)
  to service_role;
commit;
