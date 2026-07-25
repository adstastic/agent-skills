# Agent Skills

Portable Markdown skills for coding agents. Each directory contains a `SKILL.md` with operating instructions and optional helper scripts.

These skills are written to be agent-agnostic where possible. Tool-specific skills still assume the named CLI exists on `PATH`.

## Skills

- `dev-loop-build` — autonomously implement an agreed vertical slice with TDD, risk-adaptive adversarial review, and an atomic local commit.
- `dev-loop-design` — shape unclear/larger work with pragmatic grilling, bounded research, competing designs, and adversarial review.
- `dev-loop-pair` — implement an agreed slice through a tight staged-review loop with the user.
- `deep-research-pro` — run ChatGPT Deep Research through Oracle using Adi's logged-in ChatGPT Pro profile.
- `diagram` — render Mermaid diagrams to high-resolution PNGs.
- `github-pr-review-comments` — read and manage GitHub PR review threads with `gh` + GraphQL.
- `grill-me` — stress-test a plan or design through one-question-at-a-time grilling.
- `grill-socratic` — interview without hints, options, examples, or leading answers.
- `grill-with-docs` — grill against project language and propose `CONTEXT.md`/ADR updates with approval gates.
- `hunk-review` — interact with live Hunk diff review sessions via CLI.
- `ios-device-runner` — build, install, and launch an iOS app on a physical device; configure with CLI flags, env vars, or a private `--config` file.
- `phoenix-grilling` — extract success criteria and unresolved decisions through proportionate, non-leading, Phoenix-aware questioning.
- `project-catchup` — quickly bootstrap context for active repo work.
- `repo-audit` — copy/clone a repo into `/tmp` and run a critical audit.
- `security-privacy-review` — audit a PR, diff, or codebase for security and privacy risks.
- `tmux-agents` — orchestrate parallel sub-agents in tmux/Supacode panes.

`./sync-skills` also installs these directly from their upstream repositories:

- [Phoenix Architecture](https://github.com/adstastic/phoenix-architecture)
- The two portable review skills from [Thermos](https://github.com/cursor/plugins/tree/main/thermos)
- [Torvalds Doctrine](https://github.com/leopiney/linus-torvalds-skills)
- Selected skills from [Matt Pocock's skills](https://github.com/mattpocock/skills): `code-review`, `codebase-design`, `domain-modeling`, `grilling`, `handoff`, `improve-codebase-architecture`, `prototype`, `research`, `tdd`, and `teach`

They are not vendored here, so their source and update history stay upstream. Only their skills are installed; plugin hooks and tools stay out of scope. Thermos's aggregate skill is excluded because it currently invokes Cursor-specific subagents.

## Layout

```text
<skill>/
  SKILL.md
  scripts/        # optional helper scripts
  state/          # optional local state, ignored by git
```

## Install

Clone the repo and run:

```bash
./sync-skills
```

This installs the local and bundled upstream skills globally for Claude Code, Codex, and Pi using [`npx skills`](https://github.com/vercel-labs/skills). Run it again to fetch upstream changes or restore the bundle on another machine.

For a one-off Pi session without installing globally:

```bash
pi --skill /path/to/agent-skills
```

Helper scripts use relative paths in docs. If your agent runs from another directory, set a `SKILLS_DIR` env var or replace `./<skill>/scripts/...` with an absolute path in your local copy.

## Redaction note

This public copy intentionally omits local state files, device identifiers, personal paths, and project-specific defaults.
