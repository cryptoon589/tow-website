const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const source = fs.readFileSync("app/api/tired-sync/route.ts", "utf8");

test("FIFO requires both feature switch and explicit wallet enrollment", () => {
  assert.match(source, /TOW_ENABLE_FIFO_ACCOUNTING === "true" &&\s*pilotWallets\.has\(wallet\)/);
  assert.match(source, /process\.env\.TOW_FIFO_PILOT_WALLETS \?\? ""/);
  assert.match(source, /hasCommitmentMovements && fifoEnabled/);
});

test("unenrolled wallets remain on staging RPC", () => {
  assert.match(source, /: "tow_ingest_wallet_events_atomic"/);
});
