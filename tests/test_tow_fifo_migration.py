#!/usr/bin/env python3
"""Unit tests for read-only historical FIFO inventory reconstruction."""
import importlib.util
import unittest
from pathlib import Path

spec=importlib.util.spec_from_file_location("fifo",Path(__file__).resolve().parents[1]/"scripts/prepare_tow_fifo_migration.py")
fifo=importlib.util.module_from_spec(spec)
spec.loader.exec_module(fifo)

def event(hash,ledger,delta,cost=None):
    return {"hash":hash,"ledger":ledger,"delta_tow":str(delta),
            "xrp_spent_excluding_fee":str(cost) if cost is not None else None,
            "cost_basis_status":"candidate_direct_xrp_execution" if cost is not None else "unresolved_or_nonpurchase"}

def wallet(events,missing=0):
    return {"wallet":"rTest","movements":events,"account_history_exhausted":True,
            "unvalidated_entries":0,"metadata_issues":[],"missing_count":missing,
            "stored_without_detected_delta":[]}

class ReconstructionTests(unittest.TestCase):
    def test_partial_fifo_consumes_oldest_cost(self):
        report=fifo.reconstruct(wallet([event("a",1,100,10),event("b",2,100,20),event("c",3,-150)]))
        self.assertEqual(report["remaining_tow"],"50")
        self.assertEqual(report["lots"][0]["remaining_tow"],"0")
        self.assertEqual(report["lots"][1]["remaining_tow"],"50")
        self.assertEqual(report["lots"][1]["remaining_xrp"],"10.0")
        self.assertFalse(report["safe_to_migrate"])

    def test_unknown_cost_survives_as_blocker(self):
        report=fifo.reconstruct(wallet([event("a",1,100)]))
        self.assertEqual(report["unpriced_surviving_lots"],["a"])
        self.assertFalse(report["evidence_complete"])

    def test_outflow_shortfall_is_blocker(self):
        report=fifo.reconstruct(wallet([event("a",1,5,1),event("b",2,-10)]))
        self.assertEqual(report["outflow_shortfalls"][0]["uncovered_tow"],"5")
        self.assertFalse(report["evidence_complete"])

    def test_missing_database_events_block_readiness(self):
        report=fifo.reconstruct(wallet([event("a",1,100,10)],missing=1))
        self.assertFalse(report["evidence_complete"])
        self.assertFalse(report["safe_to_migrate"])

    def test_even_complete_inventory_cannot_auto_migrate(self):
        report=fifo.reconstruct(wallet([event("a",1,100,10)]))
        self.assertTrue(report["evidence_complete"])
        self.assertFalse(report["safe_to_migrate"])

if __name__=="__main__":
    unittest.main()
