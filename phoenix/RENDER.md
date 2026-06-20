# Phoenix Render

Render changes the implementation only after Claim, Boundary, and Oracle are clear enough. Rendering includes code, prompts, schemas, migrations, configs, infra, UI, pipelines, generated artifacts, and runbooks.

Use for implementation, regeneration, replacement, rollback, deletion, migrations, config/infra changes, or implementing Oracles.

## Steps

1. Preflight.
   - State: active Claim, owning Boundary, Rendering to change, Oracle gates, pace layer, blast radius, rollback path, hidden Claims considered.
   - Complete when unknowns are either resolved by `FRAME.md`/`BOUND.md`/`PROVE.md` or explicitly accepted with a narrow scope.

2. Inspect current Rendering.
   - For mature code, check scar tissue before deletion or cleanup: retries, timeouts, fallbacks, validations, feature flags, compatibility shims, migration hacks, non-obvious ordering.
   - Complete when every touched scar-tissue behavior is covered by Claim/Oracle, kept intentionally, or dropped with reason.

3. Choose Rendering mode.
   - `patch`: local edit.
   - `regenerate`: replace bounded Rendering from Claim/Boundary/Oracle.
   - `add`: new Rendering behind existing Boundary.
   - `wrap`: compatibility layer around legacy Rendering.
   - `strangle`: route traffic gradually to new Rendering.
   - `rollback`: restore previous Rendering.
   - `delete`: remove Rendering after Claims and Oracles live elsewhere.
   - Prefer regeneration for bounded fast layers with good Oracles. Prefer patch/wrap/strangle for slow layers or mature code.
   - Complete when mode matches pace, blast radius, and rollback.

4. Make smallest safe change.
   - Use `tdd` or `dev-loop-build` when code changes are non-trivial.
   - Do not let generated code define architecture accidentally.
   - Complete when implementation is changed only within named Boundary or any Boundary crossing is recorded.

5. Run Oracles and record Evidence.
   - Run relevant tests/evals/static checks/benchmarks.
   - For blocked or unavailable Oracles, state exact blocker and risk.
   - Complete when Oracle results are recorded with pass/fail, or rollout is blocked.

6. Update provenance.
   - Record why changed, Claim changed, Oracles run, Evidence, alternatives rejected, hidden Claims found, human review if needed.
   - Complete when `.phoenix/graph.md` or other durable record is updated, or skipped with reason.

7. Compact after meaningful implementation.
   - If concepts/helpers/modes/branches were added, read `COMPACT.md`.

## Slow-layer caution

For auth, permissions, tenant isolation, billing, money, ledgers, audit/provenance, durable data, migrations, public APIs, security/privacy, external side effects, or core user workflows:

```text
small patches > strangler > wholesale rewrite
strong Oracles > plausible code
human review > autonomous acceptance
```

## Pair with existing skills

- Use `dev-loop-build` for tactical implementation.
- Use `tdd` for behavior-first loops.
- Use `codebase-design` if implementation reveals wrong Boundary.
- Use `ponytail`/`ponytail-review` after implementation if mass grew.

## Output

```text
Phoenix render

Preflight:
- Claim:
- Boundary:
- Rendering:
- Oracles:
- Pace:
- Rollback:

Mode:
- patch | regenerate | add | wrap | strangle | rollback | delete

Implementation summary:
- ...

Oracle results / Evidence:
- ...

Provenance:
- ...

Graph update:
- update | skip: <reason>

Follow-up:
- none | prove | bound | compact
```
