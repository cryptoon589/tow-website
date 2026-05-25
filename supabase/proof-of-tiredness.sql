-- Proof of Tiredness schema for TOW
-- Run this in Supabase SQL editor before enabling the tired-status dashboard.

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
  status text not null default 'alive' check (status in ('alive', 'disqualified', 'paid')),
  disqualified_at timestamptz,
  sell_tx_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tow_players_wallet_idx on tow_players(wallet_address);
create index if not exists tow_wallet_events_wallet_idx on tow_wallet_events(wallet_address);
create index if not exists tow_wallet_events_type_idx on tow_wallet_events(event_type);
create index if not exists tow_wallet_events_at_idx on tow_wallet_events(event_at desc);
create index if not exists tow_buy_positions_wallet_idx on tow_buy_positions(wallet_address);
create index if not exists tow_buy_positions_status_idx on tow_buy_positions(status);

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
-- 2. max_reward_tow must equal tow_amount * 0.5.
-- 3. Any sell event should mark alive positions for that wallet as disqualified.
-- 4. Rewards are displayed in TOW amount, not XRP value.
