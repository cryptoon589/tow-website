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

-- Normalize existing survivor identities.
update tow_players
set x_username = lower(trim(x_username))
where x_username is not null;

update tow_players
set telegram_username = lower(trim(telegram_username))
where telegram_username is not null;

-- Helpful indexes.
create index if not exists tow_buy_positions_claimed_idx
on tow_buy_positions(claimed_at desc);

create index if not exists tow_buy_positions_reward_status_idx
on tow_buy_positions(reward_status);

-- Anti-farming identity constraints.
-- One X account = one survivor identity.
create unique index if not exists tow_players_x_username_unique_idx
on tow_players(lower(x_username))
where x_username is not null;

-- One Telegram account = one survivor identity.
create unique index if not exists tow_players_telegram_username_unique_idx
on tow_players(lower(telegram_username))
where telegram_username is not null;

-- Notes:
-- claimed = user ended streak and requested reward unlock.
-- paid = reward distribution completed manually or automatically later.
-- reward_status intentionally remains flexible for future payout pipeline.
-- Verified survivor identities should remain socially unique.
-- Identity usernames are normalized to prevent casing/spacing exploits.
