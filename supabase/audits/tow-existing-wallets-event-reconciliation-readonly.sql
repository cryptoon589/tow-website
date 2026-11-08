-- READ ONLY: inspect the exact wallet events behind existing commitment UUIDs.
-- No secrets, raw transaction payloads, or full wallet addresses are returned.
-- No changes to production data.
with target_wallets as (
 select distinct wallet_address from public.tow_buy_positions
), ordered_events as (
 select e.wallet_address,e.tx_hash,e.event_type,e.xrp_value,e.tow_amount,
        e.ledger_index,e.event_at,
        p.proof_started_at,
        sum(case when e.event_type='buy' then coalesce(e.tow_amount,0)
                 when e.event_type in ('sell','transfer_out') then -coalesce(e.tow_amount,0)
                 else 0 end)
        over(partition by e.wallet_address
             order by e.ledger_index,e.event_at,e.tx_hash
             rows between unbounded preceding and current row) as running_known_tow,
        count(*) over(partition by e.wallet_address,e.ledger_index) as same_ledger_events
 from public.tow_wallet_events e
 join target_wallets w on w.wallet_address=e.wallet_address
 left join public.tow_players p on p.wallet_address=e.wallet_address
)
select left(wallet_address,6)||'...'||right(wallet_address,4) as wallet,
       left(tx_hash,12) as tx_prefix,
       ledger_index,event_at,
       case when event_at<proof_started_at then 'PRE_PROOF' else 'POST_PROOF' end as phase,
       event_type,xrp_value,tow_amount,running_known_tow,
       same_ledger_events
from ordered_events
order by wallet,ledger_index,event_at,tx_prefix;

-- Second result: source totals and data quality by wallet.
select left(e.wallet_address,6)||'...'||right(e.wallet_address,4) as wallet,
       count(*) as events,
       count(*) filter(where e.event_type='buy') as buys,
       count(*) filter(where e.event_type='sell') as sells,
       count(*) filter(where e.event_type not in ('buy','sell','transfer_out')) as other_events,
       coalesce(sum(e.xrp_value) filter(where e.event_type='buy'),0) as gross_buy_xrp,
       coalesce(sum(e.tow_amount) filter(where e.event_type='buy'),0) as purchased_tow,
       coalesce(sum(e.tow_amount) filter(where e.event_type in ('sell','transfer_out')),0) as outgoing_tow,
       count(*) filter(where e.ledger_index is null or e.event_at is null) as missing_order,
       min(e.ledger_index) as earliest_ledger,
       max(e.ledger_index) as latest_ledger
from public.tow_wallet_events e
where exists(select 1 from public.tow_buy_positions p where p.wallet_address=e.wallet_address)
group by e.wallet_address
order by wallet;
