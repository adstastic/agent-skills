#!/bin/sh
# Download ASD-STE100 and extract it to a local text cache.
#
# The standard is free to read but it is copyrighted, so this project does not
# redistribute it. This script gets it from the publisher and parses it once,
# which is the part that is otherwise a chore.
#
# Usage:
#   ./scripts/fetch-ste-spec.sh            # fetch if the cache is empty
#   ./scripts/fetch-ste-spec.sh --force    # fetch again
#   ./scripts/fetch-ste-spec.sh --path     # print the cache path and exit
#
# Environment:
#   STE_WRITING_SPEC   where to keep the text  (default: cache dir below)
#   STE_SPEC_URL       where to get the PDF    (default: the Issue 9 file)
set -eu

URL="${STE_SPEC_URL:-https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf}"
CACHE_HOME="${XDG_CACHE_HOME:-$HOME/.cache}"
SPEC="${STE_WRITING_SPEC:-$CACHE_HOME/ste-writing/asd-ste100-issue9.txt}"

FORCE=0
for arg in "$@"; do
  case "$arg" in
    --force) FORCE=1 ;;
    --path) printf '%s\n' "$SPEC"; exit 0 ;;
    -h|--help) sed -n '2,18p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) printf 'unknown option: %s\n' "$arg" >&2; exit 2 ;;
  esac
done

if [ "$FORCE" -eq 0 ] && [ -s "$SPEC" ]; then
  printf '%s\n' "$SPEC"
  exit 0
fi

mkdir -p "$(dirname "$SPEC")"
tmp_pdf="$(mktemp -t ste-spec.XXXXXX)"
tmp_txt="$(mktemp -t ste-text.XXXXXX)"
trap 'rm -f "$tmp_pdf" "$tmp_txt"' EXIT INT TERM

printf 'Getting %s\n' "$URL" >&2
if ! curl -fsSL --retry 2 -o "$tmp_pdf" "$URL"; then
  printf 'Could not get the PDF. Check the network, or set STE_SPEC_URL.\n' >&2
  exit 1
fi

# Three extractors, in order of preference. pdftotext keeps the column layout,
# which the dictionary needs. pypdf through uv needs no permanent install.
# The PDF uses AES encryption, so pypdf also needs the cryptography package.
extracted=0
if command -v pdftotext >/dev/null 2>&1; then
  pdftotext -layout "$tmp_pdf" "$tmp_txt" && extracted=1
elif command -v uv >/dev/null 2>&1; then
  printf 'pdftotext is absent. Using pypdf through uv.\n' >&2
  uv run --quiet --no-project --with pypdf --with cryptography \
    python - "$tmp_pdf" "$tmp_txt" <<'PY' && extracted=1
import sys
from pypdf import PdfReader
reader = PdfReader(sys.argv[1])
with open(sys.argv[2], "w", encoding="utf-8") as out:
    for page in reader.pages:
        out.write(page.extract_text(extraction_mode="layout") or "")
        out.write("\n")
PY
elif python3 -c "import pypdf, cryptography" >/dev/null 2>&1; then
  python3 - "$tmp_pdf" "$tmp_txt" <<'PY' && extracted=1
import sys
from pypdf import PdfReader
reader = PdfReader(sys.argv[1])
with open(sys.argv[2], "w", encoding="utf-8") as out:
    for page in reader.pages:
        out.write(page.extract_text(extraction_mode="layout") or "")
        out.write("\n")
PY
fi

if [ "$extracted" -ne 1 ]; then
  printf 'No PDF extractor. Install one of these, then run this script again:\n' >&2
  printf '  brew install poppler      (gives pdftotext, the best output)\n' >&2
  printf '  brew install uv           (gives uv, which needs no other install)\n' >&2
  printf '  pip install "pypdf[crypto]"\n' >&2
  exit 1
fi

# Collapse the column padding. The file goes from about 1.2 MB to about 670 KB
# and each dictionary entry stays on its own line.
sed -E 's/[[:space:]]+$//; s/ {3,}/  /g' "$tmp_txt" > "$SPEC"

lines=$(wc -l < "$SPEC" | tr -d ' ')
if [ "$lines" -lt 5000 ]; then
  printf 'The text looks too short (%s lines). Keeping it, but examine it.\n' "$lines" >&2
fi

printf 'Wrote %s lines to %s\n' "$lines" "$SPEC" >&2
printf '%s\n' "$SPEC"
