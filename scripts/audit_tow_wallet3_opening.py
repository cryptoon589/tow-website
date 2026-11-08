#!/usr/bin/env python3
"""Read-only independent check of Wallet 3's previously unexplained TOW inventory."""
import json
import urllib.request

WALLET="rJbdxTe76fYoZFuLKJfJSAU7nMwxH9y4EA"
ISSUER="rstXMYib49TXTv69QioDhADxwxqSNrqRmV"
HASH="5A96168BB643EAF44B88D6A42A13927162D7E41292D0E1D9EE229132D7C4E3F1"
EXPECTED_BEFORE=635012.8393988344
EXPECTED_PURCHASE=1599140.303857
EXPECTED_AFTER=2234153.143255984

def fetch(endpoint):
    body=json.dumps({"method":"tx","params":[{"transaction":HASH,"binary":False}]}).encode()
    request=urllib.request.Request(endpoint,data=body,headers={"Content-Type":"application/json"})
    with urllib.request.urlopen(request,timeout=25) as response:
        return json.load(response)["result"]

def balance(fields):
    low=fields["LowLimit"]["issuer"]
    high=fields["HighLimit"]["issuer"]
    if {low,high}!={WALLET,ISSUER} or fields["Balance"]["currency"]!="TOW":
        return None
    value=float(fields["Balance"]["value"])
    return value if low==WALLET else -value

errors=[]
for endpoint in ["https://s1.ripple.com:51234","https://s2.ripple.com:51234","https://xrplcluster.com"]:
    try:
        result=fetch(endpoint)
        if result.get("validated") is not True or result.get("hash")!=HASH:
            raise ValueError("Transaction identity or validation not established")
        meta=result.get("meta") or result.get("metaData") or {}
        if meta.get("TransactionResult")!="tesSUCCESS":
            raise ValueError("Transaction not successful")
        matched=[]
        for node in meta.get("AffectedNodes",[]):
            item=node.get("ModifiedNode")
            if not item or item.get("LedgerEntryType")!="RippleState":
                continue
            final=item.get("FinalFields",{})
            previous=item.get("PreviousFields",{})
            after=balance(final)
            if after is None or "Balance" not in previous:
                continue
            before=balance({**final,"Balance":previous["Balance"]})
            if before is not None:
                matched.append((before,after))
        if len(matched)!=1:
            raise ValueError("Expected exactly one verifiable TOW trustline movement")
        before,after=matched[0]
        if abs(before-EXPECTED_BEFORE)>0.000001 or abs(after-EXPECTED_AFTER)>0.000001 or abs((after-before)-EXPECTED_PURCHASE)>0.000001:
            raise ValueError("On-chain balances differ from recorded evidence")
        print(json.dumps({"wallet":WALLET,"tx_hash":HASH,"validated":True,"prior_tow_balance":before,"after_tow_balance":after,"movement_tow":after-before,"unexplained_prior_inventory_confirmed":True,"historical_acquisition_cost_verified":False,"fifo_migration_authorized":False}),flush=True)
        break
    except Exception as exc:
        errors.append(endpoint+": "+str(exc)[:160])
else:
    raise RuntimeError("No public server independently verified the transaction: "+"; ".join(errors))
