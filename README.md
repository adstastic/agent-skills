# Agent Skills

Portable Markdown skills for coding agents. Each directory contains a `SKILL.md` with operating instructions and optional helper scripts.

These skills are written to be agent-agnostic where possible. Tool-specific skills still assume the named CLI exists on `PATH`.

## Skills

- `dev-loop-build` — tactical TDD workflow for implementing an agreed small vertical slice.
- `dev-loop-design` — strategic workflow for shaping unclear/larger feature work before implementation.
- `diagram` — render Mermaid diagrams to high-resolution PNGs.
- `github-pr-review-comments` — read and manage GitHub PR review threads with `gh` + GraphQL.
- `grill-me` — stress-test a plan or design through one-question-at-a-time grilling.
- `grill-with-docs` — grill against project language and propose `CONTEXT.md`/ADR updates with approval gates.
- `hunk-review` — interact with live Hunk diff review sessions via CLI.
- `ios-device-runner` — build, install, and launch an iOS app on a physical device; configure with CLI flags, env vars, or a private `--config` file.
- `project-catchup` — quickly bootstrap context for active repo work.
- `repo-audit` — copy/clone a repo into `/tmp` and run a critical audit.
- `tmux-agents` — orchestrate parallel sub-agents in tmux/Supacode panes.

## Layout

```text
<skill>/
  SKILL.md
  scripts/        # optional helper scripts
  state/          # optional local state, ignored by git
```

## Install

Copy any skill directory into your agent's skills/config directory, or point your agent at this repo.

### Pi

Pi discovers skills from global and project skill directories. Clone this repo under one of them, then restart Pi.

Global install for current user:

```bash
mkdir -p ~/.pi/agent/skills
git clone https://github.com/adstastic/agent-skills.git ~/.pi/agent/skills/agent-skills
```

Generic global install usable by multiple agent harnesses:

```bash
mkdir -p ~/.agents/skills
git clone https://github.com/adstastic/agent-skills.git ~/.agents/skills/agent-skills
```

Project-local install:

```bash
mkdir -p .agents/skills
git clone https://github.com/adstastic/agent-skills.git .agents/skills/agent-skills
```

One-off Pi session without installing globally:

```bash
pi --skill /path/to/agent-skills
```

Or add repo path to Pi settings:

```json
{
  "skills": ["/path/to/agent-skills"]
}
```

Verify after restarting Pi:

```text
/skill:project-catchup
/skill:repo-audit
/skill:ios-device-runner --help
```

Update:

```bash
git -C ~/.pi/agent/skills/agent-skills pull
# or wherever you cloned it
```

### Other agents

Use the skill directory supported by your agent harness, or configure that agent to scan this repo. Each child directory containing `SKILL.md` is one skill.

Helper scripts use relative paths in docs. If your agent runs from another directory, set a `SKILLS_DIR` env var or replace `./<skill>/scripts/...` with an absolute path in your local copy.

## Redaction note

This public copy intentionally omits local state files, device identifiers, personal paths, and project-specific defaults.
