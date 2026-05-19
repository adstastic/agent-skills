---
name: dev-loop-build
description: Tactical TDD dev-loop workflow for an agreed current slice in any repo. Use when implementing, testing, verifying, committing, or addressing review comments for a small vertical change.
---

# Dev Loop: Build

Use when slice is known and implementation should proceed tactically.

This skill is repo-agnostic. Follow the repo's existing workflow if present. If the repo lacks dev-loop artifacts/check commands, propose a minimal setup and ask before adding process files.

If scope/design is unclear, stop and use `/skill:dev-loop-design` first.

## Interaction contract

- Be interactive by default; do not silently expand scope.
- Before edits, state the tiny plan unless user asked for an obvious mechanical change.
- When user gives review comments, answer each comment first. Do not edit until user explicitly says go/apply/do it.
- After applying review fixes, do not commit until user approves unless they explicitly asked to commit.
- Push only when user asks.

## Flow

### 1. Catch up narrowly

Read enough to avoid stale context:

```bash
git status --short --branch
git log --oneline --decorate -n 8
```

Read repo-specific sources of truth when present:

- working agreements: `AGENTS.md`, `CLAUDE.md`, similar
- plan/status docs: `PLAN.md`, issue/milestone docs, `feature_list.json`, etc.
- relevant source/tests
- recent dirty diff

If no clear check command exists, infer likely focused checks from tooling and propose a canonical check before adding scripts. Look at README, Makefile, Justfile, package.json, pyproject.toml, Cargo.toml, go.mod, xcodeproj/Package.swift, and CI config.

### 2. Tiny plan

State in chat:

- current slice/goal
- red test to write
- smallest green implementation
- focused check and broader check
- manual/e2e verification if needed
- non-goals

Wait for agreement when the user is discussing tradeoffs or asks for plan/review-first.

### 3. TDD red/green

1. Mark feature/status `in_progress` only if repo has such tracking and user agrees for this slice.
2. Write failing test first.
3. Run focused test and show failure.
4. Implement minimum code.
5. Run focused test and show pass.
6. Run relevant broader checks.
7. Run the repo's full check before passing feature or commit.

Testing ladder:

- unit/config/policy tests for local behavior
- deterministic integration/e2e for system boundaries
- real sandbox/container tests when repo requires them
- opt-in live model/provider eval for model ability
- actual external channels/services only as release-gate/manual smoke unless repo explicitly supports autonomous test accounts

### 4. Verify and read code

Before commit:

```bash
git diff --stat
git diff -- <relevant files>
```

Read changed code, not just plan. Check for:

- unrelated changes
- source-of-truth drift between docs/status files
- raw-content/secrets leakage
- over-broad abstraction
- tests proving behavior rather than implementation trivia

### 5. Evidence/docs

When feature state changes, update only the repo's agreed sources of truth. If none exist, summarize evidence in chat and ask before adding docs.

Possible artifact roles:

- current plan/status narrative
- durable decision log
- future roadmap/deferred work
- invariant/safety rules
- machine-readable feature/status list

### 6. Stage-for-review checkpoint

When tests pass and change is ready for review, stage the coherent baseline but do not commit unless user asks:

```bash
git add <coherent files>
git status --short
```

User can review the baseline with:

```bash
/revdiff --staged
```

Keep commits atomic, but prefer staged review over checkpoint commits unless user wants a committed review target.

## Review loop

Default staged review flow:

1. Agent stages implementation baseline after checks pass.
2. User reviews baseline with `/revdiff --staged`.
3. Agent replies to every annotation first; no edits unless user says go.
4. After go, agent applies fixes but leaves them unstaged.
5. User reviews only the fix delta with plain `/revdiff` because unstaged changes are shown relative to staged baseline.
6. User can still rerun `/revdiff --staged` any time to see original staged baseline.
7. After approval, agent stages fixes and commits.

Important discipline:

- Do not `git add` review fixes until user approves.
- Before asking user to review fix delta, confirm `git diff --name-only` is non-empty.
- If a review fix creates a new file, use `git add -N <file>` so plain `/revdiff` can see it without staging content.
- If user wants a committed target instead, commit checkpoint and use `/revdiff HEAD^1`; squash/amend later if desired.

## End checklist

- focused checks run
- repo full check run when feature state changed
- feature evidence recorded if repo has tracking
- worktree clean or clearly described
- next slice stated
