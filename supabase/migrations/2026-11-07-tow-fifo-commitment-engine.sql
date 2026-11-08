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
create index if not exists tow_accounting_slices_wallet_idx
  on public.tow_accounting_slices(wallet_address,position_id);
alter table public.tow_accounting_lots enable row level security;
alter table public.tow_accounting_slices enable row level security;
alter table public.tow_accounting_processed enable row level security;

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
  v_has_transfer boolean;
begin
  select * into v_player from public.tow_players
  where wallet_address = p_wallet for update;
  if not found then raise exception 'Unregistered wallet'; end if;
  if not coalesce(v_player.verified,false) or v_player.proof_started_at is null then
    raise exception 'Verified proof start required before accounting';
  end if;
  -- A legacy wallet must be mapped to its existing UUIDs before this engine
  -- may touch it. Never create replacement commitments over live positions.
  select count(*) into v_existing from public.tow_buy_positions
  where wallet_address = p_wallet;
  if v_existing > 0 and not exists(
    select 1 from public.tow_accounting_slices where wallet_address = p_wallet
  ) then
    raise exception 'LEGACY_POSITION_RECONCILIATION_REQUIRED';
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
  for v_event in
    select * from public.tow_wallet_events
    where wallet_address = p_wallet
    order by ledger_index,event_at,tx_hash
  loop
    if exists(select 1 from public.tow_accounting_processed
              where wallet_address = p_wallet and tx_hash = v_event.tx_hash) then
      continue;
    end if;
    if v_event.event_type = 'buy' then
      if v_event.xrp_value <= 0 or v_event.tow_amount <= 0 then
        raise exception 'Invalid buy %',v_event.tx_hash;
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
      -- Before verification, inventory is a baseline, not a streak.
      -- After verification, consume oldest committed purchase slices first.
      if v_event.event_at >= v_player.proof_started_at then
        for v_slice in
          select s.position_id,s.source_tx_hash,s.remaining_tow,
                 p.status,p.created_at,l.ledger_index
          from public.tow_accounting_slices s
          join public.tow_buy_positions p on p.id = s.position_id
          join public.tow_accounting_lots l
            on l.wallet_address = s.wallet_address
           and l.source_tx_hash = s.source_tx_hash
          where s.wallet_address = p_wallet and s.remaining_tow > 0
          order by l.ledger_index,l.acquired_at,s.position_id
        loop
          exit when v_remaining <= 0;
          v_take := least(v_remaining,v_slice.remaining_tow);
          if v_slice.status in ('claimed','paid') then
            raise exception 'Protected commitment consumed; manual review required';
          end if;
          update public.tow_accounting_slices
            set remaining_tow = greatest(0,remaining_tow-v_take)
          where position_id = v_slice.position_id
            and source_tx_hash = v_slice.source_tx_hash;
          if v_slice.status = 'alive' then
            update public.tow_buy_positions
            set status='disqualified',disqualified_at=v_event.event_at,
                sell_tx_hash=v_event.tx_hash
            where id=v_slice.position_id and status='alive';
            v_disqualified := v_disqualified+1;
          end if;
          v_remaining := v_remaining-v_take;
        end loop;
      end if;
      -- Consume the remaining outgoing tokens from uncommitted FIFO lots.
      for v_lot in
        select * from public.tow_accounting_lots
        where wallet_address=p_wallet and available_tow>0
        order by ledger_index,acquired_at,source_tx_hash
      loop
        exit when v_remaining <= 0;
        v_take := least(v_remaining,v_lot.available_tow);
        v_cost := v_lot.available_cost_xrp*v_take/v_lot.available_tow;
        update public.tow_accounting_lots
          set available_tow=greatest(0,available_tow-v_take),
              available_cost_xrp=greatest(0,available_cost_xrp-v_cost)
        where wallet_address=p_wallet and source_tx_hash=v_lot.source_tx_hash;
        v_remaining := v_remaining-v_take;
      end loop;
      if v_remaining > 0.00000001 then
        raise exception 'Outgoing TOW exceeds known purchase inventory';
      end if;
    else
      raise exception 'Unsupported event type %',v_event.event_type;
    end if;
    -- The opening baseline is created at verification, never retrospectively
    -- disqualified for sales that occurred before proof started.
    if v_event.event_at >= v_player.proof_started_at then
      loop
        select coalesce(sum(available_cost_xrp),0),
               coalesce(sum(available_tow),0)
          into v_pool_cost,v_pool_tow
        from public.tow_accounting_lots where wallet_address=p_wallet;
        exit when v_pool_cost < 49.99999999;
        v_needed := 50;
        v_allocated := 0;
        v_sequence := v_positions_created+1;
        insert into public.tow_buy_positions(
          wallet_address,buy_tx_hash,buy_value_xrp,tow_amount,max_reward_tow,
          status,created_at
        ) values (
          p_wallet, v_event.tx_hash||'_FIFO_'||v_sequence,
          50,0,0,'alive',greatest(v_player.proof_started_at,v_event.event_at)
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
          v_allocated := v_allocated+v_take;
          v_needed := v_needed-v_cost;
        end loop;
        if v_needed > 0.00000001 or v_allocated <= 0 then
          raise exception 'Commitment allocation failed';
        end if;
        update public.tow_buy_positions
        set tow_amount=v_allocated,max_reward_tow=round(v_allocated*0.2,6),
            remaining_tow=v_allocated
        where id=v_position;
        v_positions_created:=v_positions_created+1;
      end loop;
    end if;
    insert into public.tow_accounting_processed(wallet_address,tx_hash)
    values(p_wallet,v_event.tx_hash);
    v_processed:=v_processed+1;
  end loop;
  return jsonb_build_object('ok',true,'positionsCreated',v_positions_created,
    'disqualified',v_disqualified,'processed',v_processed);
end;
$$;
revoke all on function public.tow_reconcile_wallet_atomic(text)
  from public,anon,authenticated;
grant execute on function public.tow_reconcile_wallet_atomic(text) to service_role;
commit;
