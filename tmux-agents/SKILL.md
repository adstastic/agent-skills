---
name: tmux-agents
description: Spawn and control multiple sub-agent sessions as tmux windows. Use when user asks to split work across parallel sub-agents, delegate tasks to workers, run multi-agent review, or orchestrate parallel coding-agent instances. Handles both Supacode and plain tmux sessions; detects environment automatically.
---

# Tmux Multi-Agent

Orchestrate multiple coding-agent sessions as parallel sub-agents. Works in Supacode or plain tmux.

Set the command used to launch each sub-agent:

```bash
AGENT_CMD=${AGENT_CMD:-"<your-agent-cli>"}   # replace with your agent CLI command
```

## User-facing invocation

User says what they want. No tmux commands from user. Examples:

- "Split this work across 3 sub-agents: one does auth review, one does API review, one does tests"
- "Run a parallel code review across these 4 areas"
- "Write docs in parallel — have 2 agents each tackle a different section"
- "I need 3 sub-agents reviewing this PR from different angles"

Primary agent analyzes request and decides:

- **Agent count**: 1 obvious task = 1 agent. 2-3 distinct areas = 2-3 agents. 4+ = use 3-5 agents; diminishing returns past 5.
- **Task decomposition**: break request into atomic sub-tasks, one per agent. Each task scoped to a file, module, doc section, or review angle.
- **Sequential vs parallel**: independent tasks → parallel. Dependent tasks (write → review → edit) → sequential.

### Agent count decision rules

| Request type | Agents | Split |
| --- | --- | --- |
| Single review/audit/PR review | 1 | — |
| 2-3 distinct areas mentioned | # areas mentioned | Each gets one |
| "Split this work" with no specifics | 3 | Largest logical divisions of code/task |
| 4+ areas | 3-4 | Group related areas |
| Parallel writing (docs, tests, refactor) | 2-3 | By file/module scope |
| Write → Review → Edit pipeline | 3 | Sequential writer → reviewer → editor |

## Environment detection

At session start:

```bash
if command -v supacode >/dev/null 2>&1 && supacode session list >/dev/null 2>&1; then
  MODE=supacode
elif command -v tmux >/dev/null 2>&1; then
  MODE=tmux
else
  echo "need supacode or tmux" >&2
fi
```

- **Supacode detected**: use `supacode surface split` to create panes in current tab. Panes appear visually.
- **Plain tmux detected**: create detached session `agents`. User can attach with `tmux attach -t agents`.

## How visibility works

### Supacode mode

Panes appear as splits in current tab. Primary agent stays in orchestrator pane; sub-agents run in their panes.

### Plain tmux mode

Detached session. Options:

1. Attach with `tmux attach -t agents` to inspect individual agents.
2. Use layout commands to show status after attach:
   ```bash
   tmux select-layout -t agents tiled
   ```

## Orchestrator workflow

### 1. Analyze request

Decide:

- Agent count
- Task scope per agent
- Parallel or sequential execution
- Deliverable each agent must write

### 2. Prepare shared environment

Use separate work dirs so agents do not overwrite each other:

```bash
for i in 1 2 3; do
  cp -R /path/to/repo /tmp/agent-$i
  git -C /tmp/agent-$i status --short >/dev/null 2>&1 || true
done
```

For git repos, prefer worktrees when practical:

```bash
git worktree add /tmp/agent-1 HEAD
git worktree add /tmp/agent-2 HEAD
git worktree add /tmp/agent-3 HEAD
```

### 3. Spawn sub-agents

Set agent command once:

```bash
AGENT_CMD=${AGENT_CMD:-"<your-agent-cli>"}
```

**Supacode mode:**

```bash
TAB_ID=$(supacode tab list -f 2>/dev/null | head -1)
for i in 1 2 3; do
  PANE_ID="agent-$i"
  supacode surface split -t "$TAB_ID" -s "$TAB_ID" -d v -n "$PANE_ID" \
    -i "cd /tmp/agent-$i && $AGENT_CMD || exec bash"
  sleep 2
done
```

**Plain tmux mode:**

```bash
tmux new-session -d -s agents -x 200 -y 60
for i in 1 2 3; do
  tmux new-window -t agents -n agent-$i
  tmux send-keys -t agents:agent-$i "cd /tmp/agent-$i" Enter
  tmux send-keys -t agents:agent-$i "$AGENT_CMD || exec bash" Enter
  sleep 2
done
```

### 4. Deliver tasks to sub-agents

Write each prompt to file, then paste atomically with helper:

```bash
cat > /tmp/task-1.txt <<'PROMPT'
Objective: Review the auth module.

Scope: token rotation, session management, cookie security flags.

Write findings to /tmp/deliverable-1.md with severity levels: critical/high/medium/low.
Cite file paths and code patterns for each finding.
PROMPT

./tmux-agents/scripts/deliver-prompt.sh agents:agent-1 /tmp/task-1.txt
```

**CRITICAL:** Never use `tmux send-keys` for multi-line prompts. `send-keys` sends each character as a keypress; first newline can submit partial prompt and queue rest as steering. Always write prompt to file → helper.

Helper uses `tmux load-buffer` + `tmux paste-buffer`, then sends one final Enter.

### 5. Monitor and collect output

Check status periodically:

```bash
for i in 1 2 3; do
  echo "=== AGENT-$i OUTPUT ==="
  tmux capture-pane -t agents:agent-$i -p -S -200
done
```

Or wait for artifacts:

```bash
for i in 1 2 3; do
  if [[ -f /tmp/deliverable-$i.md && -s /tmp/deliverable-$i.md ]]; then
    echo "Agent-$i done"
  fi
done
```

### 6. Present results

Aggregate deliverables. Primary agent gives final answer to user.

### 7. Clean up sub-agents

```bash
# Kill individual sub-agent windows
tmux kill-window -t agents:agent-1

# Kill all
tmux kill-session -t agents

# Supacode mode
supacode surface close -t "$TAB_ID" -s "$PANE_ID"
```

## Why `|| exec bash` after agent command?

When agent exits, pane would go blank. `exec bash` keeps pane alive so user can inspect output or rerun command.

## Prompt content guidelines

Each sub-agent prompt should include:

1. **Clear objective** — one sentence at top
2. **Scope** — files/areas in scope and out of scope
3. **Context** — relevant background, patterns, constraints
4. **Output format** — file path and markdown/table/patch/etc.

Sub-agents run independently. They do not share chat history or context.

## Error recovery

If sub-agent hangs (>10 min):

```bash
tmux send-keys -t agents:agent-$N C-c C-c
tmux capture-pane -t agents:agent-$N -p -S -100
```

If pane is blank or agent crashed, shell should be running from `exec bash`; restart with:

```bash
$AGENT_CMD || exec bash
```

If panes are broken, kill and respawn:

```bash
tmux kill-window -t agents:agent-$N
tmux new-window -t agents -n agent-$N
```

## Tmux reference

| Action | Command |
| --- | --- |
| List sessions | `tmux ls` |
| List windows | `tmux list-windows -t agents` |
| Deliver multi-line prompt | `./tmux-agents/scripts/deliver-prompt.sh <target> <prompt-file>` |
| Capture pane output | `tmux capture-pane -t agents:agent-$N -p -S -200` |
| Send simple text | `tmux send-keys -t agents:agent-$N "text" Enter` |
| Kill sub-agent window | `tmux kill-window -t agents:agent-$N` |
| Kill all sub-agents | `tmux kill-session -t agents` |
| Navigate panes (Supacode) | `supacode surface focus` |
