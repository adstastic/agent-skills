# Build

Change is replacement by default: never upgrade code in place if you can regenerate it instead. An in-place edit is a drift event — it entangles intent with change history, and enough of them manufacture legacy in an afternoon.

## Steps

1. **Preflight.** Name what you're touching: its spec, its boundary, its pace layer, the oracle that will judge the result, the rollback path. A component you can't regenerate from spec plus evaluations isn't well-defined enough to exist — write the missing spec (`DESIGN.md`) or evals (`VERIFY.md`) first.
   Complete when oracle and rollback are named, before generating anything.

2. **Read the scar tissue.** Mature code remembers what the organization forgot. Before replacing or "cleaning up", interrogate every odd construct — the retry count, the 17-second timeout, the conditional that looks wrong — asking: what does this implementation know that we've forgotten? A human may still remember the story — ask them (`GRILL.md`) before excavating alone. A weird construct usually encodes a production lesson, not accidental mess; cleanliness and correctness are different properties, and clean code that forgets why it exists is a more elegant way to fail.
   Complete when every odd construct in touched code is lifted into spec/evals, kept deliberately, or dropped with a recorded reason — never silently normalized away.

3. **Choose the change mode by pace.**
   - Fast layer: regenerate the whole component from spec. When cheap, generate more than one candidate and let evaluations select — selection over line-by-line debugging.
   - Slow layer: smallest reviewable change — patch, wrap, or strangle incrementally. Wholesale regeneration only with property tests, human review, and staged rollout.
   - Legacy without a spec: extraction first — you cannot regenerate what you have not defined. Follow `TEND.md` step 5 before any replacement.

4. **Fit the architecture.** New code uses the existing interaction models, respects mutation ownership, and lands inside its boundary. Generated code must not invent architecture — no new layers, patterns, or dependencies the design didn't call for. Prefer explicit and boring: repetition that stays comprehensible beats an abstraction hierarchy that doesn't. Fix root causes instead of adding special cases; everything has exactly one place to go, so duplication is obvious and special cases have nowhere to hide.

5. **Run the oracle.** Evals green or it doesn't ship. A failing eval means fix the implementation, never the eval — unless intent genuinely changed, which is a spec change to record.

6. **Close out.** Record the reason (`RECORD.md`). If the change added concepts — new modes, flags, helpers, dependencies — compact while context is hot (`TEND.md`).

## Size discipline

Keep components "this big": rewritable in about a day. When one outgrows that, split it at a seam or replace it with something simpler — don't keep growing it. Small enough to trivially rewrite is what makes every other rule cheap to follow.

## Manual edits

Hand-editing generated code is an escape hatch, not a method — it breaks the chain from reason to code, like patching a binary instead of recompiling. When unavoidable, record the edit and its reason as provenance debt, and backfill the spec so the next regeneration includes it.
