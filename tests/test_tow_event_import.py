import importlib.util
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location("staging",Path(__file__).resolve().parents[1]/"scripts/prepare_tow_event_import.py")
staging=importlib.util.module_from_spec(spec)
spec.loader.exec_module(staging)

def evidence(missing_count=1,validated=True):
    return {"schema_version":1,"production_write_authorized":False,
            "wallets":[{"wallet":"rTest","account_history_exhausted":validated,
                        "unvalidated_entries":0,"metadata_issues":[],"missing_count":missing_count,
                        "movements":[{"hash":"ABC","ledger":123,"delta_tow":"10.5","tx_date":800000000,
                                      "already_stored":False,"xrp_spent_excluding_fee":"2",
                                      "cost_basis_status":"candidate_direct_xrp_execution"}]}]}

class StagingTests(unittest.TestCase):
    def test_staging_is_read_only_and_not_prematurely_classified(self):
        result=staging.prepare(evidence())
        self.assertEqual(result["missing_events"],1)
        self.assertEqual(result["events"][0]["event_type"],"pending_classification")
        self.assertTrue(result["events"][0]["raw_metadata_required"])
        self.assertFalse(result["safe_to_import"])
        self.assertFalse(result["production_write_authorized"])

    def test_missing_hash_count_must_match(self):
        with self.assertRaises(ValueError):
            staging.prepare(evidence(missing_count=0))

    def test_incomplete_history_fails(self):
        with self.assertRaises(ValueError):
            staging.prepare(evidence(validated=False))

if __name__=="__main__": unittest.main()
