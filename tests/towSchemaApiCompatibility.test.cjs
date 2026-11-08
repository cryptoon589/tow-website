const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const sync = fs.readFileSync(path.join(root, "app/api/tired-sync/route.ts"), "utf8");
const migration = fs.readFileSync(path.join(root, "supabase/migrations/2026-11-07-tow-wallet-event-per-wallet-uniqueness.sql"), "utf8");
const claimMigration = fs.readFileSync(path.join(root, "supabase/migrations/2026-11-07-tow-claimed-status-compatibility.sql"), "utf8");

test("wallet event conflict key matches the staged composite uniqueness migration", () => {
  assert.match(sync, /onConflict:\s*["']wallet_address,tx_hash["']/);
  assert.match(migration, /unique\s*\(wallet_address,\s*tx_hash\)/i);
  assert.match(migration, /drop constraint tow_wallet_events_tx_hash_key/i);
});
test("wallet event upserts cannot silently overwrite immutable history", () => {
  assert.match(sync, /ignoreDuplicates:\s*true/);
});
test("claim status compatibility explicitly includes claimed", () => {
  assert.match(claimMigration, /status in \('alive', 'claimed', 'disqualified', 'paid'\)/);
});
test("legacy net XRP accounting remains blocked before migration", () => {
  assert.match(sync, /TOW_ACCOUNTING_MIGRATION_REQUIRED/);
  assert.match(sync, /status:\s*409/);
});
