#!/usr/bin/env python3
"""Review-only classification of missing XRPL TOW inflows; never certifies cost or writes DB."""
import json
from collections import Counter
from decimal import Decimal
from pathlib import Path

EVIDENCE = Path('tow-reconciliation-evidence.json')
OUTPUT = Path('tow-inflow-provenance-review.json')


def review(evidence):
    if evidence.get('schema_version') != 1 or evidence.get('production_write_authorized') is not False:
        raise ValueError('Expected versioned read-only XRPL evidence')
    results = []
    for wallet in evidence['wallets']:
        address = wallet['wallet']
        if wallet.get('account_history_exhausted') is not True or wallet.get('metadata_issues') or wallet.get('unvalidated_entries') != 0:
            raise ValueError('Incomplete history for ' + address)
        for movement in wallet['movements']:
            if movement.get('already_stored') is not False or Decimal(str(movement['delta_tow'])) <= 0:
                continue
            initiator = movement.get('initiator')
            cost = movement.get('xrp_spent_excluding_fee')
            if not initiator:
                classification = 'unknown_initiator'
                explanation = 'Transaction initiator is absent from evidence; raw transaction metadata must be checked'
            elif initiator != address:
                classification = 'external_token_receipt'
                explanation = 'TOW received from a transaction initiated by another account; recipient XRP purchase cost is not demonstrated'
            elif cost is not None and Decimal(str(cost)) > 0:
                classification = 'self_initiated_xrp_spend_candidate'
                explanation = 'Positive TOW delta and candidate XRP spend; raw execution metadata still required to certify purchase and cost'
            else:
                classification = 'self_initiated_no_xrp_spend_evidence'
                explanation = 'Positive TOW delta with no verified XRP spend beyond transaction fee; may be AMM-related or another receipt'
            results.append({
                'wallet': address, 'tx_hash': movement['hash'], 'ledger': movement['ledger'],
                'tx_type': movement.get('tx_type'), 'initiator': initiator,
                'tow_received': movement['delta_tow'], 'xrp_cost_candidate': cost,
                'classification': classification, 'explanation': explanation,
                'purchase_certified': False, 'cost_certified': False,
                'raw_metadata_review_required': True, 'safe_to_import': False,
            })
    counts = Counter(row['classification'] for row in results)
    return {
        'schema_version': 1, 'mode': 'review_only', 'production_write_authorized': False,
        'safe_to_import': False, 'purchase_certification_complete': False,
        'missing_inflow_count': len(results), 'classification_counts': dict(sorted(counts.items())),
        'events': sorted(results, key=lambda row: (row['ledger'], row['tx_hash'], row['wallet'])),
    }


def main():
    report = review(json.loads(EVIDENCE.read_text()))
    OUTPUT.write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'missing_inflows': report['missing_inflow_count'],
                      'classification_counts': report['classification_counts'],
                      'production_write_authorized': False}), flush=True)


if __name__ == '__main__':
    main()
