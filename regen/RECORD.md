# Record

The unit of change is a reason, not lines. Diffs record outcomes, not decisions — and between two generated implementations, a diff tells you almost nothing. Version the intent.

## Steps

1. **Record every meaningful change as a decision:** why it changed, what constraints forced it, what alternatives were rejected and why, what would make it wrong. The plan is part of the implementation, not exhaust — preserve it even when the choice turns out wrong, because it explains why the system looks the way it does.

2. **Link reason ↔ artifact.** The commit message carries the why — never a bare "refactor auth logic" — and points to the fuller record: the conversation, plan, issue, or spec change that produced it. Keep versions traceable: which spec version produced this implementation, validated by which eval suite, triggered by what. Incident investigation then reads causation ("spec v2.3, eval suite v2.1 — stale suite, triggered by the auth dependency update") instead of git blame.

3. **Keep provenance queryable.** The test: months later, "why did we stop using the Redis cache here?" is answered by the record — what broke, what was tried, what failed — not by grepping code or interviewing survivors.

4. **Allow no untraceable changes.** Every change ties to a reason and passes its evaluations before merging. Manual hot-fixes are provenance debt: record them and backfill spec and evals. The safer system is the one that doesn't allow untraceable changes at all.

## Substrate

Use the durable, pointable substrate the repo already has — ADRs, `decisions/`, spec files, linked issues, committed plans — and store reasons where the code lives. Ephemeral media (chat scrollback, unexported conversations, someone's memory) is where reasons go to die.

Completion criterion for any change: a stranger could reconstruct why the system looks like this from the record alone.
