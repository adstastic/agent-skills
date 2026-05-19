#!/usr/bin/env bash
# Usage: deliver-prompt.sh <tmux-target> <prompt-file>
# Example: deliver-prompt.sh agents:agent-1 /tmp/task.txt
#
# Writes a prompt from a file into a sub-agent's tmux pane using
# load-buffer + paste-buffer instead of send-keys. This avoids the
# "first newline triggers agent, rest queues as steering" problem.
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <tmux-target> <prompt-file>" >&2
  exit 1
fi

TARGET="$1"
PROMPT_FILE="$2"
BUFFER_NAME="agent-prompt-$$"

if [[ ! -f "$PROMPT_FILE" ]]; then
  echo "Error: prompt file not found: $PROMPT_FILE" >&2
  exit 1
fi

PROMPT_HEAD=$(head -c 200 "$PROMPT_FILE" | tr '\n' ' ')
echo "[$(date +%H:%M:%S)] Delivering prompt to $TARGET"
echo "  head: $(echo "$PROMPT_HEAD" | head -c 120)"

# Load file into tmux buffer, paste into target pane. Entire content
# is pasted as terminal input before we send one final Enter.
tmux load-buffer -b "$BUFFER_NAME" "$PROMPT_FILE"
tmux paste-buffer -t "$TARGET" -b "$BUFFER_NAME"
tmux delete-buffer -b "$BUFFER_NAME" 2>/dev/null || true

# Send Enter once to submit the already-pasted prompt.
tmux send-keys -t "$TARGET" Enter
