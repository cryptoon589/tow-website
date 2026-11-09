#!/usr/bin/env python3
"""Fetch a fixed set of XRPL transactions for human provenance review only.

No account_tx pagination, secrets, database connection, or production writes.
"""
import json
import time
from pathlib import Path
from urllib.request import Request, urlopen

HASHES = {
    "external_receipt_1": "DC07D25C080068E6AB41C6C6B5F9C2353369860F8D33D4AAD6BA5544FD394F3B",
    "external_receipt_2": "B078902C6A3E8F402C2C4E3416814D76703A3690B8A4E462E53A715EA9054170",
    "external_receipt_3": "979EAC570AB7B873FF56DE6987EC6C64171BD317D0C4A91B020EE104324174C3",
    "external_receipt_4": "3C04817FEE3189DEBAC461A2DF61537249186C093D550BE7699162565BABC247",
    "legacy_shared_purchase": "E335FB2BB0A30D7E4E274A95B4510121010F57CF0F7D946B8F8D17F6B9D2861F",
    "legacy_wallet3_purchase": "85BE409C3D76E62FBB6238895775D3D57692F0D4CA2DFC52D32C4B291A066055",
}
ENDPOINTS = ("https://xrplcluster.com/", "https://s1.ripple.com:51234/")


def fetch_transaction(tx_hash):
    errors = []
    for endpoint in ENDPOINTS:
        try:
            payload = json.dumps({"method": "tx", "params": [{"transaction": tx_hash, "binary": False}]}).encode()
            req = Request(endpoint, data=payload, headers={"Content-Type": "application/json", "User-Agent": "tow-provenance-audit/1"})
            with urlopen(req, timeout=12) as response:
                result = json.load(response)["result"]
            if result.get("validated") is True and result.get("hash", tx_hash).upper() == tx_hash:
                return result, endpoint, errors
            errors.append({"endpoint": endpoint, "error": result.get("error", "unvalidated_or_hash_mismatch")})
        except Exception as exc:
            errors.append({"endpoint": endpoint, "error": type(exc).__name__ + ": " + str(exc)[:160]})
    return None, None, errors


def summarize(tx, endpoint):
    meta = tx.get("meta", tx.get("metaData", {}))
    if not isinstance(meta, dict):
        meta = {}
    # Only observed metadata fields. Never infer paid cost from SendMax or Amount.
    return {
        "validated": tx.get("validated") is True,
        "hash": tx.get("hash"),
        "ledger_index": tx.get("ledger_index"),
        "transaction_type": tx.get("TransactionType"),
        "account": tx.get("Account"),
        "destination": tx.get("Destination"),
        "amount": tx.get("Amount"),
        "send_max": tx.get("SendMax"),
        "delivered_amount": meta.get("delivered_amount"),
        "transaction_result": meta.get("TransactionResult"),
        "has_paths": bool(tx.get("Paths")),
        "affected_node_count": len(meta.get("AffectedNodes", [])),
        "affected_nodes": meta.get("AffectedNodes", []),
        "source_endpoint": endpoint,
        "purchase_certified": False,
        "xrp_cost_certified": False,
        "safe_to_import": False,
    }


def main():
    results = {}
    for label, tx_hash in HASHES.items():
        tx, endpoint, errors = fetch_transaction(tx_hash)
        results[label] = {"requested_hash": tx_hash, "fetched": tx is not None,
                          "transaction": summarize(tx, endpoint) if tx else None, "errors": errors}
        print(label, "validated" if tx else "unavailable", flush=True)
        time.sleep(0.2)
    output = {"schema_version": 1, "mode": "read_only_targeted_tx",
              "production_write_authorized": False, "safe_to_import": False,
              "transactions": results}
    Path("tow-targeted-tx-provenance.json").write_text(json.dumps(output, indent=2) + "\n")
    # Fail the check if any transaction is unavailable; preserve artifact for diagnosis.
    if any(not row["fetched"] for row in results.values()):
        raise SystemExit("Some validated transactions unavailable; review artifact, do not certify costs")


if __name__ == "__main__":
    main()
