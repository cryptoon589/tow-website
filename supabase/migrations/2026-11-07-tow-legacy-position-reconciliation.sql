-- Explicit, conservative reconciliation manifest for existing commitment UUIDs.
-- This migration only creates a staging table and a validator. It does NOT
-- migrate positions or certify any wallet's historical XRPL coverage.
begin;
create table if not exists public.tow_legacy_position_mappings (
  position_id uuid primary key references public.tow_buy_positions(id),
  wallet_address text not null,
  source_tx_hash text not null,
  source_tow numeric not null check(source_tow > 0),
  source_cost_xrp numeric not null check(source_cost_xrp > 0),
  reviewed_at timestamptz,
  review_note text,
  unique(position_id,source_tx_hash)
);
alter table public.tow_legacy_position_mappings enable row level security;
create index if not exists tow_legacy_position_mappings_wallet_idx
  on public.tow_legacy_position_mappings(wallet_address);

create or replace function public.tow_validate_legacy_mapping(p_wallet text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_count integer;
  v_mapped integer;
  v_missing integer;
  v_bad integer;
begin
  select count(*) into v_count from public.tow_buy_positions
    where wallet_address=p_wallet;
  select count(*) into v_mapped from public.tow_legacy_position_mappings
    where wallet_address=p_wallet;
  select count(*) into v_bad
  from public.tow_legacy_position_mappings m
  join public.tow_buy_positions p on p.id=m.position_id
  left join public.tow_wallet_events e on e.wallet_address=m.wallet_address
    and upper(e.tx_hash)=upper(m.source_tx_hash)
  where m.wallet_address=p_wallet
    and (p.wallet_address<>m.wallet_address
      or e.tx_hash is null or e.event_type<>'buy'
      or m.reviewed_at is null
      or p.status in ('claimed','paid')
      or p.claimed_at is not null
      or p.reward_sent_at is not null
      or p.reward_tx_hash is not null
      or coalesce(p.unlocked_reward_tow,0)>0
      or m.source_tow>e.tow_amount
      or m.source_cost_xrp>e.xrp_value);
  select count(*) into v_missing from public.tow_buy_positions p
    where p.wallet_address=p_wallet and not exists (
      select 1 from public.tow_legacy_position_mappings m
      where m.position_id=p.id and m.wallet_address=p_wallet
    );
  -- An exact one-row manifest is not sufficient proof of the original
  -- per-commitment slice allocation; require independent verification.
  return jsonb_build_object(
    'safeToApply',false,'positionCount',v_count,'mappedCount',v_mapped,
    'missingCount',v_missing,'invalidCount',v_bad,
    'requiresIndependentHistoryAndSliceVerification',true
  );
end;
$$;
revoke all on function public.tow_validate_legacy_mapping(text)
  from public,anon,authenticated;
grant execute on function public.tow_validate_legacy_mapping(text) to service_role;
commit;
