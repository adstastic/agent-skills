---
name: regen
description: Regenerative software practice for the whole SDLC — code is disposable; specs, evaluations, boundaries, provenance, and data are the assets. Use when shaping a system or feature, grilling requirements or strategy out of the human, implementing or refactoring, writing tests/evals, committing, deploying or investigating production drift, deleting code, or modernizing a legacy system.
---

# Regen

Generation is cheap; comprehension and verification are scarce. So the implementation is not the asset — the system is: its behavior, interfaces, invariants, and data. Code is a materialized view of understanding, useful while current, disposable when stale. Work so that any implementation could burn and be regenerated from what survives — and so that this would be boring.

## What survives the fire

Durable — protect, version, invest:

- **Specification** — behavior, invariants, and operational envelope, stated precisely enough to regenerate from.
- **Evaluations** — checks that define correctness independent of any implementation.
- **Boundaries** — interfaces, contracts, schemas, and who owns each dataset's mutations.
- **Provenance** — the reasons: decisions, constraints, rejected alternatives.
- **Data** — schemas and their continuity outlast every rewrite.

Disposable — regenerate freely: implementations, file layout, internal structure, framework choices, ephemeral tests.

## Rules that bind every phase

1. **The deletion test** is the master diagnostic: "If this were deleted and regenerated from its spec, what would tell me the result is correct?" The answer must never be "the old code." If it is, knowledge is trapped in the implementation — relocate it into spec and evaluations before changing anything.
2. **No regeneration without an oracle.** If you don't know how you'd evaluate the result, regeneration is reckless; if you do, it's conservative. Name the checks before generating.
3. **Rigor relocates; it never vanishes.** Removing hand-written code demands explicit invariants and ruthless evaluation in its place. Ask of any workflow: where did the rigor go?
4. **Pace gates rigor.** Fast layers (UI internals, glue, prompts, presentation, one-off integrations) regenerate freely. Slow layers (data models, schemas, auth, money, audit, security boundaries, public APIs, migrations) demand review, property tests, staged rollout. Blast radius, recovery time, and dependency direction decide the layer — not how easy the change feels.
5. **The unit of change is a reason, not lines.** Every change records why, what was rejected, and what would make it wrong.
6. **Mass is the budget.** Judge changes by conceptual mass added — concepts, interfaces, dependencies, modes, special cases — not lines. Every kept concept must pay rent.

## Phases

Read the file for the phase you are in before proceeding. Where a step carries a "Complete when", that bound is the exit — do not move on before it holds.

| Doing | Read |
|---|---|
| Extracting requirements, opinions, data, or strategy from the human | `GRILL.md` |
| Shaping a system, feature, boundary, or spec | `DESIGN.md` |
| Implementing, fixing, refactoring, regenerating | `BUILD.md` |
| Writing or auditing tests, evals, monitors | `VERIFY.md` |
| Committing, recording decisions | `RECORD.md` |
| Deploying, operating, investigating drift | `OPERATE.md` |
| Deleting, compacting, modernizing legacy | `TEND.md` |

A task usually spans phases: design the slice → build → verify → record → ship.
