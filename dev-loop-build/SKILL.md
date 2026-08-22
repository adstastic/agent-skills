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
git diff --cached --binary | git hash-object --stdin
git log --oneline --decorate -n 8
```

Read repo instructions, active spec/issue, relevant source/tests, recent dirty diff, and canonical checks. Record pre-existing staged and unstaged changes; do not overwrite, stage, or commit work you do not own. Snapshot both staged paths and cached-diff hash so every later commit can prove index contents stayed unchanged.

If `.phoenix/ACTIVE.md` exists, read it before acting, then verify every claim against current Git state and runnable evidence. Resume it only when it describes this task. If it belongs to another active task, stop and use a separate worktree; one worktree has one active autonomous dev loop.

If active file is missing but `git show HEAD:.phoenix/ACTIVE.md` succeeds, inspect Git status. A working-tree deletion without a completed outcome commit means finalization was interrupted: restore checkpoint from `HEAD`, reconcile state, and resume.

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

### 4. Maintain compaction-safe execution state

Before editing code, create `.phoenix/ACTIVE.md`. This tracked checkpoint is live execution memory, not durable product documentation. One worktree gets one active checkpoint.

Keep it concise:

```markdown
# Active Dev Loop
Task:
Goal:
Success criteria:
Must remain true / non-goals:
Current phase:
Completed evidence:
Current hypothesis:
Next action:
Owned files:
Pre-existing work to preserve:
Review findings / decisions pending:
```

Commit initial checkpoint by itself with `git commit --only -- .phoenix/ACTIVE.md`; for a new file, add it first. Use an outcome-neutral message such as `chore(dev-loop): checkpoint <task>`. Path-limited commit must exclude every pre-existing staged path.

Refresh and commit checkpoint alone after every material transition: calibrated goal, meaningful red/green result, changed hypothesis, completed check, review findings, applied fix, or newly discovered blocker. Record exact commands/results compactly; never copy secrets, large logs, or replace source-of-truth specs. After each checkpoint commit, verify both pre-existing staged paths and cached-diff hash remain unchanged.

After compaction, session resume, handoff, or any uncertainty about active state, read `.phoenix/ACTIVE.md` first and reconcile it with `git status`, diff, tests, and current repo state. Evidence wins over stale checkpoint text. Continue from recorded next action only after reconciliation.

When blocked, interrupted, or waiting on a user decision, update and commit checkpoint before stopping. Final outcome commit deletes `.phoenix/ACTIVE.md`; checkpoint remains recoverable in Git history while no stale active file remains at HEAD.

### 5. TDD vertical slices

Load and follow `tdd`:

1. Write one behavior-focused failing test at the agreed seam, using expected values from the spec, a worked example, or another independent source of truth.
2. Run it and prove it fails for the intended missing behavior—not syntax, setup, fixture, or unrelated failure.
3. Implement only enough to pass.
4. Run focused test and capture pass.
5. Repeat one vertical tracer bullet at a time.

Fix root cause in the shared path after tracing every caller. Preserve unrelated code and comments. No drive-by cleanup, speculative flexibility, or implementation-coupled tests. Remove dead code made obsolete by the change.

Use real feedback loops available to the repo—compiler, browser/device tooling, sandbox, container, or provider eval—when success criteria require them.

### 6. Verify before review

Run focused checks, relevant integration/e2e checks, then the repo's full check. Inspect actual changes:

```bash
git diff --stat
git diff -- <relevant files>
```

Read changed code, not just command output. Check for unrelated edits, leaked secrets/raw content, stale docs/status, missed callers, dead code, and success criteria not exercised by an Oracle.

### 7. Launch adversarial review

Load and apply `review-baseline`. For non-mechanical changes, launch applicable reviewers as independent subagents in one parallel batch. Require each reviewer to load `review-baseline` before its specialized review skills. Give each the agreed goal/spec, diff command, commit or worktree baseline, relevant repo instructions, and exact role. Require concise blocker-first findings with file/line evidence and explicit uncertainty.

**Default reviewers**

- **Behavior** — use Matt Pocock's `code-review` Spec axis: missing or partial requirements, wrong behavior, unsupported scope, and tests that fail to prove the outcome.
- **Structure** — combine repo standards, `torvalds-doctrine`, and `ponytail-review`: wrong data shape, special cases, broad churn, compatibility breaks, hand-wavy claims, speculative abstractions, duplicated platform/stdlib behavior, dead flexibility, and code that can disappear. Never delete correctness, security, accessibility, or required error handling.

**Risk-triggered reviewers**

- **Thermo correctness/security** — load `thermo-nuclear-review` when work touches trust boundaries, auth, persistence, concurrency, feature gates, external contracts, shared behavior, or has medium/high blast radius.
- **Thermo code quality** — load `thermo-nuclear-code-quality-review` for structural changes, new modules/seams, large or branch-heavy diffs, or meaningful architecture movement.

Skip subagents for a truly mechanical change with an obvious Oracle and tiny diff. If subagent tooling is unavailable, run one combined self-review, report reduced assurance, and never claim independent or parallel review occurred. If a named skill is unavailable, use the bounded role above rather than blocking.

### 8. Triage, fix, and loop

For every finding:

1. verify it against source and evidence
2. classify it as valid, false positive, or decision-required
3. fix valid findings at root cause
4. rerun focused and full checks affected by the fix
5. rerun only review axes whose evidence changed

Do not blindly average conflicting reviewers. When Thermo asks for structure and Ponytail asks for deletion, choose the fewest concepts that satisfy the Claim, Oracle, repo standards, and real variation in the codebase.

Continue until success criteria pass and no verified blocking finding remains. Surface decision-required findings to the user with evidence; do not smuggle scope or slow-Boundary choices into a review fix.

### 9. Record evidence and commit

Update only existing agreed sources of truth when a durable Claim, Boundary, Decision, Evidence item, or feature state changed. Do not create status/process docs merely to narrate work.

Audit final state:

```bash
git diff --stat
git diff --cached --stat
git diff -- <relevant files>
git status --short
```

Update and commit final checkpoint alone, then delete `.phoenix/ACTIVE.md`. Create one outcome-focused commit containing only owned implementation paths plus checkpoint deletion, using path-limited commit semantics so pre-existing staged paths remain untouched. Add new owned files before committing. If outcome commit fails or is interrupted, restore checkpoint from `HEAD` immediately. Inspect exact commit diff and verify original staged paths and cached-diff hash before considering work complete.

If owned edits overlap pre-existing work or cannot be isolated safely, keep and commit checkpoint, leave implementation uncommitted, and report exact state instead of capturing someone else's changes. Checkpoint and outcome commits require the explicit commit permission defined by this skill.

Confirm final Git state and absence of `.phoenix/ACTIVE.md` at HEAD. Never push unless the user asks.

## End report

Report briefly:

- outcome and commit SHA, or why no commit was safe
- focused/full checks and manual/e2e evidence
- adversarial reviewers run and verified findings fixed
- remaining assumptions, risks, or decision-required items
- next slice, if known
