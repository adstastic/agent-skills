---
name: phoenix-grilling
description: Proportionate, evidence-first grilling that extracts an executable goal, success criteria, invariants, and unresolved decisions without forcing domain-model work. Use when a software task or design is too unclear to plan, test, or implement safely.
compatibility: Can use bounded subagents for factual research when the harness provides them.
---

# Phoenix Grilling

Use when work is blocked by unclear intent, success criteria, constraints, or consequential assumptions. Goal is readiness for the next decision or implementation slice, not exhaustive understanding.

This skill is Phoenix-aware: calibrate questioning depth to cost of being wrong × cost of reversal. A reversible local edit gets a short clarification; schemas, public interfaces, security boundaries, migrations, and systems of record get deeper interrogation.

## Principles

- Inspect repo evidence before asking the user. Never ask what code, tests, docs, history, or telemetry can answer.
- Ask neutral questions one at a time. Do not volunteer answers, options, hints, examples, recommendations, or leading framing before the user answers.
- After each answer, briefly reflect only what it implies, identify gaps or contradictions, then ask the next question.
- Surface assumptions, contradictions, and negative space without resolving them on the user's behalf.
- Give options or a recommendation only when the user explicitly asks for help, options, or a recommendation. State clearly when switching from interviewer to adviser.
- Do not force domain modeling. Sharpen terminology only when ambiguity blocks behavior, ownership, or verification; update durable docs only when the repo already uses them and the user agrees.
- Stop as soon as work is executable. Grilling reversible details after success criteria are clear is process theater.

## Flow

### 1. Gather evidence

Read only high-signal sources: relevant code/tests, repo instructions, current diff, recent history, active spec or issue, and existing Phoenix state (`SYSTEM.md`, `.phoenix/`, ADRs, contracts, or eval docs).

### 2. Establish current understanding

State only facts already supplied by the user or verified from repo evidence:

- observed problem or stated outcome
- explicit scope and non-goals
- known constraints and invariants
- unresolved assumptions
- any already-agreed Oracle

Do not fill gaps with a proposed answer. Ask one neutral question about the highest-impact unresolved gap.

### 3. Close only blocking gaps

Choose the smallest unresolved question set from:

- **Outcome:** what observable behavior changes, and for whom?
- **Examples:** typical case, nasty edge, and must-reject case when useful.
- **Negative space:** what must remain unchanged or must never happen?
- **Oracle:** what evidence would make us accept the result?
- **Boundary:** who owns the behavior or mutation, and what contract must remain stable?
- **Operational envelope:** relevant scale, latency, failure, compatibility, migration, or rollback constraint.
- **Tradeoff:** which real constraint decides between viable options?

Research factual gaps with a bounded subagent instead of asking the user when subagent tooling exists; otherwise inspect the evidence directly. Never delegate the user's side of a product or value decision.

### 4. Expose decisions without answering them

For each unresolved consequential choice:

1. state the decision neutrally
2. state only verified constraints that bear on it
3. ask the user what they think
4. reflect implications and contradictions after they answer

Do not present candidate answers, rank options, or recommend a choice unless the user explicitly asks. A clear user request may already resolve the choice; do not re-litigate it.

### 5. Readiness check

Stop when these are clear enough for risk:

```markdown
Goal:
Success criteria:
Must remain true:
Non-goals:
Consequential assumptions:
Smallest Oracle:
Unresolved decision: none | <decision requiring user>
```

Keep this in chat by default. Record it only in an existing agreed source of truth.

## Routing

- Executable small slice → load `dev-loop-build` for autonomous work or `dev-loop-pair` for tight human review.
- Architecture, slice order, or tradeoffs still unclear → load `dev-loop-design`.
- Domain language itself is blocking or durable terminology must change → load `domain-modeling` after this pragmatic pass.

When naming another skill, read and follow its full `SKILL.md`; embedded `/skill:*` text is not a recursive Pi command.
