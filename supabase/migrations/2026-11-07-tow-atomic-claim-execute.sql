-- Atomic claim finalization. Additive RPC; no existing IDs or records are rewritten.
-- Invoke with the service-role key only; revoke public execution.
begin;
create or replace function public.tow_execute_claim_atomic(
  p_claim_code text,
  p_telegram_username text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.tow_claim_requests%rowtype;
  v_position public.tow_buy_positions%rowtype;
  v_verified boolean;
  v_days integer;
  v_unlocked numeric;
  v_season text;
  v_now timestamptz := now();
begin
  select * into v_request
  from public.tow_claim_requests
  where claim_code = upper(trim(p_claim_code))
  for update;
  if not found then raise exception 'Claim request not found'; end if;
  if v_request.status <> 'pending' then
    raise exception 'Claim request is already %', v_request.status;
  end if;
  if v_request.expires_at <= v_now then
    update public.tow_claim_requests
    set status = 'expired', processed_at = v_now where id = v_request.id;
    return jsonb_build_object('ok', false, 'code', 'EXPIRED');
  end if;
  if lower(trim(v_request.telegram_username)) <>
     lower(regexp_replace(trim(p_telegram_username), '^@+', '')) then
    raise exception 'Telegram identity mismatch';
  end if;
  select verified into v_verified from public.tow_players
  where wallet_address = v_request.wallet_address;
  if coalesce(v_verified, false) = false then
    raise exception 'Survivor identity not verified';
  end if;
  if v_request.position_id is null then
    raise exception 'Claim request missing commitment position';
  end if;
  select * into v_position from public.tow_buy_positions
  where id = v_request.position_id and wallet_address = v_request.wallet_address
  for update;
  if not found or v_position.status <> 'alive' then
    raise exception 'Commitment is no longer claimable';
  end if;
  v_days := greatest(0, floor(extract(epoch from (v_now - v_position.created_at)) / 86400)::integer);
  if v_days < 28 then raise exception 'Commitment has not reached 28 days'; end if;
  v_season := case when v_days >= 84 then 'Season 3 Survivor'
                   when v_days >= 56 then 'Season 2 Survivor'
                   else 'Season 1 Survivor' end;
  -- Match calculateUnlockedRewardTow in main when no activity inputs are supplied:
  -- survival 2.5% / 7% / 15% plus 0.25% loyalty per 28 days (max 1%).
  v_unlocked := round(v_position.tow_amount * least(20::numeric,
    (case when v_days >= 84 then 15::numeric
          when v_days >= 56 then 7::numeric
          else 2.5::numeric end) +
    least(1::numeric, floor(v_days::numeric / 28) * 0.25::numeric)) / 100, 6);
  update public.tow_buy_positions
  set status = 'claimed', claimed_at = v_now, reward_status = 'pending_manual_payout'
  where id = v_position.id and status = 'alive';
  if not found then raise exception 'Commitment status changed'; end if;
  insert into public.tow_survivor_archives(
    wallet_address, x_username, telegram_username, claim_request_id,
    claim_code, position_ids, season_label, survived_days,
    total_tow_committed, total_unlocked_tow, reward_status, archived_at
  ) values (
    v_request.wallet_address, v_request.x_username, v_request.telegram_username,
    v_request.id, v_request.claim_code, array[v_position.id], v_season, v_days,
    v_position.tow_amount, v_unlocked, 'pending_manual_payout', v_now
  );
  update public.tow_claim_requests
  set status = 'executed', processed_at = v_now where id = v_request.id;
  return jsonb_build_object(
    'ok', true, 'walletAddress', v_request.wallet_address,
    'claimedCommitments', 1, 'survivedDays', v_days,
    'rewardStatus', 'pending_manual_payout', 'seasonLabel', v_season,
    'message', 'Claim executed. Survivor streak archived and reward pending manual payout.'
  );
end;
$$;
revoke all on function public.tow_execute_claim_atomic(text,text) from public, anon, authenticated;
grant execute on function public.tow_execute_claim_atomic(text,text) to service_role;
commit;
