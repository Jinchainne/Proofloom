import unittest

from contracts.verdicta import Bounty, Reading, Status, Verdicta


class VerdictaFlowTests(unittest.TestCase):
    def setUp(self):
        self.app = Verdicta()
        self.bounty_id = self.app.create_bounty(
            "creator", 1000, "restore 500 hectares", ["evidence.example"], 2, 999999
        )

    def test_rejects_url_outside_frozen_origins(self):
        with self.assertRaises(AssertionError):
            self.app.submit_evidence(self.bounty_id, "challenger", ["https://evil.example/proof"])

    def test_approved_consensus_credits_winner(self):
        self.app.submit_evidence(self.bounty_id, "challenger", [
            "https://evidence.example/a", "https://evidence.example/b"
        ])
        self.app.settle_from_consensus(self.bounty_id, [
            Reading("publisher-a", True, True, True),
            Reading("publisher-b", True, True, True),
        ])
        self.assertEqual(self.app.bounties[self.bounty_id].status, Status.APPROVED)
        self.assertEqual(self.app.claim("challenger"), 1000)
        with self.assertRaises(AssertionError):
            self.app.claim("challenger")

    def test_inconclusive_when_publishers_are_not_independent(self):
        self.app.submit_evidence(self.bounty_id, "challenger", ["https://evidence.example/a"])
        self.app.settle_from_consensus(self.bounty_id, [
            Reading("same-publisher", True, True, True),
            Reading("SAME-PUBLISHER", True, True, True),
        ])
        self.assertEqual(self.app.bounties[self.bounty_id].status, Status.INCONCLUSIVE)


if __name__ == "__main__":
    unittest.main()
