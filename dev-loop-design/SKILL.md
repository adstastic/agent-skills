---
name: dev-loop-design
description: Strategic dev-loop workflow for unclear or larger feature work in any repo. Use when starting a feature/milestone, shaping roadmap, researching architecture, or deciding slice order before implementation.
---

# Dev Loop: Design

Use when scope is unclear, feature is large, architecture/tradeoffs matter, or durable roadmap/decision docs may change.

This skill is repo-agnostic. First discover how this repo tracks plans, decisions, tests, and working agreements. If those artifacts do not exist, propose a minimal setup before creating anything.

Goal: produce a small, inspectable design and vertical slice order. Do not implement unless user explicitly switches to build.

## Interaction contract

- Be collaborative, not autonomous.
- Ask before creating repo process/docs in repos that are not already initialized for this loop.
- When user gives review comments or asks discussion-first, answer each comment directly and wait for explicit go before editing.
- If a choice is unclear, present tradeoffs and recommendation; do not silently decide.

## Flow

### 1. Discover repo workflow

Check current state:

```bash
git status --short --branch
git log --oneline --decorate -n 8
```

Look for existing docs/process files, for example:

- `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `.github/copilot-instructions.md`
- `PLAN.md`, `ROADMAP.md`, `DECISIONS.md`, `INVARIANTS.md`
- `feature_list.json`, issue tracker docs, milestone docs
- README test/check instructions
- build/test config for the repo ecosystem: Makefile/Justfile, package.json, pyproject.toml, Cargo.toml, go.mod, xcodeproj/Package.swift, CI config

If these exist, use them as source of truth. If missing, propose minimal artifacts and ask before writing them.

Minimal optional dev-loop artifacts to propose, not auto-create:

- `AGENTS.md` or equivalent working agreement
- `PLAN.md` for current slice narrative
- `DECISIONS.md` for durable tradeoffs
- `ROADMAP.md` for deferred work
- machine-readable feature/status file only if the repo needs it
- canonical check command only if absent

### 2. Questions

Start with the smallest useful question set:

- What behavior/user outcome are we trying to unlock?
- What is already known from repo docs/history?
- What decisions are actually blocked?
- What can wait until a tactical slice?

Ask only decision-relevant questions. Avoid broad questionnaires.

### 3. Research

Read high-signal context from the repo's actual sources of truth. Keep research objective: facts about current code, not model opinions about what to build.

### 4. Design sketch

In chat by default, summarize:

- current state
- desired end state
- constraints/invariants
- code touchpoints
- options/tradeoffs
- recommended direction

Write durable docs only after user agrees they belong in this repo.

### 5. Structure outline

Propose vertical slices, each with a verification checkpoint. Avoid horizontal plans like “all DB, then all service, then all CLI” unless no better thin slice exists.

For each slice:

- user-visible behavior
- expected code touchpoints
- primary test/check
- non-goals

### 6. Handoff

End with recommended next tactical slice and tiny TDD plan. Then switch to `/skill:dev-loop-build` for implementation.

## Rules

- Do not outsource thinking to the model. Expose assumptions early.
- Keep instruction budget small: split research/design/build instead of one giant plan.
- Prefer chat artifacts unless durable docs are needed and agreed.
- Read code when making claims about code behavior.
- If user asks to implement, stop design mode and load `/skill:dev-loop-build`.
