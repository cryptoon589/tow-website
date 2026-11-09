import importlib.util
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location("legacy",Path(__file__).resolve().parents[1]/"scripts/audit_tow_legacy_positions.py")
legacy=importlib.util.module_from_spec(spec)
spec.loader.exec_module(legacy)

def event(h,ledger,amount,cost="5"):
    return {"hash":h,"ledger":ledger,"delta_tow":amount,"xrp_spent_excluding_fee":cost}

class LegacyTests(unittest.TestCase):
    def test_sell_before_buy_and_oversized_allocation(self):
        evidence={"wallets":[{"wallet":"w","missing_count":0,"movements":[event("BUY",20,"100"),event("SELL",10,"-50",None)]}]}
        positions=[{"id":"original-uuid","wallet_address":"w","buy_tx_hash":"BUY_1","sell_tx_hash":"SELL","tow_amount":"150","status":"disqualified"}]
        result=legacy.audit(evidence,positions)
        self.assertEqual(result["positions"][0]["legacy_position_id"],"original-uuid")
        self.assertIn("sale_precedes_purchase",result["positions"][0]["issues"])
        self.assertIn("legacy_allocation_exceeds_single_source_purchase",result["positions"][0]["issues"])
        self.assertFalse(result["safe_to_apply"])

    def test_no_automatic_mapping_even_with_valid_source(self):
        evidence={"wallets":[{"wallet":"w","missing_count":0,"movements":[event("BUY",10,"100")]}]}
        positions=[{"id":"original-uuid","wallet_address":"w","buy_tx_hash":"BUY_1","sell_tx_hash":None,"tow_amount":"50","status":"alive"}]
        result=legacy.audit(evidence,positions)
        self.assertEqual(result["positions"][0]["issues"],[])
        self.assertFalse(result["positions"][0]["safe_to_auto_map"])

if __name__=="__main__":
    unittest.main()
