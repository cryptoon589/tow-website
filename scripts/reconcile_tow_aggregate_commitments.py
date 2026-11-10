#!/usr/bin/env python3
"""Read-only aggregate-commitment reconciliation using completed XRPL audit evidence.

Position records are provided as an exported JSON list, not fetched from production.
This tool does not map lots to individual commitments or certify costs.
"""
import argparse
import json
from decimal import Decimal, InvalidOperation
from pathlib import Path

def number(value):
    try:
        result = Decimal(str(value))
    except (InvalidOperation, TypeError, ValueError):
        raise ValueError("Invalid decimal value") from None
    if not result.is_finite():
        raise ValueError("Non-finite decimal value")
    return result

def reconcile(evidence, positions, wallet):
    if evidence.get("schema_version") != 1 or evidence.get("production_write_authorized") is not False:
        raise ValueError("Expected read-only versioned evidence")
    matches = [w for w in evidence.get("wallets", []) if w.get("wallet") == wallet]
    if len(matches) != 1:
        raise ValueError("Wallet missing or duplicated")
    history = matches[0]
    if history.get("account_history_exhausted") is not True or history.get("unvalidated_entries") != 0 or history.get("metadata_issues"):
        raise ValueError("History not validated and complete")
    selected = [p for p in positions if p.get("wallet_address") == wallet]
    if not selected or len({p.get("id") for p in selected}) != len(selected):
        raise ValueError("No positions or duplicate position IDs")
    seen = set()
    acquisitions = []
    for movement in history.get("movements", []):
        tx_hash = movement.get("hash")
        if tx_hash in seen:
            raise ValueError("Duplicate movement hash")
        seen.add(tx_hash)
        amount = number(movement["delta_tow"])
        cost = movement.get("xrp_spent_excluding_fee")
        if amount > 0 and movement.get("initiator") == wallet and cost is not None and number(cost) > 0:
            acquisitions.append({"tx_hash": tx_hash, "ledger": movement["ledger"],
                                 "tow": str(amount), "xrp_spend_candidate": str(number(cost)),
                                 "already_stored": movement.get("already_stored")})
    acquisitions.sort(key=lambda row: (row["ledger"], row["tx_hash"]))
    acquired = sum((number(a["tow"]) for a in acquisitions), Decimal(0))
    spent = sum((number(a["xrp_spend_candidate"]) for a in acquisitions), Decimal(0))
    committed = sum((number(p["tow_amount"]) for p in selected), Decimal(0))
    declared = sum((number(p["buy_value_xrp"]) for p in selected), Decimal(0))
    # Aggregated acquisition does not establish allocation to individual positions,
    # or whether their declared XRP amounts intentionally represent commitments.
    return {"schema_version": 1, "mode": "review_only", "production_write_authorized": False,
            "safe_to_apply": False, "safe_to_import": False, "fifo_activation_authorized": False,
            "wallet": wallet, "position_ids": [p["id"] for p in selected],
            "purchase_count": len(acquisitions), "acquisitions": acquisitions,
            "acquired_tow": str(acquired), "xrp_spend_candidates": str(spent),
            "recorded_position_tow": str(committed), "recorded_commitment_xrp": str(declared),
            "tow_difference": str(acquired - committed),
            "xrp_difference": str(spent - declared),
            "cost_certified": False, "individual_position_allocation_certified": False,
            "review_required": ["Verify original commitment declarations and whether 100 XRP was intentionally committed",
                                "Confirm 28 transaction execution costs and absence of intervening disposals",
                                "Determine lot-to-position allocation before any production mapping"]}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--evidence", type=Path, required=True)
    parser.add_argument("--positions", type=Path, required=True)
    parser.add_argument("--wallet", required=True)
    parser.add_argument("--output", type=Path, default=Path("tow-aggregate-commitment-review.json"))
    args = parser.parse_args()
    report = reconcile(json.loads(args.evidence.read_text()), json.loads(args.positions.read_text()), args.wallet)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"purchase_count": report["purchase_count"], "tow_difference": report["tow_difference"],
                      "xrp_difference": report["xrp_difference"], "safe_to_apply": False}))

if __name__ == "__main__":
    main()
