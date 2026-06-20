# Phoenix Bound

Bound assigns Claims to ownership seams. It decides what can regenerate independently, what must stay stable, and who mutates state.

Use when seams, modules, services, products, data ownership, UI stability, pace layers, regeneration grain, or dependency direction are unclear.

## Steps

1. List active Claims.
   - Complete when every Claim being placed is named, or new Claims needed are sent back to `FRAME.md`.

2. Choose one owner Boundary per durable Claim.
   - Supporting Boundaries may exist; accountability must not be split.
   - For cross-cutting behavior, create or name a system/orchestration Boundary instead of pretending one module owns everything.
   - Complete when every durable Claim has exactly one owner Boundary.

3. Name state and mutation authority.
   - For each durable dataset or logical state, name one mutation owner.
   - If multiple Renderings write same state: split state, add coordinating Boundary, turn one writer into proposal-only, or define conflict-resolution Claim + Oracle.
   - Complete when every owned state has one writer or an explicit coordination rule.

4. Define interface and forbidden coupling.
   - Interface can be API, event, schema, CLI, workflow, prompt contract, UI protocol, or operational process.
   - Name what callers may rely on and what they must not know.
   - Complete when replacement behind the Boundary would not require neighbors to inspect internals.

5. Classify pace, blast radius, recovery.
   - Pace:
     - `very_slow`: auth, tenant isolation, money, audit, ledgers, durable data models, public APIs, irreversible migrations.
     - `slow`: core workflows, canonical schemas, identity, source-of-truth services, user-facing protocols.
     - `medium`: internal services, jobs, sync adapters, ingestion, admin surfaces.
     - `fast`: prompts, extractors, ranking, report templates, UI internals, glue, experiments, generated adapters.
   - Complete when pace is justified by blast radius, reversibility, recovery time, dependency direction, and verifiability—not technology.

6. Check regenerative grain.
   - Good grain: coherent invariants, isolated mutation, versioned interface, verifiable without booting whole system, understandable in roughly 10 minutes.
   - Too coarse: deletion feels existential, verification surface explodes.
   - Too fine: orchestration dominates, meaning scatters.
   - Complete when grain is mild-inconvenience-to-delete, not trivial dust or existential taproot.

7. Apply UI conservation when user-facing.
   - Treat users as downstream dependents.
   - Name learned workflows, language, navigation, and trust expectations.
   - Complete when internal churn is hidden behind stable human protocol, or UI migration is explicit and slow-layer.

8. Decide next edge.
   - Boundary lacks Oracle → `PROVE.md`.
   - Boundary ready for implementation → `RENDER.md`.
   - Boundary too heavy or duplicate → `COMPACT.md`.

## Pair with existing skills

- Use `codebase-design` for deep module seams and interfaces.
- Use `domain-modeling` if vocabulary/ownership terms drift.
- Use ADRs for surprising or hard-to-reverse slow-layer decisions.

## Output

```text
Phoenix bound

Claims placed:
- CLAIM-... → BOUNDARY-...

Boundary decisions:
- ...

State and mutation authority:
- ...

Public interface:
- ...

Forbidden coupling:
- ...

Pace / blast / recovery:
- ...

Regeneration policy:
- free | gated | human_reviewed | rare | never_casual

Oracles needed:
- ...

Graph update:
- update | skip: <reason>

Next branch:
- prove | render | compact
```
