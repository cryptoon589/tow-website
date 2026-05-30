-- Migration: Proof of Tiredness claim flow compatibility
-- Safe upgrade for already-deployed Supabase databases.

-- Expand allowed status values.
alter table tow_buy_positions
drop constraint if exists tow_buy_positions_status_check;

alter table tow_buy_positions
add constraint tow_buy_positions_status_check
check (status in ('alive', 'claimed', 'disqualified', 'paid'));

-- Add missing columns required by claim flow.
alter table tow_buy_positions
add column if not exists reward_status text;

alter table tow_buy_positions
add column if not exists claimed_at timestamptz;

-- Ensure unlocked_reward_tow exists.
alter table tow_buy_positions
add column if not exists unlocked_reward_tow numeric not null default 0;

-- Helpful indexes.
create index if not exists tow_buy_positions_claimed_idx
on tow_buy_positions(claimed_at desc);

create index if not exists tow_buy_positions_reward_status_idx
on tow_buy_positions(reward_status);

-- Notes:
-- claimed = user ended streak and requested reward unlock.
-- paid = reward distribution completed manually or automatically later.
-- reward_status intentionally remains flexible for future payout pipeline.
