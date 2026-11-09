import unittest
from scripts.triage_tow_inflow_provenance import triage


class TriageTests(unittest.TestCase):
    def sample(self, classification, amount="1"):
        return {"schema_version": 1, "mode": "review_only", "production_write_authorized": False,
                "safe_to_import": False, "missing_inflow_count": 1,
                "events": [{"wallet": "rWallet", "tx_hash": "ABC", "ledger": 1,
                            "tx_type": "Payment", "tow_received": amount,
                            "classification": classification,
                            "purchase_certified": False, "cost_certified": False}]}

    def test_external_receipt(self):
        self.assertEqual(triage(self.sample("external_token_receipt"))["groups"][0]["group"], "externally_initiated_receipt")

    def test_small_receipt(self):
        self.assertEqual(triage(self.sample("self_initiated_no_xrp_spend_evidence", "0.9"))["groups"][0]["group"], "self_initiated_small_receipt")

    def test_material_receipt(self):
        self.assertEqual(triage(self.sample("self_initiated_no_xrp_spend_evidence", "70000"))["groups"][0]["group"], "self_initiated_material_receipt")

    def test_xrp_candidate_not_certified(self):
        report = triage(self.sample("self_initiated_xrp_spend_candidate"))
        self.assertFalse(report["safe_to_import"])
        self.assertFalse(report["groups"][0]["transactions"][0]["cost_certified"])

    def test_reject_certified_input(self):
        report = self.sample("external_token_receipt")
        report["events"][0]["cost_certified"] = True
        with self.assertRaises(ValueError):
            triage(report)

    def test_reject_count_mismatch(self):
        report = self.sample("external_token_receipt")
        report["missing_inflow_count"] = 2
        with self.assertRaises(ValueError):
            triage(report)


if __name__ == "__main__":
    unittest.main()
