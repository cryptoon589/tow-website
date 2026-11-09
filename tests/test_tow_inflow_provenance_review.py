import unittest
from scripts.tow_inflow_provenance_review import review


class ReviewTests(unittest.TestCase):
    def evidence(self, initiator, cost=None, stored=False):
        address = 'rWallet'
        return {'schema_version': 1, 'production_write_authorized': False,
                'wallets': [{'wallet': address, 'account_history_exhausted': True,
                             'metadata_issues': [], 'unvalidated_entries': 0,
                             'movements': [{'hash': 'A', 'ledger': 10, 'tx_type': 'Payment',
                                            'initiator': initiator, 'delta_tow': '10',
                                            'xrp_spent_excluding_fee': cost,
                                            'already_stored': stored}]}]}

    def test_external_receipt_not_purchase(self):
        result = review(self.evidence('rOther'))
        self.assertEqual(result['events'][0]['classification'], 'external_token_receipt')
        self.assertFalse(result['events'][0]['purchase_certified'])

    def test_self_initiated_fee_only_not_purchase(self):
        result = review(self.evidence('rWallet'))
        self.assertEqual(result['events'][0]['classification'], 'self_initiated_no_xrp_spend_evidence')

    def test_spend_candidate_not_certified(self):
        result = review(self.evidence('rWallet', '5'))
        self.assertEqual(result['events'][0]['classification'], 'self_initiated_xrp_spend_candidate')
        self.assertFalse(result['events'][0]['cost_certified'])
        self.assertFalse(result['safe_to_import'])

    def test_stored_movement_excluded(self):
        self.assertEqual(review(self.evidence('rWallet', stored=True))['missing_inflow_count'], 0)

    def test_incomplete_history_rejected(self):
        data = self.evidence('rWallet')
        data['wallets'][0]['account_history_exhausted'] = False
        with self.assertRaises(ValueError):
            review(data)

    def test_missing_initiator_not_external(self):
        result = review(self.evidence(None))
        self.assertEqual(result['events'][0]['classification'], 'unknown_initiator')


if __name__ == '__main__':
    unittest.main()
