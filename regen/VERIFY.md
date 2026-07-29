# Verify

Evaluations are the real codebase — the durable encoding of what the system must do. Confidence is the product; code is a byproduct. If deleting the implementation feels terrifying, the evaluations are insufficient.

Three tiers, three lifetimes:

| Tier | Lives at | Dies | Examples |
|---|---|---|---|
| Ephemeral | one implementation | at reimplementation, guilt-free | unit tests, structural assertions, mock-heavy tests |
| Durable | boundaries | never — survives rewrites | invariants, contracts, property tests, e2e behavioral checks |
| Live | production | never | monitors, drift detection, anomaly alerts |

A system is safely regenerable only when all three tiers exist.

## Steps

1. **Write durable evaluations at boundaries.**
   - Invariants as universals: "for all lists, sorting returns the same elements in non-decreasing order" — not `sort([3,1,2]) == [1,2,3]`. Do the archaeology: extract the implicit invariants buried in code that "just works", and capture every edge-case bug fix as an explicit evaluation instead of knowledge trapped in code.
   - Contracts with field-level precision: types, formats, nullability, ordering, error shapes.
   - Property tests over generated inputs; end-to-end checks on observable behavior with internal paths irrelevant.
   - Litmus: would this suite survive reimplementation in another language? If not, it tests the implementation, not the system — wrong boundary.
   Complete when every spec invariant has a check and the durable suite passes the litmus.

2. **Layer independent strategies.** Property-based, example-based, contract, performance-bound, judge-based — each catches failures the others miss; overlap is the point, five strategies mean fewer blind spots, not zero. Scale ceremony with pace: slow layers (`SKILL.md` rule 4) add formal verification, audits, human review.

3. **Make evals hard to fool.** Generated tests can test nothing and generated explanations can explain nothing. Prove each check can fail — break or mutate the code and watch it go red — before trusting its green. Never accept a green you haven't seen red.
   Complete when every new check has been seen red once.

4. **Wire the live tier.** Operational metrics (latency distributions, error rates, throughput), business metrics (conversion, accuracy, revenue per transaction), and — for AI components — cost per request and token consumption: a regeneration can pass every test and double your costs. Every monitor gets a threshold and a consequence; a monitor nobody acts on is a dashboard. Details in `OPERATE.md`.

5. **Keep authorship split.** Whoever specifies intent owns the evaluations; implementations are generated against them and failing evals mean no ship. Working code you don't understand is precisely the comfort to refuse — accepting code because it runs, without evaluation you trust, is abdication.

Write ephemeral tests freely for the implementation at hand; delete them without guilt at the next regeneration. Be honest about which tier each check belongs to — an ephemeral test mislabeled durable is fake safety that dies with the rewrite.
