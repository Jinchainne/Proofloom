"""Verdicta GenLayer intelligent-contract blueprint.

Models return readings, never a verdict or an amount. Port the types and GenVM
decorators to the pinned runner before deployment; this file documents the core
state machine and deterministic settlement boundary.
"""

from dataclasses import dataclass, field
from enum import Enum
from urllib.parse import urlparse


class Status(str, Enum):
    OPEN = "OPEN"
    EVIDENCE_SUBMITTED = "EVIDENCE_SUBMITTED"
    PENDING_FINALITY = "PENDING_FINALITY"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    INCONCLUSIVE = "INCONCLUSIVE"
    CLAIMED = "CLAIMED"


@dataclass
class Reading:
    publisher: str
    readable: bool
    on_scope: bool
    supports_claim: bool


@dataclass
class Bounty:
    creator: str
    reward: int
    claim: str
    origins: list[str]
    min_publishers: int
    deadline: int
    status: Status = Status.OPEN
    evidence: list[str] = field(default_factory=list)
    winner: str = ""


class Verdicta:
    """Pseudo-code API: create_bounty, submit_evidence, verify, claim, expire."""

    def __init__(self):
        self.bounties: dict[int, Bounty] = {}
        self.claimable: dict[str, int] = {}
        self.next_id = 1

    def create_bounty(self, creator, reward, claim, origins, min_publishers, deadline):
        assert reward > 0 and min_publishers > 0 and origins
        bounty = Bounty(creator, reward, claim, [o.lower() for o in origins], min_publishers, deadline)
        self.bounties[self.next_id] = bounty
        self.next_id += 1
        return self.next_id - 1

    def submit_evidence(self, bounty_id, challenger, urls):
        bounty = self.bounties[bounty_id]
        assert bounty.status == Status.OPEN and urls
        for url in urls:
            host = urlparse(url).netloc.lower()
            assert any(host == origin or host.endswith("." + origin) for origin in bounty.origins)
        bounty.evidence = urls
        bounty.winner = challenger
        bounty.status = Status.EVIDENCE_SUBMITTED

    @staticmethod
    def _derive_outcome(readings: list[Reading], minimum: int) -> Status:
        """Pure deterministic code run identically by all validators."""
        usable = {r.publisher.lower(): r for r in readings if r.readable and r.on_scope}
        if len(usable) < minimum:
            return Status.INCONCLUSIVE
        supporting = sum(1 for r in usable.values() if r.supports_claim)
        contradicting = len(usable) - supporting
        if supporting >= minimum:
            return Status.APPROVED
        if contradicting >= minimum:
            return Status.REJECTED
        return Status.INCONCLUSIVE

    def settle_from_consensus(self, bounty_id, readings):
        """Call only after a GenVM nondeterministic fetch + constrained reading."""
        bounty = self.bounties[bounty_id]
        assert bounty.status == Status.EVIDENCE_SUBMITTED
        result = self._derive_outcome(readings, bounty.min_publishers)
        bounty.status = result
        if result == Status.APPROVED:
            self.claimable[bounty.winner] = self.claimable.get(bounty.winner, 0) + bounty.reward

    def claim(self, account):
        amount = self.claimable.get(account, 0)
        assert amount > 0
        self.claimable[account] = 0  # persist before external transfer
        return amount
