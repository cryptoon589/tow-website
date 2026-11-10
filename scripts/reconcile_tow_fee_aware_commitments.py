#!/usr/bin/env python3
"""Offline fee-aware comparison of stored buy events and validated XRPL evidence.

Inputs are local exported JSON; no database access or write permissions.
"""
import argparse
import json
from decimal import Decimal
from pathlib import Path
from reconcile_tow_aggregate_commitments import number, reconcile

def compare(evidence, positions, events, wallet):
    report = reconcile(evidence, positions, wallet)
    buys = [e for e in events if e.get("wallet_address") == wallet and e.get("event_type") == "buy"]
    if len(buys) != report["purchase_count"]:
        raise ValueError("Stored buy count differs from acquisition candidates")
    by_hash = {e["tx_hash"].upper(): e for e in buys}
    if len(by_hash) != len(buys):
        raise ValueError("Duplicate stored buy hash")
    movements = next(w["movements"] for w in evidence["wallets"] if w["wallet"] == wallet)
    by_movement = {m["hash"].upper(): m for m in movements}
    gross, net, fees, tokens = (Decimal(0) for _ in range(4))
    rows = []
    for a in report["acquisitions"]:
        tx_hash = a["tx_hash"].upper()
        if tx_hash not in by_hash:
            raise ValueError("Acquisition not found in stored buys")
        event, movement = by_hash[tx_hash], by_movement[tx_hash]
        fee_raw = movement.get("network_fee_xrp")
        if fee_raw is None:
            raise ValueError("Missing network fee in validated evidence")
        fee = number(fee_raw)
        if fee < 0:
            raise ValueError("Negative network fee")
        event_xrp = number(event["xrp_value"])
        spend = number(a["xrp_spend_candidate"])
        event_tow = number(event["tow_amount"])
        acquired_tow = number(a["tow"])
        if abs(event_tow - acquired_tow) > Decimal("0.000001"):
            raise ValueError("Stored and XRPL TOW quantities differ")
        if abs(event_xrp - (spend + fee)) > Decimal("0.00000001"):
            raise ValueError("Stored buy XRP is not explained by spend plus fee")
        gross += event_xrp
        net += spend
        fees += fee
        tokens += event_tow
        rows.append({"tx_hash":tx_hash,"stored_xrp_including_fee":str(event_xrp),
                     "xrp_spend_excluding_fee":str(spend),"network_fee_xrp":str(fee)})
    report.update({"stored_buy_count":len(buys),"stored_buy_tow":str(tokens),
                   "stored_buy_xrp_including_fees":str(gross),
                   "network_fees_xrp":str(fees),
                   "acquisition_xrp_excluding_fees":str(net),
                   "fee_reconciliation_difference":str(gross-net-fees),
                   "unresolved_commitment_xrp_difference":str(net-number(report["recorded_commitment_xrp"])),
                   "stored_buy_fee_reconciliation_verified":True,
                   "individual_position_allocation_certified":False,
                   "cost_certified":False,"safe_to_apply":False,"fee_rows":rows})
    return report

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--evidence",type=Path,required=True)
    p.add_argument("--positions",type=Path,required=True)
    p.add_argument("--stored-events",type=Path,required=True)
    p.add_argument("--wallet",required=True)
    p.add_argument("--output",type=Path,default=Path("tow-fee-aware-commitment-review.json"))
    args=p.parse_args()
    report=compare(json.loads(args.evidence.read_text()),json.loads(args.positions.read_text()),
                   json.loads(args.stored_events.read_text()),args.wallet)
    args.output.write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps({"stored_buy_count":report["stored_buy_count"],
        "fee_reconciliation_difference":report["fee_reconciliation_difference"],
        "unresolved_commitment_xrp_difference":report["unresolved_commitment_xrp_difference"],
        "safe_to_apply":False}))
if __name__=="__main__":
    main()
