# Grill

The human holds the shape; the machine fills it in. Every durable artifact — spec, invariant, pace assignment, recorded reason — is only as good as the intent extracted from the human, and unexamined intent is usually fuzzy, contradictory, or silently incomplete. Grilling is the interrogation that relocates rigor to the source: it extracts what the human knows, and — more important — gets them seeing clearly enough to give inputs they couldn't have given unprompted.

## Extraction targets

Grill for four kinds of input, and land each in its artifact:

| Target | Looks like | Lands in |
|---|---|---|
| Requirements | behavior, invariants, operational envelope, non-goals | spec (`DESIGN.md` step 1), evals (`VERIFY.md`) |
| Opinions | taste, tradeoff weights, what "good" means here | design constraints + decision records (`RECORD.md`) |
| Real-world data | incidents, actual workloads, user complaints, domain facts, the story behind scar tissue | evidence claims (`OPERATE.md`), invariants, spec constraints |
| Strategy | risk appetite, what changes next quarter, what's cathedral vs scaffolding | pace assignments (`DESIGN.md` step 3), boundary placement |

Extraction without capture is waste: every answer that matters becomes a line in a spec, an eval, a pace label, or a decision record before the conversation moves on.

## Technique

- **One question at a time.** A questionnaire gets shallow answers to everything; one sharp question gets a real answer.
- **Concrete scenario over abstract preference.** "A customer is charged twice for one order — what must be true afterward?" beats "how should we handle idempotency?". Scenarios surface invariants the human didn't know they held.
- **Chase contradictions immediately.** When two answers can't both hold, say so and make the human choose. Contradictions mark exactly the unexamined territory; resolving them is where the seeing-clearly happens.
- **Force the tradeoff.** When the human wants both sides of a tension, name the cost of each side and require a ranking. State consequences, not recommendations — don't lead.
- **Refuse delegation on durable decisions.** "Whatever you think" is acceptable on fast-layer internals, never on slow layers — schemas, money, auth, public contracts, UI. Those are the human's to own; keep asking until they decide, or record an explicit default they've accepted.
- **Reflect back as falsifiable claims.** Periodically restate understanding as assertions the human can reject: "So — refunds may exceed the original charge, never the card total. Correct?" Silence is not confirmation; get the yes.
- **Follow the flinch.** Hesitation, hedging, "probably", "I think" mark where the human hasn't seen clearly yet. Drill there: ask for the incident, the number, the example behind the hedge.

## When to stop

Grilling ends when its artifacts pass their bars, not when the questions run out. Complete when:

- The spec passes the deletion test on paper — a stranger could regenerate and judge the component from it alone.
- Every slow-layer decision has a human-owned answer or an explicit, recorded default.
- Every contradiction met is resolved or recorded as an open question with an owner.
- Every extracted fact is captured in a spec, eval, pace label, evidence claim, or decision record.

Over-grilling is real: when answers stop changing the artifacts, stop asking.
