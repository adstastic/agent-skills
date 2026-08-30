---
name: dev-loop-design
description: Strategic dev-loop workflow for unclear or larger feature work. Uses proportionate grilling, bounded research subagents, competing designs, and adversarial review before vertical-slice handoff.
compatibility: Parallel research, competing designs, and independent criticism require an agent harness with subagent tooling.
---

# Dev Loop: Design

Use when scope is unclear, work is larger than one tactical slice, architecture or tradeoffs matter, or durable roadmap/decision docs may change.

Goal: produce a small, inspectable design with observable success criteria and vertical slice order. Do not implement unless the user explicitly switches to build.

This skill is repo-agnostic. Follow existing repo workflow and sources of truth. If none exist, propose minimal artifacts and ask before adding process files.

## Interaction contract

- Be collaborative, not autonomous. Subagents gather evidence and challenge proposals; they do not make product decisions for the user.
- Surface assumptions, contradictions, tradeoffs, and recommendation weaknesses. Do not silently choose consequential behavior.
- Ask before creating repo process/docs in repos not already initialized for this loop.
- When the user gives review comments or asks discussion-first, answer each comment directly and wait for explicit go before editing.
- Use bounded parallel agents, not a swarm. Main agent owns synthesis and verifies every claim used in the design.

## Flow

### 1. Discover and orient

Check current state:

```bash
git status --short --branch
git log --oneline --decorate -n 8
```

Read existing sources of truth when present:

- working agreements: `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`
- Phoenix/durable intent: `SYSTEM.md`, `.phoenix/`, ADRs, specs, contracts, evals
- plan/status: `PLAN.md`, `ROADMAP.md`, issues, milestones, feature/status files
- relevant source, tests, recent history, and dirty diff
- canonical build/check workflow: README, Makefile/Justfile, package.json, pyproject.toml, Cargo.toml, go.mod, xcodeproj/Package.swift, CI

Trust runnable evidence over stale prose. Never create parallel memory merely because filenames differ.

### 2. Calibrate with pragmatic grilling

Load and follow `phoenix-grilling` when outcome, success criteria, invariants, non-goals, Oracle, or a consequential assumption is unclear.

Keep questioning proportional to cost of being wrong × cost of reversal. When questioning the user, `phoenix-grilling` overrides Phoenix Architecture's grilling guidance: do not volunteer answers or recommendations unless asked. Do not turn every task into domain modeling. Load `domain-modeling` only when terminology, ownership, or a durable decision is itself blocking.

Before designing, establish in chat:

- desired observable outcome
- success criteria and smallest plausible Oracle
- constraints/invariants and non-goals
- consequential assumptions and unresolved decisions
- likely Boundary, blast radius, recovery, and rollback for non-trivial work

### 3. Research facts

Read high-signal local context yourself. For independent factual questions that require substantial reading, launch bounded research subagents in parallel in one batch. Apply Matt Pocock's research discipline—primary sources and cited claims—but override its default artifact behavior: return findings in chat or a temporary file unless the repo already has an approved research-note convention.

Each research brief must include:

- exact question and why it blocks a decision
- relevant paths and known facts
- primary-source requirement
- requested evidence/citations
- explicit instruction to report facts and uncertainty, not choose the design

Do not duplicate delegated research. Keep findings in chat or temporary files unless the repo already has an agreed research-note convention. If subagent tooling is unavailable, research facts directly and report reduced independence.

### 4. Sketch current and desired state

Summarize:

- current behavior and ownership
- desired behavior
- Claims, constraints, invariants, and operational envelope
- code/data touchpoints and mutation ownership
- options and honest tradeoffs
- recommended direction and its weakest point

Write durable docs only after the user agrees they belong in the repo.

### 5. Generate alternatives when choice matters

For a consequential module interface or seam, load `codebase-design` and use its Design It Twice pattern: frame shared constraints, then launch parallel subagents with deliberately different design pressures such as minimum interface, easiest common case, and maximum flexibility.

Require each option to state interface, invariants, errors, usage, hidden implementation, dependencies, Oracle, and tradeoffs. Main agent compares depth, locality, seam placement, reversibility, and fit to success criteria, then recommends one.

Skip competing agents when one obvious reversible design satisfies the constraints. If subagent tooling is unavailable, write separately labeled alternatives yourself and report that they are not independent.

### 6. Adversarial design review

Load and apply `review-baseline`. Before slice planning for non-trivial work, give the recommended design to one fresh read-only critic. Require the critic to load `review-baseline` before it evaluates the design. Ask it to attack unstated assumptions, contradictions, missing success criteria, invariant or ownership gaps, failure/compatibility/rollback holes, over-engineering, weak test seams, hidden dependencies, horizontal slices, and work not required by the goal.

Give the critic the agreed goal, design sketch, repo sources, and evidence. Require path/line evidence for code claims, explicit uncertainty, and concise blocker-first output. It must critique, not redesign from scratch.

Main agent verifies findings against source. Reject false positives. Resolve factual gaps. Present any finding that changes scope, product behavior, a slow Boundary, or an agreed tradeoff to the user rather than silently fixing the design. If subagent tooling is unavailable, perform the same review as an explicit separate pass and report the fallback.

### 7. Structure vertical slices

For each proposed slice, state:

- user-visible behavior
- expected code/data touchpoints
- primary failing Oracle and broader check
- rollback/recovery when relevant
- dependencies on earlier slices
- non-goals

Prefer end-to-end tracer bullets over horizontal layers. Start with the smallest slice that tests the riskiest assumption while delivering observable behavior.

### 8. Handoff

End with:

- agreed goal and success criteria
- recommended first slice
- red test/Oracle
- smallest green implementation
- focused and broader checks
- remaining risks and deferred work

Then offer:

- `/skill:dev-loop-build` — autonomous TDD, adversarial review, and atomic local commit
- `/skill:dev-loop-pair` — tight staged review loop with the user

## Rules

- Do not outsource synthesis or decisions to subagents.
- Do not ask the user for facts the repo or primary sources can answer.
- Preserve uncertainty; never upgrade an assumption into a fact through repetition.
- Prefer declarative success criteria over implementation instructions.
- Keep instruction and artifact budgets small. Chat first; durable docs only when knowledge must survive.
- Read code before claiming behavior. Verify subagent reports before using them.
- If the user asks to implement, stop design mode and load the chosen build skill.
- References to another skill mean read and follow that skill; embedded `/skill:*` text is not a recursive Pi command.
