-- Disposable PostgreSQL-only schema compatible with the columns used by
-- staged accounting migrations. Not a production schema migration.
create extension if not exists pgcrypto;
create table public.tow_players(
 id uuid primary key default gen_random_uuid(),
 wallet_address text not null unique,
 verified boolean not null default false,
 proof_started_at timestamptz,
 last_scanned_ledger bigint
);
create table public.tow_wallet_events(
 id uuid primary key default gen_random_uuid(),
 wallet_address text not null,
 tx_hash text not null unique,
 event_type text not null,
 xrp_value numeric not null default 0,
 tow_amount numeric not null default 0,
 counterparty text,
 ledger_index bigint,
 event_at timestamptz not null,
 raw_event jsonb
);
create table public.tow_buy_positions(
 id uuid primary key default gen_random_uuid(),
 wallet_address text not null,
 buy_tx_hash text not null unique,
 buy_value_xrp numeric not null,
 tow_amount numeric not null,
 max_reward_tow numeric not null,
 unlocked_reward_tow numeric not null default 0,
 remaining_tow numeric,
 status text not null default 'alive'
  check(status in ('alive','disqualified','paid','claimed')),
 reward_status text,
 claimed_at timestamptz,
 disqualified_at timestamptz,
 sell_tx_hash text,
 reward_sent_at timestamptz,
 reward_tx_hash text,
 created_at timestamptz not null default now()
);
create table public.tow_claim_requests(
 id uuid primary key default gen_random_uuid(),
 wallet_address text not null,
 x_username text,
 telegram_username text,
 claim_code text not null unique,
 position_id uuid,
 eligible_position_ids uuid[] not null default '{}',
 status text not null default 'pending',
 created_at timestamptz not null default now(),
 expires_at timestamptz not null,
 processed_at timestamptz
);
create table public.tow_survivor_archives(
 id uuid primary key default gen_random_uuid(),
 wallet_address text not null,
 x_username text,
 telegram_username text,
 claim_request_id uuid,
 claim_code text,
 position_ids uuid[] not null default '{}',
 season_label text,
 survived_days integer,
 total_tow_committed numeric,
 total_unlocked_tow numeric,
 reward_status text,
 archived_at timestamptz,
 paid_at timestamptz
);
-- The real Supabase instance already has these roles.
do $roles$ begin
 if not exists(select 1 from pg_roles where rolname='anon') then create role anon; end if;
 if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated; end if;
 if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role; end if;
end $roles$;
