import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("staging", Path(__file__).resolve().parents[1] / "scripts/prepare_tow_event_import.py")
staging = importlib.util.module_from_spec(spec)
spec.loader.exec_module(staging)

def fixture():
    return {"schema_version": 1, "production_write_authorized": False, "wallets": [{
        "wallet": "rTest", "account_history_exhausted": True, "unvalidated_entries": 0,
        "metadata_issues": [], "missing_count": 1, "movements": [{
            "hash": "ABC", "ledger": 123, "tx_date": 800000000,
            "delta_tow": "10.5", "already_stored": False,
            "xrp_spent_excluding_fee": "2", "cost_basis_status": "candidate_direct_xrp_execution"
        }]
    }]}

class StagingTests(unittest.TestCase):
    def test_staged_only_not_classified_or_importable(self):
        result = staging.prepare(fixture())
        self.assertEqual(result["missing_events"], 1)
        self.assertEqual(result["events"][0]["event_type"], "pending_classification")
        self.assertTrue(result["events"][0]["review_required"])
        self.assertFalse(result["safe_to_import"])
        self.assertFalse(result["production_write_authorized"])

    def test_duplicate_hash_rejected(self):
        source = fixture()
        source["wallets"][0]["movements"].append(dict(source["wallets"][0]["movements"][0], already_stored=True))
        with self.assertRaises(ValueError):
            staging.prepare(source)

    def test_duplicate_wallet_rejected(self):
        source = fixture()
        source["wallets"].append(dict(source["wallets"][0]))
        with self.assertRaises(ValueError):
            staging.prepare(source)

    def test_incomplete_history_rejected(self):
        source = fixture()
        source["wallets"][0]["account_history_exhausted"] = False
        with self.assertRaises(ValueError):
            staging.prepare(source)

    def test_unreconciled_missing_count_rejected(self):
        source = fixture()
        source["wallets"][0]["missing_count"] = 0
        with self.assertRaises(ValueError):
            staging.prepare(source)

    def test_unverified_xrp_cost_remains_candidate(self):
        result = staging.prepare(fixture())
        self.assertEqual(result["events"][0]["xrp_cost_candidate"], "2")
        self.assertEqual(result["events"][0]["cost_basis_status"], "candidate_direct_xrp_execution")

    def test_negative_cost_rejected(self):
        source = fixture()
        source["wallets"][0]["movements"][0]["xrp_spent_excluding_fee"] = "-2"
        with self.assertRaises(ValueError):
            staging.prepare(source)

    def test_non_finite_delta_rejected(self):
        source = fixture()
        source["wallets"][0]["movements"][0]["delta_tow"] = "NaN"
        with self.assertRaises(ValueError):
            staging.prepare(source)

    def test_missing_validated_timestamp_rejected(self):
        source = fixture()
        del source["wallets"][0]["movements"][0]["tx_date"]
        with self.assertRaises(ValueError):
            staging.prepare(source)

if __name__ == "__main__":
    unittest.main()
