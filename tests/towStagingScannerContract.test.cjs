const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const sync=fs.readFileSync(path.join(__dirname,"../app/api/tired-sync/route.ts"),"utf8");
const scan=fs.readFileSync(path.join(__dirname,"../app/api/tired-scan-wallet/route.ts"),"utf8");

test("disabled FIFO stages events successfully instead of blocking scanner with 409",()=>{
  assert.match(sync,/accountingStatus: stagedOnly \? "staged_not_reconciled" : "reconciled"/);
  assert.match(sync,/commitmentsUpdated: !stagedOnly/);
  assert.match(sync,/positionsCreated: stagedOnly \? 0/);
  assert.doesNotMatch(sync,/code: "TOW_ACCOUNTING_MIGRATION_REQUIRED"/);
  assert.match(sync,/rpcName = hasCommitmentMovements && fifoEnabled/);
});

test("scanner checkpoints only after successful atomic ingestion of every event",()=>{
  assert.match(scan,/if \(!response\.ok\)/);
  assert.match(scan,/syncResult\?\.ok !== true/);
  assert.match(scan,/syncResult\.results\.length !== events\.length/);
  assert.match(scan,/last_scanned_ledger: highestLedgerSeen/);
});
