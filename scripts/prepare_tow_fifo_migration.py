#!/usr/bin/env python3
"""Deterministic read-only FIFO reconstruction. Does not modify production data."""
import json
from decimal import Decimal
from pathlib import Path

SOURCE=Path("tow-reconciliation-evidence.json")
DEST=Path("tow-fifo-migration-dry-run.json")
ZERO=Decimal(0)

def decimal(value):
    return Decimal(str(value))

def reconstruct(wallet):
    events=sorted(wallet["movements"],key=lambda e:(e["ledger"],e["hash"]))
    lots=[]
    unknown_cost=[]
    outflow_shortfall=[]
    total_received=ZERO
    total_sent=ZERO
    for event in events:
        amount=decimal(event["delta_tow"])
        if amount>0:
            total_received+=amount
            cost=event.get("xrp_spent_excluding_fee")
            cost_value=decimal(cost) if cost is not None else None
            lots.append({"hash":event["hash"],"ledger":event["ledger"],"original_tow":str(amount),
                         "remaining_tow":amount,"original_xrp":str(cost_value) if cost_value is not None else None,
                         "remaining_xrp":cost_value,"classification":event["cost_basis_status"]})
            if cost_value is None:
                unknown_cost.append(event["hash"])
        elif amount<0:
            needed=-amount
            total_sent+=needed
            for lot in lots:
                if needed<=0: break
                available=lot["remaining_tow"]
                consumed=min(needed,available)
                if consumed<=0: continue
                if lot["remaining_xrp"] is not None:
                    # Proportionally consume original acquisition cost, not sale proceeds.
                    lot["remaining_xrp"]-=lot["remaining_xrp"]*consumed/available
                lot["remaining_tow"]-=consumed
                needed-=consumed
            if needed>decimal("0.00000001"):
                outflow_shortfall.append({"hash":event["hash"],"uncovered_tow":str(needed)})
    remaining=sum((lot["remaining_tow"] for lot in lots),ZERO)
    expected=total_received-total_sent
    active_unknown=[lot["hash"] for lot in lots if lot["remaining_tow"]>0 and lot["original_xrp"] is None]
    evidence_complete=(wallet["account_history_exhausted"] and wallet["unvalidated_entries"]==0 and
          not wallet["metadata_issues"] and not outflow_shortfall and not active_unknown and
          abs(remaining-expected)<=decimal("0.00000001") and wallet["missing_count"]==0 and
          not wallet["stored_without_detected_delta"])
    return {"wallet":wallet["wallet"],"movement_count":len(events),"missing_database_events":wallet["missing_count"],
            "received_tow":str(total_received),"sent_tow":str(total_sent),"remaining_tow":str(remaining),
            "net_ledger_movement":str(expected),"unpriced_incoming_hashes":unknown_cost,
            "unpriced_surviving_lots":active_unknown,"outflow_shortfalls":outflow_shortfall,
            "lots":[{**lot,"remaining_tow":str(lot["remaining_tow"]),
                      "remaining_xrp":str(lot["remaining_xrp"]) if lot["remaining_xrp"] is not None else None}
                     for lot in lots],
            "historical_balance_certified":False,"evidence_complete":evidence_complete,"safe_to_migrate":False}

def main():
    source=json.loads(SOURCE.read_text())
    if source.get("schema_version")!=1 or source.get("production_write_authorized") is not False:
        raise ValueError("Unexpected evidence format or unsafe authorization")
    wallets=[reconstruct(wallet) for wallet in source["wallets"]]
    result={"schema_version":1,"mode":"read_only_dry_run","safe_to_apply":False,
            "wallets":wallets,"all_wallets_ready":all(w["safe_to_migrate"] for w in wallets)}
    DEST.write_text(json.dumps(result,indent=2)+"\n")
    for w in wallets:
        print(json.dumps({"wallet":w["wallet"],"movements":w["movement_count"],
                          "missing_database_events":w["missing_database_events"],
                          "unpriced_surviving_lots":len(w["unpriced_surviving_lots"]),
                          "outflow_shortfalls":len(w["outflow_shortfalls"]),
                          "remaining_tow":w["remaining_tow"],"safe_to_migrate":w["safe_to_migrate"]}),flush=True)
    print(json.dumps({"dry_run_artifact":str(DEST),"production_write_authorized":False}),flush=True)

if __name__=="__main__":
    main()
