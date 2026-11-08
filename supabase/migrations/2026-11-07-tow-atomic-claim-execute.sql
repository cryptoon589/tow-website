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
  v_recent_raid_posts integer;
  v_recent_game_runs integer;
  v_raid_bonus numeric;
  v_game_bonus numeric;
  v_recent_bonus numeric;
  v_loyalty_bonus numeric;
  v_activity_bonus numeric;
  v_survival_bonus numeric;
  v_total_percent numeric;
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
  -- Match lib/towProof.ts recent activity and 20% reward cap.
  select count(*)::integer into v_recent_raid_posts
  from public.raid_posts
  where wallet=v_request.wallet_address
    and created_at >= v_now - interval '30 days';
  select coalesce(sum(greatest(0,coalesce(runs,0))),0)::integer
    into v_recent_game_runs
  from public.tow_weekly_scores
  where wallet_address=v_request.wallet_address
    and updated_at >= v_now - interval '30 days';
  v_raid_bonus := least(3::numeric,round(v_recent_raid_posts*0.5,2));
  v_game_bonus := least(1::numeric,round(least(50,v_recent_game_runs)*0.1,2));
  v_recent_bonus := case when v_recent_raid_posts>0 or v_recent_game_runs>0
                         then 1::numeric else 0::numeric end;
  v_loyalty_bonus := least(1::numeric,floor(v_days::numeric/28)*0.25);
  v_activity_bonus := least(5::numeric,
    v_raid_bonus+v_game_bonus+v_recent_bonus+v_loyalty_bonus);
  v_survival_bonus := case when v_days>=84 then 15::numeric
                           when v_days>=56 then 7::numeric
                           else 2.5::numeric end;
  v_total_percent := least(20::numeric,v_survival_bonus+v_activity_bonus);
  v_unlocked := round(v_position.tow_amount*v_total_percent/100,6);
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
