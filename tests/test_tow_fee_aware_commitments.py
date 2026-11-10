import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"scripts"))
from reconcile_tow_fee_aware_commitments import compare

W="rWallet"
def inputs():
    e={"schema_version":1,"production_write_authorized":False,"wallets":[{
        "wallet":W,"account_history_exhausted":True,"unvalidated_entries":0,"metadata_issues":[],
        "movements":[{"hash":"ABC","ledger":12,"delta_tow":"100.000000001","initiator":W,
                      "xrp_spent_excluding_fee":"5","network_fee_xrp":"0.000012","already_stored":True}]}]}
    p=[{"id":"one","wallet_address":W,"tow_amount":"100","buy_value_xrp":"4"}]
    s=[{"wallet_address":W,"tx_hash":"abc","event_type":"buy","tow_amount":"100","xrp_value":"5.000012"}]
    return e,p,s
class TestFeeAware(unittest.TestCase):
    def test_fee_separated_and_commitment_unresolved(self):
        e,p,s=inputs();r=compare(e,p,s,W)
        self.assertEqual(r["network_fees_xrp"],"0.000012")
        self.assertEqual(r["fee_reconciliation_difference"],"0.000000")
        self.assertEqual(r["unresolved_commitment_xrp_difference"],"1")
        self.assertFalse(r["safe_to_apply"])
    def test_reject_wrong_fee(self):
        e,p,s=inputs();s[0]["xrp_value"]="5.000013"
        with self.assertRaises(ValueError):compare(e,p,s,W)
    def test_reject_missing_fee(self):
        e,p,s=inputs();del e["wallets"][0]["movements"][0]["network_fee_xrp"]
        with self.assertRaises(ValueError):compare(e,p,s,W)
    def test_reject_duplicate_stored_hash(self):
        e,p,s=inputs();s.append(dict(s[0]))
        with self.assertRaises(ValueError):compare(e,p,s,W)
    def test_reject_quantity_mismatch(self):
        e,p,s=inputs();s[0]["tow_amount"]="99"
        with self.assertRaises(ValueError):compare(e,p,s,W)
if __name__=="__main__":unittest.main()
