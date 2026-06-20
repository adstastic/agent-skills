# Phoenix Prove

Prove creates Oracles and records Evidence. It makes Rendering changes safe by saying how Claims fail.

Use before durable implementation, regeneration, deletion, risky refactors, slow-layer changes, production rollout, or accepting generated code.

## Steps

1. Identify Claim and Boundary.
   - Complete when each Claim being checked has an owner Boundary, or ownership is sent to `BOUND.md`.

2. Choose Oracle kind.
   - `example_test`: concrete behavior/regression.
   - `contract_test`: API/schema/event/workflow obligations.
   - `property_test`: invariant over generated inputs or sequences.
   - `snapshot_or_golden`: generated docs, prompts, UI, structured output.
   - `eval_corpus`: labeled/curated probabilistic examples.
   - `llm_judge`: semantic checks when deterministic checks cannot express enough; calibrate and sample.
   - `monitor`: live operational or business signal.
   - `manual_review_gate`: human judgment where automation is insufficient.
   - `static_check`: type, lint, policy, dependency, schema, migration, or security check.
   - Complete when deterministic checks are preferred where possible and LLM/manual checks are justified.

3. Set durability and strength.
   - `ephemeral`: tied to current Rendering; disposable.
   - `durable`: tied to Claim/Boundary; survives replacement.
   - `live`: production Evidence stream.
   - `release_gate`: blocks rollout or regeneration acceptance.
   - Stronger Oracles for auth, permissions, tenant isolation, money, data durability, audit, privacy, public APIs, migrations, human-trust UI flows, factual generated claims.
   - Complete when every durable/slow Claim has at least one durable Oracle or an explicit gap.

4. Define pass/fail, blind spots, and failure action.
   - Failure action: block merge, block release, rollback, alert, create issue, regenerate candidate, manual review.
   - Monitors without actions are dashboards, not Oracles.
   - Complete when every Oracle can produce a clear accept/reject/escalate result.

5. Add Evidence for live/operational Claims.
   - Evidence needs source, time/window, sample/segment, observed value, threshold, freshness, and invalidation target.
   - Production drift asks: which Claim is no longer supported? which Boundary/Rendering is stale?
   - Complete when live Evidence can age or invalidate a specific subgraph, not just “something is worse.”

6. Decide whether Rendering can proceed.
   - yes: minimum Oracles exist and failure actions are clear.
   - limited: proceed narrowly while adding Oracle.
   - no: correctness cannot be judged.

## Pair with existing skills

- Use `tdd` for red/green behavior through public interfaces.
- Use evaluation-writing skills for probabilistic outputs.
- Use debugging/incident skills when an Oracle failed and cause is unknown.

## Output

```text
Phoenix prove

Claims checked:
- ...

Oracle set:
- ephemeral:
- durable:
- live:
- release_gate:

Pass/fail criteria:
- ...

Failure action:
- ...

Evidence to record:
- ...

Known blind spots:
- ...

Can Rendering proceed?
- yes | no | limited
- Reason:

Graph update:
- update | skip: <reason>

Next branch:
- render | frame | bound | compact
```
