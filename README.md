# Proofloom — proof-powered public outcomes

Proofloom is a GenLayer-ready marketplace where teams lock a reward behind a public claim, contributors submit verifiable evidence, and validator consensus settles the result. It combines the strongest patterns from Verda, Triggera, ProofBounty, and the GenLayer Incident Response Playbook.

## Included

- A polished, responsive static dashboard in `web/` — no build step or dependencies.
- A GenLayer Intelligent Contract in `contracts/proofloom.py` using `gl.nondet.web.render`, `gl.nondet.exec_prompt`, and `gl.eq_principle.strict_eq`.
- A browser-wallet client in `web/wallet.js` using GenLayerJS `readContract`, fee estimation, `writeContract`, and finalization tracking.
- Bradbury deployment details in `docs/DEPLOYMENT.md`.
- Architecture and security decisions in `docs/ARCHITECTURE.md`.

## Run the demo

```powershell
cd web
python -m http.server 4173
```

Open `http://localhost:4173`. The demo includes live filtering, a creation dialog, keyboard escape handling, and a simulated evidence-submission state transition.

## Protocol principles

1. **Frozen terms** — reward, criteria, evidence origins, deadline, and bond are immutable once a bounty opens.
2. **Fetch, don't trust** — validators fetch URLs themselves; submitter prose never decides a payout.
3. **Code settles money** — models emit constrained readings only. Deterministic code derives status and payout.
4. **One publisher, one voice** — source independence is measured by publisher, not URL count.
5. **Safe exits** — permissionless timeout, appeal, and claim paths prevent funds from becoming stuck.

## Status

The contract is ready for GenVM linting and Studio deployment. Set the deployed address in `web/contract-config.js`, then connect a wallet on chain 61997 to create and read bounties. Run the CI suite before deployment.
