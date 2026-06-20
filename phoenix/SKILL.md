---
name: phoenix
description: >-
  Use for non-trivial system or product changes where implementation should be tied to durable intent: legacy strategy, refactors, rewrites, new systems, performance work, tests/evals, boundaries, deletion, regeneration, production evidence, or team process consistency.
---

# Phoenix

Phoenix makes code changes traceable to durable system memory. Code is a **Rendering**: useful, replaceable, never the only source of truth.

## Core graph

```text
Claim      = graph statement worth remembering: behavior, invariant, constraint, assumption, non-goal, operational promise, or human protocol.
Boundary   = owner of claims and mutation: module, service, workflow, schema, prompt, job, API, UI surface, product, or operational subsystem.
Oracle     = check for claims: test, property, contract, eval, monitor, review gate, corpus, policy, or static check.
Rendering  = current implementation: code, config, prompt, schema, infra, UI, pipeline, runbook, or generated artifact.
Evidence   = timestamped Oracle output. Evidence can age, drift, and invalidate a Rendering.
```

Rule:

```text
No meaningful Rendering change until Claim, Boundary, and minimum Oracle are clear enough for the risk.
```

Slow layers need stronger Oracles and provenance: auth, permissions, money, ledgers, audit, privacy, migrations, durable data, public APIs, core user workflows.

## Navigate first

1. Inspect request plus high-signal repo context: `.phoenix/graph.md` if present, docs, ADRs, tests/evals, current diff, relevant code, production evidence if provided.
   - Complete when active object and missing edge can be named, or when unknowns are explicitly listed.
2. Classify active object: Claim, Boundary, Oracle, Rendering, or portfolio/product strategy.
   - Complete when one primary object is chosen; secondary objects may be listed.
3. Name graph condition and operation:
   - `unframed_intent` → frame
   - `claim_without_owner`, `boundary_unclear`, `wrong_mutation_authority`, `unsafe_ui_change`, `slow_layer_change` → bound
   - `claim_without_oracle`, `oracle_failed`, `production_drift`, `release_gate_missing` → prove
   - `bounded_change`, `stale_rendering`, `regeneration`, `rollback`, `delete_rendering` → render
   - `conceptual_mass`, `duplicate_concepts`, `hidden_claims`, `skill_sprawl`, `legacy_sediment` → compact
   - Complete when one next branch is selected.
4. Read the branch file before continuing:
   - `FRAME.md` for claims, strategy, legacy product truth, ambiguity.
   - `BOUND.md` for ownership, seams, pace, grain, UI conservation.
   - `PROVE.md` for tests, evals, monitors, evidence, gates.
   - `RENDER.md` for implementation, regeneration, deletion, rollback.
   - `COMPACT.md` for deletion, review, skill refinement, reducing conceptual mass.
   - Read `CARDS.md` only when creating/updating `.phoenix/graph.md`.
   - Complete when the branch completion criteria are met.
5. Record durable memory only when it affects future safety or decisions.
   - Complete when `.phoenix/graph.md` is updated, or skipped with reason: `tiny`, `exploratory`, `already covered`, or `not durable`.

## Existing skill routes

Use existing skills for craft; Phoenix supplies memory and gates.

```text
strategy / fuzzy product       → grilling, dev-loop-design, domain-modeling
legacy archaeology             → project-catchup, repo-audit
seams / deep interfaces        → codebase-design
tests / evals                  → tdd
implementation loop            → dev-loop-build
overengineering / deletion     → ponytail, ponytail-review, ponytail-audit
skill/process refinement       → writing-great-skills
```

## Output

```text
Phoenix navigation

Active object:
- Type:
- Name/id:
- Statement:

Graph condition:
- ...

Missing or weak edge:
- ...

Operation:
- frame | bound | prove | render | compact

Branch loaded:
- ...

Existing skill to pair:
- ...

Can Rendering change proceed?
- yes | no | limited
- Reason:

Graph update:
- update | skip: <reason>

Next action:
- ...
```
