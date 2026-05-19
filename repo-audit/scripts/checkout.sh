#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: checkout.sh <repo-url|owner/repo|path|name> [dest-root]" >&2
  exit 2
}

[[ $# -ge 1 ]] || usage
SRC="$1"
ROOT="${2:-/tmp}"

slugify() {
  printf '%s' "$1" \
    | sed -E 's#(https?://|ssh://|git@)##g; s#[:/]+#-#g; s#\.git$##; s#[^A-Za-z0-9._-]+#-#g; s#^-+|-+$##g' \
    | cut -c1-80
}

resolve_source() {
  local src="$1"

  if [[ -d "$src" ]]; then
    printf '%s\n' "$src"
    return 0
  fi

  case "$src" in
    http://*|https://*|ssh://*|git://*|file://*|git@*:*)
      printf '%s\n' "$src"
      return 0
      ;;
  esac

  if [[ "$src" =~ ^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$ ]]; then
    printf 'https://github.com/%s.git\n' "$src"
    return 0
  fi

  if command -v gh >/dev/null 2>&1; then
    local url
    url="$(gh repo view "$src" --json url -q .url 2>/dev/null || true)"
    if [[ -n "$url" ]]; then
      printf '%s.git\n' "$url"
      return 0
    fi
  fi

  echo "Could not resolve repo target: $src" >&2
  echo "Use URL, owner/repo, or local path. Bare names require gh repo resolution." >&2
  return 1
}

RESOLVED="$(resolve_source "$SRC")"
SLUG="$(slugify "$SRC")"
[[ -n "$SLUG" ]] || SLUG="repo"
WORKDIR="$(mktemp -d "${ROOT%/}/agent-repo-audit-${SLUG}.XXXXXX")"
DEST="$WORKDIR/repo"

if [[ -d "$RESOLVED" ]]; then
  if git -C "$RESOLVED" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git clone --recurse-submodules "$RESOLVED" "$DEST" >&2
  else
    mkdir -p "$DEST"
    (cd "$RESOLVED" && tar --exclude='.git' -cf - .) | (cd "$DEST" && tar -xf -)
  fi
else
  git clone --recurse-submodules "$RESOLVED" "$DEST" >&2
fi

printf '%s\n' "$DEST"
