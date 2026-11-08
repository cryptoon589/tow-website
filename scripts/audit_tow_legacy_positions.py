#!/usr/bin/env python3
"""Audit preserved legacy positions against historical ledger evidence; no writes."""
import json
from decimal import Decimal
from pathlib import Path

EVIDENCE=Path("tow-reconciliation-evidence.json")
POSITIONS=Path("tow-legacy-positions-snapshot.json")
OUTPUT=Path("tow-legacy-position-reconciliation.json")

def audit(evidence,positions):
    wallets={w["wallet"]:w for w in evidence["wallets"]}
    rows=[]
    for p in positions:
        wallet=wallets.get(p["wallet_address"])
        movements={m["hash"]:m for m in wallet["movements"]} if wallet else {}
        base=p["buy_tx_hash"].split("_")[0]
        purchase=movements.get(base)
        sale=movements.get(p["sell_tx_hash"]) if p.get("sell_tx_hash") else None
        problems=[]
        if not purchase: problems.append("purchase_not_in_verified_history")
        elif Decimal(purchase["delta_tow"])<=0: problems.append("source_is_not_an_acquisition")
        if purchase and Decimal(p["tow_amount"])>Decimal(purchase["delta_tow"]):
            problems.append("legacy_allocation_exceeds_single_source_purchase")
        if p.get("sell_tx_hash") and not sale: problems.append("sale_not_in_verified_history")
        if sale and purchase and sale["ledger"]<purchase["ledger"]:
            problems.append("sale_precedes_purchase")
        if not wallet or wallet["missing_count"]: problems.append("historical_events_not_ingested")
        if purchase and purchase.get("xrp_spent_excluding_fee") is None:
            problems.append("purchase_cost_not_certified")
        rows.append({"legacy_position_id":p["id"],"wallet_address":p["wallet_address"],
                     "legacy_status":p["status"],"original_purchase_hash":base,
                     "source_ledger":purchase["ledger"] if purchase else None,
                     "sale_ledger":sale["ledger"] if sale else None,
                     "issues":problems,"safe_to_auto_map":False})
    return {"schema_version":1,"read_only":True,"safe_to_apply":False,
            "positions":rows,"positions_requiring_manual_reconciliation":sum(bool(p["issues"]) for p in rows)}

def main():
    result=audit(json.loads(EVIDENCE.read_text()),json.loads(POSITIONS.read_text()))
    OUTPUT.write_text(json.dumps(result,indent=2)+"\n")
    print(json.dumps({"legacy_positions":len(result["positions"]),
                      "manual_reconciliation_required":result["positions_requiring_manual_reconciliation"],
                      "production_write_authorized":False}),flush=True)

if __name__=="__main__":
    main()
