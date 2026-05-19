---
name: project-catchup
description: Quickly bootstrap an agent into active project work by reading only high-signal commits, docs, current diff, tests, and code touchpoints. Use when user asks to catch up, get up to speed, initialize context, understand current project state, or prepare to start work without a full repo audit.
---

# Project Catchup

## Purpose

Fast surgical onboarding, not audit. Goal: spend small context budget to produce working context good enough to start coding.

Answer only:

- What changed recently?
- What is currently in progress?
- What is intended/expected?
- Which files and flows matter for next work?
- What should agent do next?

Do **not** deep-review whole repo, score code quality, hunt every security issue, or read every file. Defer broad analysis unless user asks.

## Default Budget

Timebox and stop when enough signal exists:

- ~10-15 minutes investigation.
- ~10-20 commands.
- ~8-15 files read, plus small snippets from search results.
- Recent history: last 10-20 commits, branch delta if feature branch.
- Final summary: target 800-1500 words unless user asks for more.

If repo is huge, shrink scope around current branch, dirty diff, recently touched files, and user-stated task.

## Rules

- Read-only by default. No edits, installs, resets, checkouts, migrations, deployments, or commits.
- Preserve current working tree.
- Prefer high-signal evidence over exhaustive coverage.
- Use `read` for file contents. Use `bash` for git/search/listing.
- Cite paths, commits, commands. Mark inference as inference.
- Skip low-signal boilerplate, generated files, vendored deps, broad style critique.
- If user gave a target task, bias every read toward that task.
- Ask clarifying questions when ambiguity would waste context or risk wrong work. Keep questions few and actionable.

## Fast Workflow

### 0. Clarify target when needed

If user prompt lacks scope, intended task, or desired output, ask 1-3 questions before broad digging. Good questions:

- "What task should I optimize catchup for: bug, feature, review, or planning?"
- "Should I focus current branch/diff, recent commits, or whole repo orientation?"
- "Any PR/issue/spec I should treat as source of truth?"

Do not ask if answer is obvious from cwd, branch name, user prompt, or current diff. Start reading, then ask follow-up questions only for decisions that block useful next work.

### 1. Locate state

Run:

```bash
pwd
git rev-parse --show-toplevel 2>/dev/null || true
git status --short --branch
git branch --show-current 2>/dev/null || true
git rev-parse --short HEAD 2>/dev/null || true
git log --oneline --decorate -n 12 2>/dev/null || true
```

If not git repo, proceed with docs/files only and note limitation.

### 2. Load local instructions first

Find likely agent/project rules:

```bash
find .. -name AGENTS.md -o -name CLAUDE.md | head -20
find . -maxdepth 3 \( -name AGENTS.md -o -name CLAUDE.md -o -name README.md \) -print | head -40
```

Read applicable instruction files only. Do not recursively chase every doc link unless clearly relevant.

### 3. Identify intent docs, but sample only

List docs/plans:

```bash
find . -maxdepth 3 -type f \( \
  -iname 'README*' -o -iname 'ROADMAP*' -o -iname 'TODO*' -o -iname 'PLAN*' -o \
  -iname 'SPEC*' -o -iname 'DESIGN*' -o -iname 'ARCHITECTURE*' -o -path './docs/*' -o -path './.github/*' \
\) | sort | head -80
```

Read top 2-5 docs that explain current work. Prefer docs referenced by branch name, recent commits, current diff, or user prompt.

### 4. Read recent change shape

Use commits as index, not full biography:

```bash
git log --stat --oneline -n 12 2>/dev/null || true
git show --stat --summary --oneline HEAD 2>/dev/null || true
```

If on feature branch, inspect delta:

```bash
git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null || true
git diff --stat origin/main...HEAD 2>/dev/null || git diff --stat origin/master...HEAD 2>/dev/null || true
```

Open only commits/files that explain active feature, surprising changes, or likely next work.

### 5. Inspect current worktree

Run:

```bash
git diff --stat 2>/dev/null || true
git diff --name-only 2>/dev/null || true
git diff --cached --stat 2>/dev/null || true
git diff --cached --name-only 2>/dev/null || true
```

Read dirty files and nearest tests first. If no dirty diff, use branch delta/recent commits.

### 6. Map just enough code

Find stack/entry/test anchors:

```bash
find . -maxdepth 2 -type f | sort | head -120
find . -maxdepth 3 -type f \( -name package.json -o -name Cargo.toml -o -name go.mod -o -name pyproject.toml -o -name Dockerfile -o -name 'docker-compose*.yml' -o -name '*.sln' -o -name '*.csproj' \) -print
find . -maxdepth 3 -type d \( -name src -o -name app -o -name lib -o -name test -o -name tests -o -name docs \) -print
```

Read manifests, entrypoint(s), files touched by current branch/diff, and tests around touched behavior. Stop once you can describe main flow relevant to current work.

Useful targeted searches:

```bash
rg -n "TODO|FIXME|HACK|WIP|not implemented|throw new Error|describe\(|it\(|test\(" .
rg -n "<user-task-keyword>|<branch-keyword>|<feature-keyword>" .
```

Replace placeholders with real branch/task terms.

## Stop Conditions

Stop investigation when you can state:

- Active branch/task in one sentence.
- 3-6 relevant files and why each matters.
- Current diff/branch delta shape.
- Intended behavior from docs/tests.
- Next 1-3 coding moves.

If missing any item after budget, stop anyway and list exact gap + best next command/file.

## Output Template

```markdown
# Project Catchup: <name>

## TL;DR
- Current work: <one sentence>
- Best next move: <one sentence>
- Main risk/gap: <one sentence>

## Current State
- Repo/branch: `<path>` / `<branch>` @ `<sha>`
- Worktree: <clean/dirty + key files>
- Recent activity: <2-4 commit themes with refs>

## What Matters Now
- `<file>` — <why it matters>
- `<file>` — <why it matters>
- `<test/doc>` — <expected behavior/constraint>

## Intended Behavior
- <docs/tests/instructions say>
- <acceptance criteria inferred or explicit>

## Relevant Flow
<short path through code: input -> core modules -> output/storage/tests>

## Next Moves
1. <specific next action>
2. <specific next action>
3. <optional check/test>

## Gaps / Questions
- <gap> — next evidence: `<command or file>`

## Clarifying Questions
1. <question that changes next work, not trivia>
2. <optional>
3. <optional>

## Evidence
- Commands: <short list>
- Files read: <short list>
- Commits/diffs: <short list>
```

## Tone

Concise. Operational. No audit verdict. No broad praise/critique. Optimize for starting work now.
