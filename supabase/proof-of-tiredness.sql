-- Proof of Tiredness schema for TOW
-- Run this in Supabase SQL editor before enabling the Too Tired To Quit dashboard.

create extension if not exists pgcrypto;

create table if not exists tow_players (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null unique,
  x_username text,
  telegram_username text,
  verified boolean not null default false,
  verification_code text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tow_wallet_events (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  tx_hash text not null unique,
  event_type text not null check (event_type in ('buy', 'sell', 'transfer_in', 'transfer_out', 'reward')),
  xrp_value numeric not null default 0,
  tow_amount numeric not null default 0,
  counterparty text,
  ledger_index bigint,
  event_at timestamptz not null,
  raw_event jsonb,
  created_at timestamptz not null default now()
);

create table if not exists tow_buy_positions (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  buy_tx_hash text not null unique,
  buy_value_xrp numeric not null,
  tow_amount numeric not null,
  max_reward_tow numeric not null,
  unlocked_reward_tow numeric not null default 0,
  status text not null default 'alive' check (status in ('alive', 'claimed', 'disqualified', 'paid')),
  reward_status text,
  claimed_at timestamptz,
  disqualified_at timestamptz,
  sell_tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tow_claim_requests (
  id uuid primary key default gen_random_uuid(),
  wallet_address text not null,
  x_username text,
  telegram_username text not null,
  claim_code text not null unique,
  eligible_position_ids uuid[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'expired', 'executed')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  processed_at timestamptz
);

create index if not exists tow_players_wallet_idx on tow_players(wallet_address);
create index if not exists tow_wallet_events_wallet_idx on tow_wallet_events(wallet_address);
create index if not exists tow_wallet_events_type_idx on tow_wallet_events(event_type);
create index if not exists tow_wallet_events_at_idx on tow_wallet_events(event_at desc);
create index if not exists tow_buy_positions_wallet_idx on tow_buy_positions(wallet_address);
create index if not exists tow_buy_positions_status_idx on tow_buy_positions(status);
create index if not exists tow_claim_requests_wallet_idx on tow_claim_requests(wallet_address);
create index if not exists tow_claim_requests_code_idx on tow_claim_requests(claim_code);
create index if not exists tow_claim_requests_status_idx on tow_claim_requests(status);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_tow_players_updated_at on tow_players;
create trigger update_tow_players_updated_at
before update on tow_players
for each row execute function update_updated_at_column();

drop trigger if exists update_tow_buy_positions_updated_at on tow_buy_positions;
create trigger update_tow_buy_positions_updated_at
before update on tow_buy_positions
for each row execute function update_updated_at_column();

-- Rule notes:
-- 1. Minimum qualifying buy should be checked by the sync/admin route: buy_value_xrp >= 50.
-- 2. max_reward_tow represents the maximum possible unlocked TOW reward.
-- 3. Any sell event should mark alive commitments for that wallet as disqualified.
-- 4. Rewards are displayed in TOW amount, not XRP value.
-- 5. Claiming closes a commitment streak and moves status to 'claimed'.
-- 6. Paid commitments can later be finalized with status 'paid'.
-- 7. Claim requests are authorization tickets for Telegram/TiredBuddy confirmation.
