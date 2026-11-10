import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from reconcile_tow_aggregate_commitments import reconcile

W = "rWallet"
def evidence():
    return {"schema_version":1,"production_write_authorized":False,"wallets":[{
        "wallet":W,"account_history_exhausted":True,"unvalidated_entries":0,"metadata_issues":[],
        "movements":[{"hash":"a","ledger":1,"delta_tow":"60.0000001","initiator":W,"xrp_spent_excluding_fee":"3","already_stored":True},
                     {"hash":"b","ledger":2,"delta_tow":"40","initiator":W,"xrp_spent_excluding_fee":"2","already_stored":True},
                     {"hash":"c","ledger":3,"delta_tow":"-10","initiator":W,"xrp_spent_excluding_fee":None,"already_stored":True}]}]}
def positions():
    return [{"id":"p1","wallet_address":W,"tow_amount":"50","buy_value_xrp":"2"},
            {"id":"p2","wallet_address":W,"tow_amount":"50","buy_value_xrp":"2"}]
class TestAggregate(unittest.TestCase):
    def test_aggregate(self):
        r=reconcile(evidence(),positions(),W)
        self.assertEqual(r["purchase_count"],2)
        self.assertEqual(r["tow_difference"],"1E-7")
        self.assertEqual(r["xrp_difference"],"1")
        self.assertFalse(r["safe_to_apply"])
        self.assertFalse(r["cost_certified"])
    def test_reject_incomplete_history(self):
        e=evidence();e["wallets"][0]["account_history_exhausted"]=False
        with self.assertRaises(ValueError): reconcile(e,positions(),W)
    def test_reject_duplicate_hash(self):
        e=evidence();e["wallets"][0]["movements"].append(e["wallets"][0]["movements"][0])
        with self.assertRaises(ValueError): reconcile(e,positions(),W)
    def test_reject_nonfinite(self):
        p=positions();p[0]["tow_amount"]="NaN"
        with self.assertRaises(ValueError): reconcile(evidence(),p,W)
    def test_reject_duplicate_position(self):
        p=positions();p.append(dict(p[0]))
        with self.assertRaises(ValueError): reconcile(evidence(),p,W)
if __name__=="__main__":
    unittest.main()
