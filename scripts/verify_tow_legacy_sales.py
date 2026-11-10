#!/usr/bin/env python3
"""Read-only validated metadata review of two Wallet 3 legacy sale transactions."""
import json
from pathlib import Path
from verify_tow_targeted_txs import fetch_transaction, summarize

SALES = {
    "linked_earlier_sale": "57FDC84E6EA1D5D469893586DC943B79CE23252F78CE36E7E73AECF225E99E1A",
    "later_matching_sale": "6BC1B3A679635090D7FB42626052AD5F01B44697CBBBAD757D7D278732EC7BAC",
}
def main():
    out = {"schema_version":1,"mode":"read_only","production_write_authorized":False,
           "safe_to_apply":False,"transactions":{}}
    for label, tx_hash in SALES.items():
        tx, endpoint, errors = fetch_transaction(tx_hash)
        out["transactions"][label] = {"requested_hash":tx_hash,
            "status":"validated" if tx else "unavailable",
            "transaction":summarize(tx, endpoint) if tx else None,"errors":errors}
        print(label, out["transactions"][label]["status"], flush=True)
    Path("tow-legacy-sale-verification.json").write_text(json.dumps(out,indent=2)+"\n")
    if any(v["status"]!="validated" for v in out["transactions"].values()):
        raise SystemExit("Sale verification incomplete; no automatic correction")
if __name__=="__main__":
    main()
