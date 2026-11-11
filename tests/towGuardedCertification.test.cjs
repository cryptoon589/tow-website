const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const route = fs.readFileSync("app/api/tired-certify-wallet/route.ts", "utf8");
const sql = fs.readFileSync("supabase/migrations/2026-11-11-tow-new-wallet-certification.sql", "utf8");
test("certificate issuance requires explicit feature flag and wallet allowlist", () => {
  assert.match(route, /TOW_ENABLE_CERTIFICATE_ISSUANCE/);
  assert.match(route, /TOW_FIFO_PILOT_WALLETS/);
  assert.match(route, /verifyHistory\(verificationRequest\)/);
  assert.match(route, /eligibleForCertification !== true/);
});
test("certificate writes only through guarded atomic RPC", () => {
  assert.match(route, /tow_certify_new_wallet_atomic/);
  assert.doesNotMatch(route, /\.upsert\(|\.insert\(|\.update\(/);
});
test("database certification rejects historical wallets and changed events", () => {
  assert.match(sql, /tow_buy_positions/);
  assert.match(sql, /tow_accounting_initialized/);
  assert.match(sql, /tow_accounting_lots/);
  assert.match(sql, /EVENT_HISTORY_CHANGED_DURING_CERTIFICATION/);
  assert.match(sql, /pg_advisory_xact_lock/);
  assert.match(sql, /grant execute.*service_role/s);
});
