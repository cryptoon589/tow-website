#!/usr/bin/env python3
"""Read-only: inspect executed XRP balance change and TOW change, never infer offer price as cost."""
import json
import urllib.request
from decimal import Decimal

WALLET="rJbdxTe76fYoZFuLKJfJSAU7nMwxH9y4EA"
ISSUER="rstXMYib49TXTv69QioDhADxwxqSNrqRmV"
HASHES=[
"C944BF455C9991DE497D63F278DA6CDE184BB58C346F99B1F86B4D8BA70AD743",
"22D77069FFCFC40A4647046329430230E1081058C7B80C481A25F9622A4C994A",
]
ENDPOINTS=["https://s1.ripple.com:51234","https://s2.ripple.com:51234","https://xrplcluster.com"]

def fetch(tx_hash):
    errors=[]
    for endpoint in ENDPOINTS:
        try:
            payload=json.dumps({"method":"tx","params":[{"transaction":tx_hash,"binary":False}]}).encode()
            request=urllib.request.Request(endpoint,data=payload,headers={"Content-Type":"application/json"})
            with urllib.request.urlopen(request,timeout=25) as response:
                result=json.load(response)["result"]
            if result.get("validated") is not True or result.get("hash")!=tx_hash:
                raise ValueError("Unverified transaction")
            if (result.get("meta") or {}).get("TransactionResult")!="tesSUCCESS":
                raise ValueError("Unsuccessful transaction")
            return result
        except Exception as exc:
            errors.append(str(exc))
    raise RuntimeError("Could not verify "+tx_hash+": "+"; ".join(errors))

def tow_balance(fields):
    low=(fields.get("LowLimit") or {}).get("issuer")
    high=(fields.get("HighLimit") or {}).get("issuer")
    value=fields.get("Balance") or {}
    if {low,high}!={WALLET,ISSUER} or value.get("currency")!="TOW":
        return None
    amount=Decimal(str(value["value"]))
    return amount if low==WALLET else -amount

for tx_hash in HASHES:
    result=fetch(tx_hash)
    tx=result.get("tx_json") or result.get("tx") or result
    meta=result["meta"]
    xrp_deltas=[]
    tow_deltas=[]
    for wrapped in meta.get("AffectedNodes",[]):
        kind=next((k for k in ("ModifiedNode","CreatedNode","DeletedNode") if k in wrapped),None)
        if not kind: continue
        node=wrapped[kind]
        final=node.get("FinalFields") or node.get("NewFields") or {}
        prev=node.get("PreviousFields") or {}
        if node.get("LedgerEntryType")=="AccountRoot" and final.get("Account")==WALLET and "Balance" in prev:
            xrp_deltas.append((Decimal(str(final["Balance"]))-Decimal(str(prev["Balance"])))/Decimal(1000000))
        if node.get("LedgerEntryType")=="RippleState":
            after=tow_balance(final)
            if after is None: continue
            before=tow_balance({**final,"Balance":prev["Balance"]}) if "Balance" in prev else Decimal(0) if kind=="CreatedNode" else None
            if before is not None: tow_deltas.append(after-before)
    fee=Decimal(str(tx.get("Fee","0")))/Decimal(1000000)
    if len(xrp_deltas)!=1 or len(tow_deltas)!=1:
        raise ValueError("Cannot uniquely reconcile XRP/TOW deltas for "+tx_hash)
    xrp_delta=xrp_deltas[0]
    tow_delta=tow_deltas[0]
    print(json.dumps({"hash":tx_hash,"ledger":result.get("ledger_index"),"type":tx.get("TransactionType"),"account":tx.get("Account"),"tow_delta":str(tow_delta),"xrp_balance_delta":str(xrp_delta),"network_fee_xrp":str(fee),"xrp_delta_excluding_own_fee":str(xrp_delta+fee) if tx.get("Account")==WALLET else None,"offer_taker_gets":tx.get("TakerGets"),"offer_taker_pays":tx.get("TakerPays"),"historical_cost_certified":False,"production_write_authorized":False}),flush=True)
