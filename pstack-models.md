# pstack settings for Claude Code, Codex and Pi.
# A pstack skill can name ~/.cursor/rules/pstack-models.mdc, "the pstack-models.mdc rule" or "the /setup-pstack rule". Each of these means this file.
# A value is inherit-parent, or a list of seats "<family> <effort>". One subagent runs per seat.
# The families are claude and gpt. The efforts are low, medium, high, xhigh and max.
# These routes replace three rules in the skills. They replace the family-default rule, the "no family match" rule and the "open a PR to update the default table" rule.
# A seat never moves to another family. If a route fails, report that seat BLOCKED with the error and continue with the other seats.
# Use each seat's effort as written. It replaces poteto-mode's "Match the model to the job" step.
# The CLI routes are read-only and return text. The parent writes all files.
# budget: large (xhigh)

## Routes
claude | Claude Code: Agent model "opus", effort <e>
       | Codex: claude -p --model opus --effort <e> --tools Read,Grep,Glob --no-session-persistence < prompt
       | Pi: Agent model "claude-code/claude-opus-5-5", thinking <e>
gpt    | Claude Code: codex exec -s read-only --ephemeral -m gpt-6.1-sol -c model_reasoning_effort=<e> -o <out> - < prompt  (outside a git repo, add --skip-git-repo-check)
       | Codex: spawn_agent model "gpt-6.1-sol", reasoning_effort <e>, fork_turns "none"
       | Pi: Agent model "openai-codex/gpt-6.1-sol", thinking <e>
# In Codex, a fork with the full history keeps the parent model and effort, and ignores overrides. So always set fork_turns "none" when you set a model.

## Cursor terms
Task                          -> Claude Code Agent, Codex spawn_agent, Pi Agent (pi-subagents)
subagent_type generalPurpose  -> general-purpose in Claude Code and Pi. Do not set it in Codex.
subagent_type poteto-agent    -> a general subagent whose prompt starts "Read ~/.agents/skills/poteto-mode/SKILL.md in full before any work"
subagent_type comment-sicko   -> not installed. Say so and use a general subagent.
readonly: true                -> Claude Code subagent_type Explore. Elsewhere, tell the subagent not to edit, or use codex exec -s read-only.
environment: "cloud"          -> run locally in its own worktree (Claude Code and Pi: isolation "worktree")
AskQuestion                   -> Claude Code AskUserQuestion. Elsewhere, ask in chat with numbered options.
create-skill                  -> skill-creator
~/.cursor/projects            -> ~/.claude/projects, ~/.codex/sessions, ~/.pi/agent/sessions (this workspace only)
.cursor/skills                -> the project's .agents/skills
~/.cursor/skills              -> ~/.agents/skills

## Roles
feature, refactoring: inherit-parent
bug-fix: inherit-parent
perf-issue: inherit-parent
hillclimb: inherit-parent
judgment and prose: inherit-parent
hardest tasks: inherit-parent
how explorer: inherit-parent
how explainer: inherit-parent
why investigators: inherit-parent
why synthesizer: inherit-parent
reflect tooling: inherit-parent
reflect judgment, divergent, synthesizer: inherit-parent
swarm workers: inherit-parent
arena runners: claude xhigh, gpt xhigh
arena cross-judge pool: claude xhigh, gpt xhigh
architect runners: claude xhigh, gpt xhigh
interrogate reviewers: claude xhigh, gpt xhigh
