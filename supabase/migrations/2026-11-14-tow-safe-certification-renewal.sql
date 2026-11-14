-- Guarded certification renewal; validate before deploying to Supabase.
CREATE OR REPLACE FUNCTION public.tow_certify_new_wallet_atomic(p_wallet text, p_first_wallet_ledger bigint, p_proof_ledger bigint, p_checked_through_ledger bigint, p_expected_event_count integer, p_expected_proof_started_at timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_player public.tow_players%rowtype;
  v_count integer;
begin
  -- Serialize against wallet event ingestion and player updates where possible.
  perform pg_advisory_xact_lock(hashtextextended(p_wallet, 0));
  select * into v_player from public.tow_players where wallet_address = p_wallet for update;
  if not found or not coalesce(v_player.verified,false) or v_player.proof_started_at is null or
     p_expected_proof_started_at is distinct from v_player.proof_started_at then
    raise exception 'PLAYER_PROOF_NOT_VERIFIED';
  end if;
  -- Only independently certified, initialized new-wallet accounting may renew.
  if exists (select 1 from public.tow_accounting_initialized where wallet_address = p_wallet) then
    if not exists (
      select 1 from public.tow_accounting_coverage c
      where c.wallet_address = p_wallet and c.verified_complete = true
        and c.balance_verified = true
        and c.first_wallet_ledger = p_first_wallet_ledger
        and c.proof_ledger = p_proof_ledger
        and c.checked_through_ledger <= p_checked_through_ledger
        and c.notes = 'Independent XRPL verification; new-wallet pilot'
    ) or exists (
      select 1 from public.tow_buy_positions b
      where b.wallet_address = p_wallet and not exists (
        select 1 from public.tow_accounting_slices s
        where s.wallet_address = p_wallet and s.position_id = b.id
      )
    ) then
      raise exception 'CERTIFICATION_RENEWAL_REQUIRES_REVIEW';
    end if;
  elsif exists (select 1 from public.tow_buy_positions where wallet_address = p_wallet) or
        exists (select 1 from public.tow_accounting_lots where wallet_address = p_wallet) then
    raise exception 'EXISTING_ACCOUNTING_OR_LEGACY_POSITIONS';
  end if;
  if p_first_wallet_ledger is null or p_proof_ledger is null or
     p_checked_through_ledger is null or
     p_first_wallet_ledger < 1 or p_first_wallet_ledger > p_proof_ledger or
     p_proof_ledger > p_checked_through_ledger then
    raise exception 'INVALID_CERTIFICATION_LEDGER_RANGE';
  end if;
  select count(*) into v_count from public.tow_wallet_events where wallet_address = p_wallet;
  if p_expected_event_count is null or p_expected_event_count <> v_count or
     exists (select 1 from public.tow_wallet_events
       where wallet_address = p_wallet and
       (ledger_index is null or ledger_index > p_checked_through_ledger)) then
    raise exception 'EVENT_HISTORY_CHANGED_DURING_CERTIFICATION';
  end if;
  insert into public.tow_accounting_coverage(
    wallet_address,verified_complete,checked_at,first_wallet_ledger,
    proof_ledger,checked_through_ledger,balance_verified,notes
  ) values (
    p_wallet,true,now(),p_first_wallet_ledger,p_proof_ledger,
    p_checked_through_ledger,true,'Independent XRPL verification; new-wallet pilot'
  )
  on conflict(wallet_address) do update set
    verified_complete = excluded.verified_complete,
    checked_at = excluded.checked_at,
    first_wallet_ledger = excluded.first_wallet_ledger,
    proof_ledger = excluded.proof_ledger,
    checked_through_ledger = excluded.checked_through_ledger,
    balance_verified = excluded.balance_verified,
    notes = excluded.notes;
  return jsonb_build_object('certified',true);
end;
$function$;
