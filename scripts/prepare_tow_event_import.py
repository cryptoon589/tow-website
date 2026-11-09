#!/usr/bin/env python3
"""Prepare a reviewed, read-only historical event staging manifest. NEVER write to DB."""
import json
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from pathlib import Path

SOURCE=Path("tow-reconciliation-evidence.json")
DEST=Path("tow-event-import-staging.json")
RIPPLE_EPOCH=datetime(2000,1,1,tzinfo=timezone.utc)

def prepare(source):
    if source.get("schema_version")!=1 or source.get("production_write_authorized") is not False:
        raise ValueError("Untrusted or write-authorized evidence")
    staging=[]
    per_wallet=[]
    for wallet in source["wallets"]:
        movements=wallet["movements"]
        missing=[m for m in movements if not m["already_stored"]]
        if len(missing)!=wallet["missing_count"]:
            raise ValueError("Missing movement count mismatch for "+wallet["wallet"])
        if not wallet["account_history_exhausted"] or wallet["unvalidated_entries"] or wallet["metadata_issues"]:
            raise ValueError("History incomplete for "+wallet["wallet"])
        hashes=[m["hash"] for m in movements]
        if len(hashes)!=len(set(hashes)):
            raise ValueError("Duplicate on-chain movement")
        for m in missing:
            delta=Decimal(m["delta_tow"])
            if not delta: raise ValueError("Zero movement")
            if not isinstance(m.get("ledger"),int): raise ValueError("Missing ledger")
            ripple_date=m.get("tx_date")
            if not isinstance(ripple_date,int): raise ValueError("Missing validated XRPL timestamp")
            timestamp=(RIPPLE_EPOCH+timedelta(seconds=ripple_date)).isoformat()
            staging.append({
                "wallet_address":wallet["wallet"],"tx_hash":m["hash"],"ledger_index":m["ledger"],
                "event_at":timestamp,"tow_delta":str(delta),
                "direction":"in" if delta>0 else "out",
                "event_type":"pending_classification",
                "xrp_cost_candidate":m.get("xrp_spent_excluding_fee"),
                "cost_basis_status":m["cost_basis_status"],
                "raw_metadata_required":True,
                "review_required":True
            })
        per_wallet.append({"wallet":wallet["wallet"],"verified_movements":len(movements),"missing_events":len(missing)})
    staging.sort(key=lambda m:(m["ledger_index"],m["tx_hash"],m["wallet_address"]))
    if len({(m["wallet_address"],m["tx_hash"]) for m in staging})!=len(staging):
        raise ValueError("Duplicate staging key")
    return {"schema_version":1,"mode":"review_only","safe_to_import":False,
            "production_write_authorized":False,
            "reason":"Event type, XRP execution provenance and original validated metadata must be certified before insertion",
            "wallets":per_wallet,"missing_events":len(staging),"events":staging}

def main():
    manifest=prepare(json.loads(SOURCE.read_text()))
    DEST.write_text(json.dumps(manifest,indent=2)+"\n")
    print(json.dumps({"staging_events":manifest["missing_events"],
                      "safe_to_import":False,"production_write_authorized":False}),flush=True)

if __name__=="__main__": main()
