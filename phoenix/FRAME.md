# Phoenix Frame

Frame turns fuzzy intent, legacy behavior, incidents, docs, and old code into Claims.

Use when the current problem is unclear product truth, strategy, missing requirements, bugs with ambiguous correctness, old code that remembers something, or future direction for legacy products.

## Steps

1. Gather sources.
   - Include user request, product docs, ADRs, `CONTEXT.md`, tests/evals, code, incidents, support notes, metrics, and production observations when available.
   - For legacy apps, use `project-catchup` or `repo-audit` first if repo context is unknown.
   - Complete when each available high-signal source is listed, or explicitly marked unavailable.

2. Extract candidate Claims.
   - Types: behavior, invariant, constraint, assumption, non-goal, operational, human-protocol.
   - Look for: must, never, only if, source of truth, canonical, allowed, forbidden, safe, auditable, fast enough, cheap enough, user expects.
   - Complete when every important user/business/system statement is captured as one short falsifiable or inspectable sentence.

3. Classify durability.
   - `exploratory`: useful now; should not constrain architecture yet.
   - `durable`: should survive Rendering replacement.
   - `slow_layer`: hard to reverse; needs strong Boundary and Oracle.
   - `deprecated`: old truth replaced or invalidated.
   - Complete when every candidate Claim has type, source, durability, and any ambiguity/non-goal named.

4. Lift hidden Claims before cleanup or rewrite.
   - Inspect weird conditionals, retries, timeouts, backoffs, fallbacks, validations, feature flags, compatibility shims, migration hacks, manual overrides, incident comments, and non-obvious ordering.
   - Ask: what production lesson might this encode? still needed? covered by an Oracle? should it become Claim, non-goal, or deprecated Rendering?
   - Complete when every touched scar-tissue behavior is preserved as Claim/non-goal/deprecated, or rejected with reason.

5. Decide next edge.
   - Claim has no owner → `BOUND.md`.
   - Claim has no check → `PROVE.md`.
   - Claim/Boundary/Oracle clear enough → `RENDER.md`.
   - Many duplicate or obsolete Claims → `COMPACT.md`.
   - Complete when next edge is named.

## Pair with existing skills

- Use `grilling` when user intent or tradeoff is fuzzy.
- Use `dev-loop-design` for strategic feature/product planning.
- Use `domain-modeling` when vocabulary is unstable.
- Use `project-catchup` or `repo-audit` for legacy archaeology.

## Output

```text
Phoenix frame

Intent interpreted as:
- ...

Claims created/revised:
- CLAIM-...: ...

Deprecated or rejected claims:
- ...

Ambiguities:
- ...

Non-goals:
- ...

Hidden claims lifted:
- ...

Candidate boundaries:
- ...

Candidate oracles:
- ...

Graph update:
- update | skip: <reason>

Next branch:
- bound | prove | render | compact
```
