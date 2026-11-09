#!/usr/bin/env python3
"""Offline, read-only triage of a previously downloaded XRPL inflow review artifact.

Usage: python3 scripts/triage_tow_inflow_provenance.py path/to/tow-inflow-provenance-review.json
No RPC, secrets, database access, or production writes.
"""
import argparse
import json
from collections import defaultdict
from decimal import Decimal
from pathlib import Path

DUST_CUTOFF_TOW = Decimal("10")


def triage(source):
    if source.get("schema_version") != 1 or source.get("mode") != "review_only":
        raise ValueError("Expected a versioned review-only inflow report")
    if source.get("production_write_authorized") is not False or source.get("safe_to_import") is not False:
        raise ValueError("Refusing report without explicit production safety flags")
    groups = defaultdict(lambda: {"count": 0, "tow": Decimal(0), "transactions": []})
    for event in source["events"]:
        if event.get("purchase_certified") is not False or event.get("cost_certified") is not False:
            raise ValueError("Input unexpectedly contains a certified transaction")
        amount = Decimal(str(event["tow_received"]))
        if amount <= 0:
            raise ValueError("Expected positive TOW receipt")
        category = event["classification"]
        if category == "external_token_receipt":
            group = "externally_initiated_receipt"
            next_action = "Review source wallet and corresponding outgoing movement; do not invent recipient cost basis"
        elif category == "self_initiated_no_xrp_spend_evidence":
            group = "self_initiated_small_receipt" if amount < DUST_CUTOFF_TOW else "self_initiated_material_receipt"
            next_action = "Inspect raw transaction paths and delivered_amount, AMM/offer metadata, and source account"
        elif category == "self_initiated_xrp_spend_candidate":
            group = "xrp_spend_candidate"
            next_action = "Verify raw executed XRP and token amounts; distinguish AMM, offers, and transfers"
        else:
            group = "unclassified"
            next_action = "Inspect raw validated transaction metadata before classification"
        key = (event["wallet"], group)
        record = groups[key]
        record["count"] += 1
        record["tow"] += amount
        record["transactions"].append({
            "hash": event["tx_hash"], "ledger": event["ledger"],
            "tow_received": str(amount), "tx_type": event.get("tx_type"),
            "next_action": next_action,
            "purchase_certified": False, "cost_certified": False, "safe_to_import": False
        })
    rows = []
    for (wallet, group), info in sorted(groups.items()):
        rows.append({"wallet": wallet, "group": group, "count": info["count"],
                     "tow_received": str(info["tow"]),
                     "transactions": sorted(info["transactions"], key=lambda x: (x["ledger"], x["hash"]))})
    if sum(row["count"] for row in rows) != source["missing_inflow_count"]:
        raise ValueError("Transaction count mismatch")
    return {"schema_version": 1, "mode": "offline_review_only", "production_write_authorized": False,
            "safe_to_import": False, "cost_certification_complete": False,
            "source_missing_inflows": source["missing_inflow_count"],
            "dust_cutoff_tow_exclusive": str(DUST_CUTOFF_TOW), "groups": rows}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, default=Path("tow-inflow-triage.json"))
    args = parser.parse_args()
    result = triage(json.loads(args.input.read_text()))
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    for row in result["groups"]:
        print(f"{row['wallet']} {row['group']}: {row['count']} tx, {row['tow_received']} TOW")
    print("No purchases or costs certified. No production changes.")


if __name__ == "__main__":
    main()
