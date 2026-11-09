#!/usr/bin/env python3
"""Create a strictly read-only, review-required XRPL movement manifest."""
import json
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path

SOURCE = Path("tow-reconciliation-evidence.json")
DEST = Path("tow-event-import-staging.json")
RIPPLE_EPOCH = datetime(2000, 1, 1, tzinfo=timezone.utc)

def prepare(source):
    if source.get("schema_version") != 1 or source.get("production_write_authorized") is not False:
        raise ValueError("Evidence must be versioned and explicitly read-only")
    wallets = source.get("wallets")
    if not isinstance(wallets, list):
        raise ValueError("Missing wallet evidence")
    staged, summary, seen_wallets, seen_keys = [], [], set(), set()
    for wallet in wallets:
        address = wallet.get("wallet")
        if not isinstance(address, str) or not address or address in seen_wallets:
            raise ValueError("Invalid or duplicate wallet")
        seen_wallets.add(address)
        movements = wallet.get("movements")
        if not isinstance(movements, list):
            raise ValueError("Missing movement list")
        if (wallet.get("account_history_exhausted") is not True
                or wallet.get("unvalidated_entries") != 0
                or wallet.get("metadata_issues")):
            raise ValueError("Incomplete history or metadata for " + address)
        missing = [m for m in movements if m.get("already_stored") is False]
        if (any(m.get("already_stored") not in (True, False) for m in movements)
                or type(wallet.get("missing_count")) is not int
                or len(missing) != wallet["missing_count"]):
            raise ValueError("Unreconciled stored/missing movement count")
        for m in movements:
            tx_hash, ledger = m.get("hash"), m.get("ledger")
            key = (address, tx_hash)
            if not isinstance(tx_hash, str) or not tx_hash or key in seen_keys:
                raise ValueError("Missing or duplicate transaction hash")
            seen_keys.add(key)
            if type(ledger) is not int or ledger < 1:
                raise ValueError("Invalid ledger index")
            tx_date = m.get("tx_date")
            if type(tx_date) is not int or tx_date < 0:
                raise ValueError("Invalid validated XRPL timestamp")
            try:
                delta = Decimal(str(m["delta_tow"]))
            except (KeyError, InvalidOperation, TypeError, ValueError):
                raise ValueError("Invalid TOW delta") from None
            if not delta.is_finite() or delta == 0:
                raise ValueError("Zero or non-finite TOW movement")
            cost = m.get("xrp_spent_excluding_fee")
            if cost is not None:
                try:
                    parsed_cost = Decimal(str(cost))
                except (InvalidOperation, TypeError, ValueError):
                    raise ValueError("Invalid XRP cost candidate") from None
                if not parsed_cost.is_finite() or parsed_cost < 0:
                    raise ValueError("Negative or non-finite XRP cost candidate")
            if m["already_stored"]:
                continue
            staged.append({
                "wallet_address": address,
                "tx_hash": tx_hash,
                "ledger_index": ledger,
                "event_at": (RIPPLE_EPOCH + timedelta(seconds=tx_date)).isoformat(),
                "tow_delta": str(delta),
                "direction": "in" if delta > 0 else "out",
                "event_type": "pending_classification",
                "xrp_cost_candidate": str(cost) if cost is not None else None,
                "cost_basis_status": m.get("cost_basis_status", "unverified"),
                "raw_metadata_required": True,
                "review_required": True
            })
        summary.append({"wallet": address, "verified_movements": len(movements), "missing_events": len(missing)})
    staged.sort(key=lambda e: (e["ledger_index"], e["tx_hash"], e["wallet_address"]))
    return {
        "schema_version": 1, "mode": "review_only", "safe_to_import": False,
        "production_write_authorized": False,
        "reason": "Classify event type and certify validated XRPL execution metadata before any import",
        "wallets": summary, "missing_events": len(staged), "events": staged
    }

def main():
    manifest = prepare(json.loads(SOURCE.read_text()))
    DEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps({"staging_events": manifest["missing_events"], "safe_to_import": False, "production_write_authorized": False}))

if __name__ == "__main__":
    main()
