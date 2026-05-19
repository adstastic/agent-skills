#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "usage: $0 input.mmd [output.png]" >&2
  exit 2
fi

input=$1
output=${2:-}

if [[ ! -f "$input" ]]; then
  echo "input not found: $input" >&2
  exit 2
fi

if [[ -z "$output" ]]; then
  stem=${input%.*}
  output="${stem}.png"
fi

if ! command -v mmdc >/dev/null 2>&1; then
  echo "mmdc not found; install mermaid-cli" >&2
  exit 127
fi

width=${DIAGRAM_WIDTH:-2400}
height=${DIAGRAM_HEIGHT:-1800}
scale=${DIAGRAM_SCALE:-4}
background=${DIAGRAM_BACKGROUND:-white}

mmdc -i "$input" -o "$output" -b "$background" -w "$width" -H "$height" -s "$scale"

if [[ "${DIAGRAM_OPEN:-1}" != "0" ]] && command -v open >/dev/null 2>&1; then
  open "$output" || true
fi

printf '%s\n' "$output"
