-- Proof of Tiredness: READ-ONLY live schema and integrity inspection.
-- Run in Supabase SQL editor; share only non-sensitive structural results.
-- No ALTER, UPDATE, INSERT, DELETE, or CREATE statements.
-- GitHub SQL files are not proof of the deployed schema.

-- 1. Actual columns, types, nullability and defaults.
select table_name, ordinal_position, column_name, data_type, udt_name,
       is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
  and table_name in (
    'tow_players', 'tow_wallet_events', 'tow_buy_positions',
    'tow_claim_requests', 'tow_survivor_archives'
  )
order by table_name, ordinal_position;

-- 2. Primary keys, unique constraints, check constraints and foreign keys.
select conrelid::regclass::text as table_name,
       conname as constraint_name,
       contype as constraint_type,
       pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace = 'public'::regnamespace
  and conrelid in (
    'public.tow_players'::regclass,
    'public.tow_wallet_events'::regclass,
    'public.tow_buy_positions'::regclass,
    'public.tow_claim_requests'::regclass,
    'public.tow_survivor_archives'::regclass
  )
order by table_name, constraint_name;

-- 3. Existing indexes and uniqueness (including partial unique indexes).
select tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in (
    'tow_players', 'tow_wallet_events', 'tow_buy_positions',
    'tow_claim_requests', 'tow_survivor_archives'
  )
order by tablename, indexname;

-- 4. Row counts only (does not expose wallet or personal information).
select 'tow_players' as table_name, count(*) as rows from public.tow_players
union all select 'tow_wallet_events', count(*) from public.tow_wallet_events
union all select 'tow_buy_positions', count(*) from public.tow_buy_positions
union all select 'tow_claim_requests', count(*) from public.tow_claim_requests
union all select 'tow_survivor_archives', count(*) from public.tow_survivor_archives;

-- 5. Duplicate wallet+transaction pairs (counts only).
select count(*) as duplicated_wallet_transaction_pairs
from (
  select wallet_address, tx_hash
  from public.tow_wallet_events
  group by wallet_address, tx_hash
  having count(*) > 1
) duplicates;

-- 6. Protected positions and reward totals: aggregate only.
select status, coalesce(reward_status, '(null)') as reward_status,
       count(*) as positions,
       coalesce(sum(unlocked_reward_tow), 0) as unlocked_tow
from public.tow_buy_positions
group by status, reward_status
order by status, reward_status;

-- 7. Claims and archives referring to nonexistent positions.
-- Requires position_id column: verify section 1 before running this query.
-- select count(*) as missing_claim_position_references
-- from public.tow_claim_requests r
-- where r.position_id is not null
--   and not exists (select 1 from public.tow_buy_positions p where p.id = r.position_id);

select count(*) as missing_archive_position_references
from public.tow_survivor_archives a
cross join lateral unnest(a.position_ids) as position_id
where not exists (
  select 1 from public.tow_buy_positions p where p.id = position_id
);
