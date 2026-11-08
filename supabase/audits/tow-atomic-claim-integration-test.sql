-- Disposable PostgreSQL only: claim + archive + reward must commit atomically.
begin;
do $test$
declare
 w text := 'r'||repeat('D',25);
 pid uuid;
 cid uuid;
 result jsonb;
 reward numeric;
begin
 insert into public.tow_players(wallet_address,verified,proof_started_at)
 values(w,true,now()-interval '40 days');
 insert into public.tow_buy_positions(wallet_address,buy_tx_hash,buy_value_xrp,
 tow_amount,max_reward_tow,status,created_at)
 values(w,repeat('D',64),50,1000,200,'alive',now()-interval '35 days')
 returning id into pid;
 insert into public.tow_weekly_scores(wallet_address,runs,updated_at)
 values(w,2,now());
 insert into public.raid_posts(wallet,created_at) values(w,now()),(w,now());
 insert into public.tow_claim_requests(wallet_address,telegram_username,
 claim_code,position_id,eligible_position_ids,status,expires_at)
 values(w,'tiredbuddy','TOW-TEST-CLAIM',pid,array[pid],'pending',now()+interval '30 minutes')
 returning id into cid;
 result:=public.tow_execute_claim_atomic('TOW-TEST-CLAIM','@tiredbuddy');
 if result->>'ok'<>'true' then raise exception 'Claim did not execute: %',result; end if;
 select total_unlocked_tow into reward from public.tow_survivor_archives
 where claim_request_id=cid;
 -- 35d: 2.5% survival + 1% raids + 0.2% games +
 -- 1% recent presence + 0.25% loyalty = 4.95%.
 if reward<>49.5 then raise exception 'Activity reward mismatch: %',reward; end if;
 if (select unlocked_reward_tow from public.tow_buy_positions where id=pid)<>reward
 then raise exception 'Position reward differs from archived reward'; end if;
 if (select status from public.tow_buy_positions where id=pid)<>'claimed'
 or (select status from public.tow_claim_requests where id=cid)<>'executed' then
 raise exception 'Claim state not atomic'; end if;
 begin
   perform public.tow_execute_claim_atomic('TOW-TEST-CLAIM','tiredbuddy');
   raise exception 'Double claim unexpectedly succeeded';
 exception when others then
   if sqlerrm not like '%already executed%' then raise; end if;
 end;
 if (select count(*) from public.tow_survivor_archives where claim_request_id=cid)<>1
 then raise exception 'Duplicate archive created'; end if;
 raise notice 'PASS: claim, activity-aware 4.95%% reward, archive, replay rejection';
end;
$test$;
rollback;
