# Phoenix Compact

Compact reduces conceptual mass: fewer durable things for humans and agents to remember. It is not line-count golf.

Use for code review, refactoring, cleanup, duplicate concepts, stale renderings, weird special cases, legacy sediment, overengineering, or refining agent skills/process files.

## Conceptual mass

Mass includes Claims, Boundaries, Oracles, Renderings, interfaces, schemas, modes, flags, states, special cases, terms, dependencies, invariants, configuration surfaces, manual procedures, exception paths, and skill rules.

## Steps

1. Name target and current mass.
   - Target can be graph, diff, component, subsystem, PR, old code, test suite, docs, or skills.
   - Complete when added/changed concepts are listed, not just changed files.

2. Find duplication and sediment.
   - Duplicate: same meaning in multiple places.
   - Sediment: stale layer kept because deletion feels risky.
   - Sprawl: too much live material in one file/Boundary/skill path.
   - Complete when every overlapping Claim/Boundary/Oracle/Rendering/term/rule is merged, retired, or justified.

3. Run hidden-Claim archaeology before deletion.
   - Check strange conditionals, manual overrides, timeouts, retries, backoffs, fallbacks, normalization, validation, compatibility shims, feature flags, migration hacks, incident comments, TODOs with history, non-obvious ordering, silent failure handling.
   - Complete when every deleted or simplified scar has Claim/Oracle coverage or explicit deprecation reason.

4. Choose compaction moves.
   - `delete`: remove thing that no longer earns keep.
   - `merge`: combine duplicates.
   - `lift`: extract hidden Claim from Rendering.
   - `flatten`: remove shallow abstraction.
   - `move`: put behavior under real owner.
   - `narrow`: shrink interface/responsibility.
   - `split`: separate unrelated Claims or high blast radius.
   - `retire`: mark stale truth deprecated, remove after coverage.
   - `rename`: align vocabulary.
   - Complete when each move lowers conceptual mass without losing live Claims.

5. Require Oracle coverage for deletion.
   - If old Rendering is only proof of behavior, do not delete yet; route to `PROVE.md` or `FRAME.md`.
   - Complete when deletion is boring: either Oracles protect the behavior or behavior is intentionally no longer desired.

6. Compact skill/process files when target is team operation.
   - Use `writing-great-skills`.
   - Prefer one model-invoked router plus branch files when many triggers share one process.
   - Put shared templates/reference behind context pointers.
   - Add completion criteria to steps.
   - Remove repeated model blocks, stale skill names, no-ops, and prose that does not change agent behavior.
   - Complete when two agents given same task would take same process path without human reminders.

7. State residual risk.
   - Complete when remaining uncertainty is named and routed: frame, bound, prove, render, or none.

## Pair with existing skills

- Use `ponytail`, `ponytail-review`, or `ponytail-audit` for overengineering and deletion pressure.
- Use `codebase-design` if compaction reveals bad seams.
- Use `writing-great-skills` for skills and process files.
- Use `phoenix-prove` before risky deletion.

## Review checks

```text
Did this add a Claim without recording it?
Did this change a Boundary without naming it?
Did this create behavior without an Oracle?
Did this introduce duplicate concepts?
Did this move logic into the wrong owner?
Did this make a slow layer volatile?
Did this force users to absorb internal churn?
Can a simpler move delete whole branches, modes, helpers, or concepts?
```

## Output

```text
Phoenix compact

Target:
- ...

Concepts added:
- ...

Concepts removed:
- ...

Duplicate/sediment/sprawl found:
- ...

Hidden Claims discovered:
- ...

Compaction moves:
- delete | merge | lift | flatten | move | narrow | split | retire | rename

Oracle coverage before deletion:
- ...

Boundary changes:
- ...

Graph update:
- update | skip: <reason>

Residual risk:
- ...

Next branch:
- none | frame | bound | prove | render
```
