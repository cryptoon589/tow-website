-- TOW per-wallet event identity migration.
-- Intended for coordinated deployment with tired-sync using
-- onConflict: "wallet_address,tx_hash".
-- Non-destructive: existing event IDs, wallet history and timestamps remain.
-- The transaction rolls back if duplicate wallet/hash pairs exist.
begin;
do $$
begin
  if exists (
    select 1 from (
      select wallet_address, tx_hash
      from public.tow_wallet_events
      group by wallet_address, tx_hash
      having count(*) > 1
    ) duplicates
  ) then
    raise exception 'Duplicate wallet/tx hashes require reconciliation before changing event uniqueness';
  end if;
end $$;

alter table public.tow_wallet_events
  add constraint tow_wallet_events_wallet_tx_hash_key
  unique (wallet_address, tx_hash);

alter table public.tow_wallet_events
  drop constraint tow_wallet_events_tx_hash_key;
commit;

-- This does not enable the new commitment lifecycle or rewrite old events.
