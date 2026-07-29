# Operate

Production is a compiler input, not a dashboard. The operating question is not "what is broken?" but "which claims about the system are no longer true?" — the primary failure mode is evidence decay: a component can satisfy its spec today and fail it in three months with no code change, because the world changed.

## Steps

1. **Ship at the layer's pace.** Fast layers: continuous deploys, instant rollback. Slow layers: staged rollouts, manual checkpoints, migration plans — for the slowest (ledgers, audit trails), preservation proofs and review. UI: rare, additive, reversible, deprecations slow and visible. A rollback path is named before any deploy, and the fix mode is replacement; a hand-patch under fire is escape-hatch provenance debt — record it and backfill spec and evals (`RECORD.md`).

2. **Canonicalize evidence.** Turn telemetry into claims attached to spec requirements: "p95 latency 120ms for enterprise traffic at peak, ceiling 200ms", "cost per request within budget", "fallback activation 0.1%, threshold 0.5%". Preserve context and relationships — over-aggregated metrics answer only the questions someone already thought to ask.
   Complete when every operational-envelope requirement has current evidence with a freshness bound.

3. **Treat drift as claim invalidation.** When evidence exits bounds, name the requirement that is drifting, the components implicated, and the claims now stale — selective invalidation of that subgraph, not "the app is degrading". That naming turns regeneration into a bounded task: rewrite the query planner for its actual workload, redesign the cache whose hit-rate assumptions broke, optimize tail latency because that is what the requirement cares about.

4. **Route feedback upstream.** Eval failure → implementation broken: regenerate. Envelope breach with green evals → the spec is missing a constraint: add it, regenerate against it. User behavior contradicting intent → the spec itself is wrong: redesign. Every signal refines a specific layer; none stops at a human's dashboard.

5. **Listen for quiet failure.** Telemetry says what happened, not whether it should have — it is not the oracle. Watch the quiet signals: support volume rising, users avoiding features they used to explore, metrics drifting and disagreeing without an outage. Loud, immediate failure is a design goal; silence is not health.

## Cadence

Regeneration cadence is an operations concern: fast layers regenerate routinely (each replacement resets entropy), slow layers deliberately and rarely. Too fast outruns your understanding; too slow accumulates entropy. Match the cadence to the layer, and revisit it when evidence drifts.
