# { "Depends": "py-genlayer:1jb45aa8yn2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""Proofloom GenLayer Intelligent Contract."""
import genlayer as gl


class Proofloom(gl.Contract):
    next_bounty_id: int
    bounty_claim: dict[int, str]
    bounty_evidence: dict[int, str]
    bounty_status: dict[int, str]

    def __init__(self):
        self.next_bounty_id = 1
        self.bounty_claim = {}
        self.bounty_evidence = {}
        self.bounty_status = {}

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
            prompt = f"Return true only when this page supports the claim. CLAIM: {claim}\nPAGE: {page[:12000]}"
            return bool(gl.nondet.exec_prompt(prompt, response_format=bool))

        supported = gl.eq_principle.strict_eq(judge_source)
        self.bounty_status[bounty_id] = "APPROVED" if supported else "REJECTED"
        return self.bounty_status[bounty_id]

    @gl.public.view
    def get_bounty(self, bounty_id: int) -> dict:
        return {"id": bounty_id, "claim": self.bounty_claim.get(bounty_id, ""), "evidence_url": self.bounty_evidence.get(bounty_id, ""), "status": self.bounty_status.get(bounty_id, "UNKNOWN")}

    @gl.public.view
    def get_stats(self) -> dict:
        return {"total": self.next_bounty_id - 1, "approved": sum(1 for s in self.bounty_status.values() if s == "APPROVED")}
