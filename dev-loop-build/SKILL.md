---
name: dev-loop-build
description: Autonomous TDD dev-loop for an agreed vertical slice. Use only when the user explicitly requests autonomous execution or invokes this skill; calibrates success criteria, implements to runnable Oracles, runs adversarial review, fixes verified findings, and creates an atomic local commit.
compatibility: Full parallel review requires an agent harness with subagent tooling.
---

# Dev Loop: Build

Use when a small vertical slice is agreed and the user wants autonomous implementation through verified local commit. Use `/skill:dev-loop-pair` instead when the user wants staged human review between implementation and fixes.

This skill is repo-agnostic. Follow repo instructions, existing sources of truth, and canonical check commands. Never push, deploy, publish, or perform another public action without explicit user approval.

## Autonomy contract

- State a tiny inline plan, then proceed. Do not wait for routine implementation approval.
- Work from observable success criteria, not a detailed guessed implementation.
- Auto-loading this skill or a generic request to work autonomously does not grant commit permission. Create a commit only when the user explicitly invokes `/skill:dev-loop-build` with its documented commit behavior or explicitly asks for a commit in the current request.
- If goal, non-goals, test seam, Oracle, or consequential behavior is unclear, load and follow `phoenix-grilling`. If uncertainty is architectural or changes slice scope, stop and route to `dev-loop-design`.
- Ask only for genuine product choices, unresolved slow-Boundary tradeoffs, destructive/external actions, or missing access. Do not ask the user to resolve facts available in the repo.
- Persist through recoverable failures. When evidence disproves a hypothesis, change it; do not repeat the same failed approach.
- Main agent owns the result. Subagent output is untrusted until verified against code, diff, tests, or primary evidence.
- When this workflow names another skill, read and follow its full `SKILL.md`; embedded `/skill:*` text is not a recursive Pi command.

## Flow

### 1. Catch up and protect the worktree

```bash
git status --short --branch
git diff --cached --stat
git log --oneline --decorate -n 8
```

Read repo instructions, active spec/issue, relevant source/tests, recent dirty diff, and canonical checks. Record pre-existing staged and unstaged changes; do not overwrite, stage, or commit work you do not own. If the index is already non-empty, autonomous commit is unsafe unless ownership can be isolated without changing that index.

If no clear check command exists, infer focused checks from existing tooling. Ask before adding process files or new canonical scripts.

### 2. Calibrate goal and risk

Confirm from agreed context:

- goal and observable success criteria
- non-goals and must-remain-true behavior
- public test seam and smallest failing Oracle
- expected touchpoints and blast radius

For non-trivial work, load and apply `phoenix-architecture` for Claim, Boundary, Oracle, Rendering, pace, recovery, rollback, and durable state. When questioning the user, `phoenix-grilling` overrides Phoenix Architecture's grilling guidance: remain neutral and do not volunteer candidate answers or recommendations unless the user asks.

A seam explicitly approved by the user in the design/spec counts as confirmed for `tdd`; agent-authored text alone does not. If no safe seam is established, load `phoenix-grilling`; do not invent a consequential public interface autonomously.

### 3. State tiny plan and proceed

State:

1. red test/Oracle
2. smallest green implementation
3. focused and full checks
4. risk-triggered review agents
5. non-goals

For algorithmic or optimization work, first prefer an obvious reference implementation likely to be correct. Optimize only after its Oracle passes, preserving the same behavior checks.

### 4. TDD vertical slices

Load and follow `tdd`:

1. Write one behavior-focused failing test at the agreed seam, using expected values from the spec, a worked example, or another independent source of truth.
2. Run it and prove it fails for the intended missing behavior—not syntax, setup, fixture, or unrelated failure.
3. Implement only enough to pass.
4. Run focused test and capture pass.
5. Repeat one vertical tracer bullet at a time.

Fix root cause in the shared path after tracing every caller. Preserve unrelated code and comments. No drive-by cleanup, speculative flexibility, or implementation-coupled tests. Remove dead code made obsolete by the change.

Use real feedback loops available to the repo—compiler, browser/device tooling, sandbox, container, or provider eval—when success criteria require them.

### 5. Verify before review

Run focused checks, relevant integration/e2e checks, then the repo's full check. Inspect actual changes:

```bash
git diff --stat
git diff -- <relevant files>
```

Read changed code, not just command output. Check for unrelated edits, leaked secrets/raw content, stale docs/status, missed callers, dead code, and success criteria not exercised by an Oracle.

### 6. Launch adversarial review

For non-mechanical changes, launch applicable reviewers as independent subagents in one parallel batch. Give each the agreed goal/spec, diff command, commit or worktree baseline, relevant repo instructions, and exact role. Require concise blocker-first findings with file/line evidence and explicit uncertainty.

**Default reviewers**

- **Behavior** — use Matt Pocock's `code-review` Spec axis: missing or partial requirements, wrong behavior, unsupported scope, and tests that fail to prove the outcome.
- **Structure** — combine repo standards, `torvalds-doctrine`, and `ponytail-review`: wrong data shape, special cases, broad churn, compatibility breaks, hand-wavy claims, speculative abstractions, duplicated platform/stdlib behavior, dead flexibility, and code that can disappear. Never delete correctness, security, accessibility, or required error handling.

**Risk-triggered reviewers**

- **Thermo correctness/security** — load `thermo-nuclear-review` when work touches trust boundaries, auth, persistence, concurrency, feature gates, external contracts, shared behavior, or has medium/high blast radius.
- **Thermo code quality** — load `thermo-nuclear-code-quality-review` for structural changes, new modules/seams, large or branch-heavy diffs, or meaningful architecture movement.

Skip subagents for a truly mechanical change with an obvious Oracle and tiny diff. If subagent tooling is unavailable, run one combined self-review, report reduced assurance, and never claim independent or parallel review occurred. If a named skill is unavailable, use the bounded role above rather than blocking.

### 7. Triage, fix, and loop

For every finding:

1. verify it against source and evidence
2. classify it as valid, false positive, or decision-required
3. fix valid findings at root cause
4. rerun focused and full checks affected by the fix
5. rerun only review axes whose evidence changed

Do not blindly average conflicting reviewers. When Thermo asks for structure and Ponytail asks for deletion, choose the fewest concepts that satisfy the Claim, Oracle, repo standards, and real variation in the codebase.

Continue until success criteria pass and no verified blocking finding remains. Surface decision-required findings to the user with evidence; do not smuggle scope or slow-Boundary choices into a review fix.

### 8. Record evidence and commit

Update only existing agreed sources of truth when a durable Claim, Boundary, Decision, Evidence item, or feature state changed. Do not create status/process docs merely to narrate work.

Audit final state:

```bash
git diff --stat
git diff --cached --stat
git diff -- <relevant files>
git status --short
```

Stage only coherent files owned by this slice. Create one atomic local commit with a concise outcome-focused message only when commit permission is explicit and the index was clean at start. If the index had pre-existing entries or any edits cannot be separated safely, leave work uncommitted and report exact state instead of capturing someone else's changes.

Never push unless the user asks.

## End report

Report briefly:

- outcome and commit SHA, or why no commit was safe
- focused/full checks and manual/e2e evidence
- adversarial reviewers run and verified findings fixed
- remaining assumptions, risks, or decision-required items
- next slice, if known
