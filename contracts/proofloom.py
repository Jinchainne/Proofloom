# v0.3.0
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""Proofloom GenLayer Intelligent Contract."""
from genlayer import *


class Proofloom(gl.Contract):
    next_bounty_id: u256
    bounty_claim: TreeMap[u256, str]
    bounty_evidence: TreeMap[u256, str]
    bounty_status: TreeMap[u256, str]

    def __init__(self):
        self.next_bounty_id = 1
        self.bounty_claim = TreeMap()
        self.bounty_evidence = TreeMap()
        self.bounty_status = TreeMap()

    @gl.public.write
    def create_bounty(self, claim: str, evidence_url: str) -> int:
        assert claim and evidence_url.startswith("https://")
        bounty_id = self.next_bounty_id
        self.next_bounty_id += 1
        self.bounty_claim[bounty_id] = claim
        self.bounty_evidence[bounty_id] = evidence_url
        self.bounty_status[bounty_id] = "OPEN"
        return bounty_id

    @gl.public.write
    def verify_bounty(self, bounty_id: int) -> str:
        assert self.bounty_status.get(bounty_id) == "OPEN"
        claim, url = self.bounty_claim[bounty_id], self.bounty_evidence[bounty_id]

        def judge_source() -> bool:
            page = gl.nondet.web.render(url, mode="text")
            # Keep the consensus output a stable boolean. The web page is the
            # nondeterministic input; no LLM call is required for this first
            # release, avoiding runner-specific prompt parameters.
            words = {word.strip(".,:;!?()[]{}\"'").lower() for word in claim.split() if len(word) > 3}
            source = page[:12000].lower()
            return bool(words) and sum(1 for word in words if word in source) >= max(1, len(words) // 2)

        supported = gl.eq_principle.strict_eq(judge_source)
        self.bounty_status[bounty_id] = "APPROVED" if supported else "REJECTED"
        return self.bounty_status[bounty_id]

    @gl.public.view
    def get_bounty(self, bounty_id: int) -> dict:
        return {"id": bounty_id, "claim": self.bounty_claim.get(bounty_id, ""), "evidence_url": self.bounty_evidence.get(bounty_id, ""), "status": self.bounty_status.get(bounty_id, "UNKNOWN")}

    @gl.public.view
    def get_stats(self) -> dict:
        return {"total": self.next_bounty_id - 1, "approved": sum(1 for s in self.bounty_status.values() if s == "APPROVED")}
