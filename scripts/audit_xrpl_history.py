#!/usr/bin/env python3
"""Live, read-only XRPL account_tx verification. No DB writes or secrets."""
import json, urllib.request, time
from decimal import Decimal
RPC_ENDPOINTS=["https://s1.ripple.com:51234","https://s2.ripple.com:51234","https://xrplcluster.com"]
WALLETS={
"r4e4c8QgoSjTaskaAaHvWLSKfMrAW92Cbn":{"stored":20,"checkpoint":108201300},
"r4QqFdgZWoHhJwzhLs2dhR7pgGMfg1cSGf":{"stored":29,"checkpoint":108182015},
"rJbdxTe76fYoZFuLKJfJSAU7nMwxH9y4EA":{"stored":4,"checkpoint":108187184},
}
ISSUER="rstXMYib49TXTv69QioDhADxwxqSNrqRmV"
KNOWN={
"E335FB2BB0A30D7E4E274A95B4510121010F57CF0F7D946B8F8D17F6B9D2861F":"r4QqFdgZWoHhJwzhLs2dhR7pgGMfg1cSGf",
"85BE409C3D76E62FBB6238895775D3D57692F0D4CA2DFC52D32C4B291A066055":"rJbdxTe76fYoZFuLKJfJSAU7nMwxH9y4EA",
}
def rpc(method,params):
    errors=[]
    for endpoint in RPC_ENDPOINTS:
        for attempt in range(3):
            try:
                body=json.dumps({"method":method,"params":[params]}).encode()
                req=urllib.request.Request(endpoint,data=body,headers={"Content-Type":"application/json","User-Agent":"TOW-History-Audit/1.0"})
                with urllib.request.urlopen(req,timeout=25) as res: data=json.load(res)
                result=data.get("result",{})
                if result.get("status")!="success":
                    raise RuntimeError(str(result.get("error",data))[:200])
                return result,endpoint
            except Exception as exc:
                errors.append(endpoint+":"+str(exc)[:100])
                time.sleep(2*(attempt+1))
    raise RuntimeError("All public XRPL endpoints failed: "+"; ".join(errors[-6:]))
def tow_balance(fields,wallet):
    if not isinstance(fields,dict): return None
    low=(fields.get("LowLimit") or {}).get("issuer")
    high=(fields.get("HighLimit") or {}).get("issuer")
    if {low,high}!={wallet,ISSUER}: return None
    amount=fields.get("Balance") or {}
    if amount.get("currency")!="TOW": return None
    try: value=Decimal(str(amount["value"]))
    except (ValueError,KeyError): return None
    return value if low==wallet else -value

def tow_movement(entry,wallet):
    meta=entry.get("meta") or entry.get("metaData") or {}
    if meta.get("TransactionResult")!="tesSUCCESS": return None,"unconfirmed"
    delta=Decimal(0)
    for item in meta.get("AffectedNodes",[]):
        kind=next((k for k in ("ModifiedNode","CreatedNode","DeletedNode") if k in item),None)
        if not kind: continue
        node=item[kind]
        if node.get("LedgerEntryType")!="RippleState": continue
        final=node.get("FinalFields") or node.get("NewFields") or {}
        after=tow_balance(final,wallet)
        if after is None: continue
        previous=node.get("PreviousFields") or {}
        if kind=="ModifiedNode":
            if "Balance" not in previous: return None,"missing previous trustline balance"
            before=tow_balance({**final,"Balance":previous["Balance"]},wallet)
            if before is None: return None,"invalid previous trustline balance"
            delta+=after-before
        elif kind=="CreatedNode": delta+=after
        else:
            if after!=0: return None,"deleted nonzero trustline"
    return delta,None

for wallet,known in WALLETS.items():
    marker=None; hashes=set(); pages=0; earliest=None; latest=None; duplicate=0; exhausted=False; validated=0; failures=0
    movement_count=0; inflows=Decimal(0); outflows=Decimal(0); unresolved=[]; movement_samples=[]
    while pages<500:
        args={"account":wallet,"ledger_index_min":-1,"ledger_index_max":-1,"forward":True,"limit":200,"binary":False}
        if marker is not None: args["marker"]=marker
        result,used_endpoint=rpc("account_tx",args)
        time.sleep(0.3)
        pages+=1
        for entry in result.get("transactions",[]):
            tx=entry.get("tx_json") or entry.get("tx") or {}
            h=(tx.get("hash") or entry.get("hash") or "").upper()
            if h in hashes: duplicate+=1
            hashes.add(h)
            ledger=entry.get("ledger_index") or tx.get("ledger_index")
            if isinstance(ledger,int):
                earliest=ledger if earliest is None else min(earliest,ledger)
                latest=ledger if latest is None else max(latest,ledger)
            if entry.get("validated") is True: validated+=1
            else: failures+=1
            if entry.get("validated") is True:
                delta,issue=tow_movement(entry,wallet)
                if issue:
                    unresolved.append({"hash":h,"reason":issue})
                elif delta:
                    movement_count+=1
                    if delta>0: inflows+=delta
                    else: outflows-=delta
                    if len(movement_samples)<10: movement_samples.append({"hash":h,"delta_tow":str(delta),"ledger":ledger})
        marker=result.get("marker")
        if marker is None: exhausted=True; break
    found=[h for h,w in KNOWN.items() if w==wallet and h in hashes]
    print(json.dumps({"wallet":wallet,"tow_movement_count":movement_count,"tow_inflows":str(inflows),"tow_outflows":str(outflows),"net_tow_change":str(inflows-outflows),"stored_tow_event_count":known["stored"],"unresolved_metadata_count":len(unresolved),"unresolved_samples":unresolved[:5],"movement_samples":movement_samples,"tow_history_reconciled":exhausted and not unresolved and movement_count==known["stored"]}),flush=True)
    print(json.dumps({"wallet":wallet,"rpc":used_endpoint,"pages":pages,"pagination_exhausted":exhausted,"unique_account_transactions":len(hashes),"duplicate_hashes":duplicate,"validated_entries":validated,"not_validated_entries":failures,"earliest_account_ledger":earliest,"latest_account_ledger":latest,"stored_tow_event_count":known["stored"],"stored_checkpoint":known["checkpoint"],"known_purchase_hashes_found":found,"known_purchase_hashes_expected":[h for h,w in KNOWN.items() if w==wallet],"historical_balance_certified":False,"fifo_migration_authorized":False}),flush=True)

# An incomplete account_tx scan is evidence of an unresolved coverage gap,
# not a successful historical verification. No database writes occur.
