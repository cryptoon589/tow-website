#!/usr/bin/env python3
"""Live, read-only XRPL account_tx verification. No DB writes or secrets."""
import json, urllib.request, time
from decimal import Decimal
from pathlib import Path
REPORT={"schema_version":1,"source":"validated XRPL account_tx metadata","production_write_authorized":False,"wallets":[]}
STORED_HASHES=json.loads(Path(__file__).with_name("tow_stored_event_hashes.json").read_text())
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
    if meta.get("TransactionResult")!="tesSUCCESS": return Decimal(0),None # Validated failed transactions cannot change TOW balances
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
    movement_count=0; inflows=Decimal(0); outflows=Decimal(0); unresolved=[]; movement_samples=[]; movement_records=[]
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
                    xrp_changes=[]
                    for affected in (entry.get("meta") or entry.get("metaData") or {}).get("AffectedNodes",[]):
                        root=affected.get("ModifiedNode") or {}
                        if root.get("LedgerEntryType")!="AccountRoot": continue
                        final=root.get("FinalFields") or {}
                        previous=root.get("PreviousFields") or {}
                        if final.get("Account")==wallet and "Balance" in previous and "Balance" in final:
                            xrp_changes.append((Decimal(str(final["Balance"]))-Decimal(str(previous["Balance"])))/Decimal(1000000))
                    fee=Decimal(str(tx.get("Fee","0")))/Decimal(1000000) if tx.get("Account")==wallet else Decimal(0)
                    xrp_ex_fee=xrp_changes[0]+fee if len(xrp_changes)==1 else None
                    cost=(str(-xrp_ex_fee) if delta>0 and xrp_ex_fee is not None and xrp_ex_fee<0 and tx.get("Account")==wallet and tx.get("TransactionType") in ("Payment","OfferCreate") else None)
                    movement_records.append({"hash":h,"delta_tow":str(delta),"ledger":ledger,"tx_type":tx.get("TransactionType"),"initiator":tx.get("Account"),"xrp_balance_delta":str(xrp_changes[0]) if len(xrp_changes)==1 else None,"network_fee_xrp":str(fee),"xrp_spent_excluding_fee":cost,"cost_basis_status":"candidate_direct_xrp_execution" if cost else "unresolved_or_nonpurchase","already_stored":h in STORED_HASHES[wallet],"tx_date":tx.get("date")})
                    if len(movement_samples)<10: movement_samples.append({"hash":h,"delta_tow":str(delta),"ledger":ledger})
        marker=result.get("marker")
        if marker is None: exhausted=True; break
    found=[h for h,w in KNOWN.items() if w==wallet and h in hashes]
    stored_hashes=set(STORED_HASHES[wallet])
    chain_hashes={item["hash"] for item in movement_records}
    missing=sorted(chain_hashes-stored_hashes)
    stored_without_tow=sorted(stored_hashes-chain_hashes)
    REPORT["wallets"].append({"wallet":wallet,"account_history_exhausted":exhausted,"validated_entries":validated,"unvalidated_entries":failures,"metadata_issues":unresolved,"missing_count":len(missing),"stored_without_detected_delta":stored_without_tow,"movements":movement_records,"historical_balance_certified":False,"migration_authorized":False})
    print(json.dumps({"wallet":wallet,"missing_tow_movement_hashes":missing,"missing_count":len(missing),"stored_hashes_without_detected_tow_delta":stored_without_tow,"stored_without_detected_delta_count":len(stored_without_tow),"hash_set_reconciled":not missing and not stored_without_tow}),flush=True)
    if wallet=="rJbdxTe76fYoZFuLKJfJSAU7nMwxH9y4EA":
        print(json.dumps({"wallet":wallet,"all_tow_movements":movement_records}),flush=True)
    print(json.dumps({"wallet":wallet,"tow_movement_count":movement_count,"tow_inflows":str(inflows),"tow_outflows":str(outflows),"net_tow_change":str(inflows-outflows),"stored_tow_event_count":known["stored"],"unresolved_metadata_count":len(unresolved),"unresolved_samples":unresolved[:5],"movement_samples":movement_samples,"tow_history_reconciled":exhausted and not unresolved and not missing and not stored_without_tow}),flush=True)
    print(json.dumps({"wallet":wallet,"rpc":used_endpoint,"pages":pages,"pagination_exhausted":exhausted,"unique_account_transactions":len(hashes),"duplicate_hashes":duplicate,"validated_entries":validated,"not_validated_entries":failures,"earliest_account_ledger":earliest,"latest_account_ledger":latest,"stored_tow_event_count":known["stored"],"stored_checkpoint":known["checkpoint"],"known_purchase_hashes_found":found,"known_purchase_hashes_expected":[h for h,w in KNOWN.items() if w==wallet],"historical_balance_certified":False,"fifo_migration_authorized":False}),flush=True)

# An incomplete account_tx scan is evidence of an unresolved coverage gap,
# not a successful historical verification. No database writes occur.

# Export complete read-only transaction-level evidence as a downloadable CI artifact.
# Never import this file into production without independent classification and balance reconciliation.
output=Path("tow-reconciliation-evidence.json")
output.write_text(json.dumps(REPORT,indent=2)+"\n")
print(json.dumps({"evidence_artifact":str(output),"wallets":len(REPORT["wallets"]),"movements":sum(len(w["movements"]) for w in REPORT["wallets"]),"production_write_authorized":False}),flush=True)
