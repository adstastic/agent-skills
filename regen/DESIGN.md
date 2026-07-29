# Design

Shape the system before generating any of it. Interiors are disposable, so boundaries are everything — they get the upfront thought, because a boundary can't be refactored like a class once neighbors bake it into their evaluations.

## Steps

1. **Define the system, not the code.** Write a spec that could drive regeneration:
   - Contract: interfaces, inputs/outputs, event schemas — field-level precision ("`email`: valid RFC 5322 string"), never "returns user data".
   - Invariants: properties every implementation must preserve ("a refund never exceeds the original charge", "ledger entries always balance").
   - Operational envelope: latency ceilings, cost budgets, availability targets, quality thresholds — quantified, in the spec, not discovered in production later.
   - Data: what this component owns, its schema, its continuity requirements. Schema evolution is the binding constraint; data outlives every implementation.
   Intent may live in several representations — prose, example interactions, formal constraints — that triangulate; keep them reconciled rather than crowning one format.
   Fuzzy, contradictory, or missing intent is grilled out of the human before it is written down (`GRILL.md`) — a spec built on unexamined intent regenerates the wrong system precisely.
   Complete when a competent stranger (human or model) could regenerate the component from the spec alone and you could judge the result: the deletion test passes on paper.

2. **Draw the grain.** Size each component so it can be deleted and regenerated safely. Test every proposed boundary five ways:
   - Comprehension: invariants, edge cases, and data transformations graspable in ~10 minutes — needing the repo's history is sediment, not a component.
   - Isolation: correctness verifiable at its boundary without booting half the system.
   - Mutation ownership: exclusive logical write authority over its data. One writer per dataset, no exceptions — you can't regenerate what you don't exclusively control.
   - Contract: a versioned, schema-enforced interface; neighbors depend on the contract, never on internals or shared informal knowledge.
   - Gut: deleting it should read as mild inconvenience. Trivial → grain too fine, orchestration will dominate. Dread — regeneration would need knowledge invisible at its boundary → a taproot of hidden coupling; redraw.
   Complete when every component passes all five or carries a recorded failure and the redraw it demands.

3. **Assign pace.** Follow the blast radius (a change could break things you don't own → slow), the recovery time (days not minutes → slow), the dependencies (many depend on it, it depends on few → slow). If you can't answer "what invariants must a regenerated version preserve?", you've found a slow layer masquerading as fast. Encode pace in module structure and pipeline speed, not convention; some code being hard to change is just poor factoring pretending to be foundation.
   Complete when every component has a pace justified by those three heuristics.

4. **Shape for trust.** Push as much logic as possible into small, pure, typed transformations — trusted from structure, not review, and regenerable on type alignment alone. Quarantine the irreducibly messy (state, external effects, tangled business rules): small, at the edges, monitored, blast radius bounded. Probabilistic inside, deterministic at the edges. Better shapes beat better prompts.

5. **Keep interaction models few.** One or two ways components talk — e.g., a uniform request convention plus a mutation bus — spoken natively and exclusively. No private protocols between pairs, no shared tables: two services sharing a table means neither is replaceable.

6. **Conserve the UI.** Users are downstream dependents and the interface is the human protocol — protocols don't churn, implementations do. Good UI absorbs internal volatility; bad UI transmits it. UI changes are rare, deliberate, additive, optional, reversible; deprecations slow and visible; optimize for predictability, not novelty.

7. **Run the n=1 check.** Could one competent person hold this design and regenerate any part of it? If not, complexity is compounding beyond anyone's control — compact the design before building it (`TEND.md`). Corollary: form teams around interfaces, not codebases.

## Anti-patterns

- Frameworks mistaken for architecture — architecture is the explicit rules components must satisfy (communication, mutation ownership, verification, replacement); a framework leaves those implicit.
- The unit of generation being an application instead of a component that compiles into a stable architecture.
- Speculative abstraction: a Strategy/Factory/Interface where an `if` pays rent. Models hallucinate architecture; the design says no.
- Hardening fast layers with slow-layer ceremony — it wastes effort and slows learning.
- Betting one tool, model, spec format, or eval framework wins a layer. Keep layers composable, let downstream evaluation arbitrate; lock-in becomes next quarter's migration.
