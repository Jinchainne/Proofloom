# Architecture

## Settlement path

```text
CREATOR locks reward → OPEN → contributor accepts + bond → EVIDENCE_SUBMITTED
  → permissionless verify → PENDING_FINALITY → FINAL → claim reward
                                    ↘ NEEDS_REVISION / INCONCLUSIVE → OPEN
```

The evidence basis is signed with the bounty. Submitted URLs must match an allowed origin and their publisher identity is normalized before counting independent sources.

## Consensus boundary

The non-deterministic function fetches each URL and asks every validator for a small structured reading: readable, on-scope, supports-claim, publisher, and confidence bucket. The verdict itself is not model output. Every validator runs the same deterministic `_derive_outcome` over constrained readings:

- unreadable or insufficient sources → `INCONCLUSIVE`
- independent supporting publishers at/above threshold → `APPROVED`
- independent contradicting publishers at/above threshold → `REJECTED`
- otherwise → `NEEDS_REVISION`

## Safety checklist

- Exact-value escrow only; no accidental excess payment.
- Pull payments with state zeroed before transfer.
- Bounded number of concurrent attempts.
- Frozen criteria and source allowlist.
- Permissionless verification and expiry.
- Finality window plus bonded appeal; appeal is judged again by consensus.
- Explicit source/URL normalization and a per-publisher quorum.

These choices specifically address prompt injection, URL spoofing/rot, validator disagreement, access control, settlement-loop availability, and evidence provenance.
