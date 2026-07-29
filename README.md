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

The installer also installs these directly from their upstream repositories:

- [Agent Browser](https://github.com/vercel-labs/agent-browser)
- [Phoenix Architecture](https://github.com/adstastic/phoenix-architecture)
- [Thermos](https://github.com/cursor/plugins/tree/main/thermos)
- [Torvalds Doctrine](https://github.com/leopiney/linus-torvalds-skills)
- [Matt Pocock's skills](https://github.com/mattpocock/skills)

They are not vendored, and their full catalogs are not snapshotted here. The installer stores only source URLs and curated default names, reads current skill names from [`npx skills`](https://github.com/vercel-labs/skills), and installs content directly from upstream; plugin hooks and tools stay out of scope.

## Layout

```text
<skill>/
  SKILL.md
  scripts/            # optional helper scripts
  state/              # optional local state, ignored by git
bin/install.mjs       # live unified installer
```

## Install

Run the interactive installer directly from GitHub:

```bash
npx github:adstastic/agent-skills
```

The installer loads every current upstream catalog, lets you search and select skills from each source, then asks project/global scope, coding agents, and symlink/copy method once. It validates each parsed catalog count before showing choices and aborts rather than silently presenting a partial list. `--yes` installs the curated defaults without prompts.

Local `grill-me` and `grill-with-docs` differ from Matt Pocock's same-name skills. Selecting both versions lets the later Matt installation replace the local one.

For the non-interactive personal preset, clone the repo and run:

```bash
./sync-skills
```

This installs every local skill plus the curated upstream subset globally for Claude Code and Codex. Pi discovers the same canonical `~/.agents/skills` installation. Run it again to fetch upstream changes or restore the bundle on another machine.

For a one-off Pi session without installing globally:

```bash
pi --skill /path/to/agent-skills
```

Helper scripts use relative paths in docs. If your agent runs from another directory, set a `SKILLS_DIR` env var or replace `./<skill>/scripts/...` with an absolute path in your local copy.

## Redaction note

This public copy intentionally omits local state files, device identifiers, personal paths, and project-specific defaults.
