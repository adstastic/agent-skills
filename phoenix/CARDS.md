# Phoenix Cards

Use this only when creating or updating `.phoenix/graph.md`.

## Graph policy

Record only memory that affects future safety or decisions:

```text
- durable or slow-layer Claims
- ownership/mutation Boundaries
- Oracles and release gates
- Evidence that can age, drift, or invalidate a Rendering
- Rendering provenance for meaningful changes
- deprecations that explain why old behavior was dropped
```

Skip graph updates for tiny local edits, exploratory notes, or facts already covered elsewhere. If skipped, say why.

## Minimal graph file

```markdown
# Phoenix Graph

Core invariant: important Claims are owned by Boundaries, checked by Oracles, realized by Renderings, and supported by Evidence/provenance.

## Claims

## Boundaries

## Oracles

## Evidence

## Renderings

## Open graph issues
```

## Claim card

```markdown
### CLAIM-<AREA>-<NNN>

Statement:

Type:
- behavior | invariant | constraint | assumption | non_goal | operational | human_protocol

Durability:
- exploratory | durable | slow_layer | deprecated

Source:
- user request | code | incident | metric | ADR | doc | test | production observation | conversation

Owner boundary:
- unknown | BOUNDARY-...

Oracles:
- unknown | ORACLE-...

Renderings:
- unknown | RENDERING-...

Ambiguities:
- ...

Non-goals:
- ...

Provenance:
- Why this exists:
- Alternatives considered:
- Open questions:
```

## Boundary card

```markdown
### BOUNDARY-<AREA>-<NNN>

Name:

Purpose:

Owns claims:
- CLAIM-...

Does not own:
- ...

Owned state:
- ...

Mutation authority:
- Only this boundary may:
- This boundary may not:

Public interface:
- API/events/schema/workflow/CLI/prompt/UI/etc.

Dependencies:
- ...

Dependents:
- ...

Pace:
- very_slow | slow | medium | fast

Blast radius:
- low | medium | high | existential

Recovery:
- rollback | regenerate | migrate | manual repair | irreversible

Regeneration policy:
- free | gated | human_reviewed | rare | never_casual

Boundary oracles:
- ORACLE-...

Current renderings:
- RENDERING-...

Forbidden coupling:
- ...

Provenance:
- Why this boundary exists:
- Alternatives considered:
- Rejected because:
```

## Oracle card

```markdown
### ORACLE-<AREA>-<NNN>

Name:

Checks claims:
- CLAIM-...

Boundary:
- BOUNDARY-...

Kind:
- example_test | contract_test | property_test | snapshot_or_golden | eval_corpus | llm_judge | monitor | manual_review_gate | static_check

Durability:
- ephemeral | durable | live | release_gate

What it checks:

What it does not check:

Pass criteria:

Failure action:
- block merge | block release | rollback | alert | create issue | regenerate candidate | manual review

Renderings evaluated:
- RENDERING-...

Evidence emitted:
- EVIDENCE-...

Location:
- test path, eval path, dashboard, CI job, runbook, etc.

Provenance:
- Why this oracle exists:
- Incidents/regressions covered:
- Known blind spots:
```

## Evidence card

```markdown
### EVIDENCE-<AREA>-<NNN>

Oracle:
- ORACLE-...

Supports or invalidates claims:
- CLAIM-...

Observed rendering:
- RENDERING-...

Source:
- test run | eval run | monitor | metric | log | incident | support report | review

Window / sample:
- time range, dataset, cohort, environment, version

Observed value:
- ...

Threshold / expectation:
- ...

Result:
- pass | fail | drift | inconclusive

Freshness:
- valid_until | stale_after | one_time

Invalidation target:
- none | CLAIM-... | ORACLE-... | RENDERING-... | BOUNDARY-...

Provenance:
- Run command / dashboard / conversation / session:
- Notes:
```

## Rendering card

```markdown
### RENDERING-<AREA>-<NNN>

Name:

Boundary:
- BOUNDARY-...

Realizes claims:
- CLAIM-...

Evaluated by oracles:
- ORACLE-...

Location:
- paths, service, prompt, config, infra module, dashboard, etc.

Mode:
- patch | regenerate | add | wrap | strangle | rollback | delete

Pace:
- very_slow | slow | medium | fast

Rollback:
- ...

Generated from:
- spec/claim/oracle/prompt/model/session/tools, if applicable

Current status:
- active | candidate | deprecated | rolled_back | deleted

Provenance:
- Change reason:
- Alternatives considered:
- Hidden claims discovered:
- Oracle results / Evidence:
- Human review:
```

## Open graph issues

```text
unframed_intent
claim_without_owner
claim_without_oracle
boundary_without_clear_interface
wrong_mutation_authority
rendering_contains_hidden_claim
oracle_failed
production_drift
duplicate_claims
duplicate_boundaries
conceptual_mass
provenance_missing
```
