-- TOW claim-status compatibility patch (reviewed against production screenshots).
-- Apply only during a coordinated deployment window. This changes a CHECK
-- constraint, not existing position rows, UUIDs, rewards, or claims.
-- Existing production CHECK allows alive/disqualified/paid but excludes claimed,
-- while tired-claim-execute writes claimed.
begin;
alter table public.tow_buy_positions
  drop constraint if exists tow_buy_positions_status_check;
alter table public.tow_buy_positions
  add constraint tow_buy_positions_status_check
  check (status in ('alive', 'claimed', 'disqualified', 'paid'));
commit;

-- Verify after deployment:
-- select pg_get_constraintdef(oid) from pg_constraint
-- where conrelid = 'public.tow_buy_positions'::regclass
-- and conname = 'tow_buy_positions_status_check';
