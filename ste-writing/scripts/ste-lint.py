#!/usr/bin/env python3
"""ASD-STE100 linter for prose files.

Checks the mechanically verifiable subset of Simplified Technical English:
sentence length, banned words, verb forms, passive voice, punctuation.
Judgment calls (procedural vs descriptive classification, technical-noun
exemptions, whether a substitution changes meaning) are left to the model —
this only catches what a regex can prove.

The banned-word list is parsed from the ste-writing skill's own reference
tables at runtime, so editing the skill updates the linter automatically.

Modes:
  ste-lint.py FILE...      lint files, print report, exit 1 if findings
  ste-lint.py --hook       PostToolUse hook: read tool JSON on stdin
  ste-lint.py --lookup WORD  print the dictionary entry for a word
  ste-lint.py --self-test  run assertions

The dictionary lookup needs the extracted standard. Get it once with
scripts/fetch-ste-spec.sh, which downloads the PDF from asd-ste100.org and
caches the text. This project does not redistribute the standard.
"""
import json
import os
import re
import sys

# The reference tables sit in a different place in each repository that carries
# this file: the plugin keeps them in skills/ste-writing/, and the portable
# skill bundle keeps them beside the script. Look in each candidate location
# and use the first one that holds the tables, so one file serves both.
_HERE = os.path.dirname(os.path.abspath(__file__))
_UP = os.path.dirname(_HERE)


def _find_skill_dir():
    # An explicit root is authoritative. Without this, a caller that points the
    # linter at one tree silently gets the tables of another.
    root = os.environ.get("STE_WRITING_ROOT")
    if root:
        candidates = [os.path.join(root, "skills", "ste-writing"), root]
    else:
        candidates = [
            os.path.join(_UP, "skills", "ste-writing"),  # plugin: hooks/ste-lint.py
            _UP,                                         # bundle: <skill>/scripts/ste-lint.py
            _HERE,
        ]
    for path in candidates:
        if os.path.isfile(os.path.join(path, "references", "word-substitutions.md")):
            return path
    return candidates[0]


PLUGIN_ROOT = os.environ.get("STE_WRITING_ROOT") or _UP
SKILL_DIR = _find_skill_dir()
FLAG = os.environ.get("STE_WRITING_MODE_FILE") or os.path.expanduser(
    "~/.ste-writing-mode"
)
PROSE_EXT = {".md", ".markdown", ".txt", ".rst", ".mdx"}
MAX_FINDINGS = 25

# Descriptive limit. Imperative sentences get the 20-word procedural limit.
LIMIT_DESCRIPTIVE = 25
LIMIT_PROCEDURAL = 20

CONTRACTIONS = re.compile(
    r"\b(?:can't|won't|don't|doesn't|didn't|isn't|aren't|wasn't|weren't|"
    r"haven't|hasn't|hadn't|shouldn't|wouldn't|couldn't|it's|that's|there's|"
    r"you're|we're|they're|I'm|let's|we'll|you'll|it'll|we've|you've|I've)\b",
    re.IGNORECASE,
)
LATIN = re.compile(r"\b(?:e\.g\.|i\.e\.|etc\.|viz\.|cf\.|et al\.)", re.IGNORECASE)
MODALS = re.compile(r"\b(?:could|should|shall|may|might|ought to|have to|has to)\b", re.IGNORECASE)
PERFECT = re.compile(r"\b(?:has|have|had)\s+(?:been\s+)?(\w+ed|been|done|made|given|written|taken|shown|gone|become|come|seen|found|set|put|kept|held|broken|chosen)\b", re.IGNORECASE)
PROGRESSIVE = re.compile(r"\b(?:am|is|are|was|were|be|been|being)\s+(\w+ing)\b", re.IGNORECASE)
PASSIVE = re.compile(r"\b(?:is|are|was|were|be|been|being)\s+(\w+ed|done|made|given|taken|shown|written|held|kept|set|put|built|sent|found)\b(?:\s+by\b)?", re.IGNORECASE)
GERUND_SUBJECT = re.compile(r"^(\w+ing)\s+(?:the|a|an|this|these|your|our|it|them|all|each)\b", re.IGNORECASE)
SEMICOLON = re.compile(r";")
PHRASAL = re.compile(
    r"\b(?:put out|give off|carry out|turn off|turn on|shut down|set up|"
    r"back up|check out|figure out|find out|point out|bring up|come up with|"
    r"end up|take care of|deal with|look into|go through|hold off|top off)\b",
    re.IGNORECASE,
)
# Words banned only in a specific part of speech: flag only when a determiner
# follows, which indicates the banned (verb) use.
POS_CONDITIONAL = re.compile(
    r"\b(test|check|cover|run|state|place|position|impact|handle|damage|"
    r"process|review|plot|graph|sample|order)\s+"
    r"(?:the|a|an|this|these|those|it|its|your|our|their|all|each|every)\b",
    re.IGNORECASE,
)
# -ing words the dictionary approves, plus common technical nouns.
ING_OK = {
    "lighting", "opening", "routing", "servicing", "mating", "missing",
    "remaining", "something", "during", "warning", "engineering", "string",
    "thing", "anything", "nothing", "everything", "building", "morning",
    "training", "clothing", "bring", "spring", "ring", "king", "wing",
    "cleaning", "testing", "handling", "packaging", "shipping", "troubleshooting",
    "operating", "caching", "logging", "linting", "formatting", "tooling",
    "onboarding", "branching", "staging", "encoding", "padding", "polling",
}

# Never flag inside these — they are quoted or literal content.
CODE_FENCE = re.compile(r"^\s*(```|~~~)")
INLINE_CODE = re.compile(r"`[^`]*`")
URL = re.compile(r"https?://\S+|<[^>]+>")
QUOTED = re.compile(r"\"[^\"]*\"|“[^”]*”|'[^']{4,}'")
LINK_TARGET = re.compile(r"\]\([^)]*\)")
ABBREV_GUARD = re.compile(r"\b(?:No|Fig|Ref|vs|Dr|Mr|Ms|Inc|Ltd|Jr|Sr|St|approx|min|max)\.")


def load_banned():
    """Parse banned words from the skill's reference tables.

    Returns {word_or_phrase: suggested_alternative}. Rows that are ambiguous
    (contain arrows, semicolons, or 'approved') are skipped rather than
    guessed at.
    """
    banned = {}
    paths = [
        os.path.join(SKILL_DIR, "references", "word-substitutions.md"),
        os.path.join(SKILL_DIR, "SKILL.md"),
    ]
    for path in paths:
        try:
            text = open(path, encoding="utf-8").read()
        except OSError:
            continue
        lines = text.splitlines()
        in_table = False
        for i, line in enumerate(lines):
            if not line.startswith("|") or line.count("|") < 3:
                in_table = False
                continue
            # A row followed by a |---|---| separator is a header, not data.
            # Only a header that names the substitution columns opens a table
            # the engine may learn from. Any other table (the procedural vs
            # descriptive table, the word-count table) is classification, and
            # reading it would teach nonsense such as
            # "procedural -> Tells the reader to do something".
            if i + 1 < len(lines) and re.match(r"^\|[\s:|-]+\|$", lines[i + 1].strip()):
                header = {c.strip().lower() for c in line.strip().strip("|").split("|")}
                in_table = bool(header & {"avoid", "not approved"}) and "use" in header
                continue
            if not in_table:
                continue
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            # SKILL.md quick table is two column-pairs per row.
            pairs = []
            if len(cells) >= 4:
                pairs = [(cells[0], cells[1]), (cells[2], cells[3])]
            elif len(cells) >= 2:
                pairs = [(cells[0], cells[1])]
            for left, right in pairs:
                if not left or not right or left.startswith("-") or left.startswith(":"):
                    continue
                if left.lower() in ("not approved", "avoid", "word"):
                    continue
                if "approved" in left.lower() or "→" in left:
                    continue
                alt = re.sub(r"\s+", " ", right).strip()
                for part in left.split(","):
                    w = part.strip().strip("*").replace("**", "")
                    w = re.sub(r"\([^)]*\)", "", w).strip().lower()
                    if not w or len(w) > 24 or ";" in w or "→" in w:
                        continue
                    if w in POS_ONLY or w in TECHNICAL_VERBS:
                        continue
                    banned.setdefault(w, alt)
    return banned


# These are handled by POS_CONDITIONAL instead of a bare word match, because a
# bare match fires on the approved noun use ("the test", "a check").
POS_ONLY = {
    "test", "check", "cover", "run", "state", "place", "position", "impact",
    "handle", "damage", "process", "review", "plot", "graph", "sample",
    "order", "any", "few", "little", "correct", "bad", "over", "under",
    "since", "as", "either", "before", "have to",
    # approved in one part of speech, banned in another — bare matching is noise
    "note", "complete", "mark", "code", "label", "tag", "spot", "time", "fold",
    "prompt", "kind", "sample", "mode",
    "match", "support", "drop", "focus", "return", "increase", "decrease",
}

# Technical nouns (rule 1.6): a banned word inside a fixed domain name is
# permitted. Extend per-machine with ~/.ste-writing-allowlist (one per line).
TECHNICAL_NOUNS = {
    "main branch", "main landing gear", "backup file", "backup", "base image",
    "base branch", "base class", "base url", "main thread", "main loop",
    "main function", "main menu", "primary key", "foreign key", "state machine",
    "check constraint", "test suite", "test case", "test file", "run time",
    "runtime", "process id", "review comment", "pull request", "code review",
    "error state", "build step", "release note", "release notes", "note field",
}


# Rule 1.12 category 2: verbs the dictionary does not approve for general use
# but explicitly permits as technical verbs for computer processes. The skill's
# target domain is software, so these are exempt from bare word matching.
TECHNICAL_VERBS = {
    "abort", "boot", "clear", "click", "copy", "cut", "debug", "delete",
    "deselect", "digitize", "disable", "download", "drag", "enable", "encrypt",
    "erase", "filter", "format", "highlight", "invalidate", "load", "manage",
    "maximize", "minimize", "navigate", "paste", "print", "reboot", "save",
    "scroll", "sort", "swipe", "tap", "type", "upgrade", "upload", "validate",
    "zoom",
}


def load_allowlist():
    extra = set()
    try:
        with open(os.path.expanduser("~/.ste-writing-allowlist"), encoding="utf-8") as fh:
            for line in fh:
                line = line.strip().lower()
                if line and not line.startswith("#"):
                    extra.add(line)
    except OSError:
        pass
    return TECHNICAL_NOUNS | extra


def mask(line):
    """Blank out code, URLs, quoted text, and link targets so they are not flagged."""
    for pat in (INLINE_CODE, URL, LINK_TARGET, QUOTED):
        line = pat.sub(lambda m: " " * len(m.group(0)), line)
    return line


def count_words(sentence):
    """Count words per STE rules 8.4-8.7.

    Parentheticals, quoted text, hyphenated groups, abbreviations, identifiers,
    and a number with its unit each count as one word.
    """
    s = re.sub(r"\([^)]*\)", " PAREN ", sentence)
    s = re.sub(r"\"[^\"]*\"|“[^”]*”", " QUOTED ", s)
    s = re.sub(r"`[^`]*`", " CODE ", s)
    # number followed by a unit or symbol collapses to one token
    s = re.sub(r"\b\d+(?:[.,]\d+)?\s*(?:[a-zA-Z%°]+\b|°[CF])", " NUMUNIT ", s)
    tokens = [t for t in re.split(r"[\s—–]+", s) if re.search(r"[A-Za-z0-9]", t)]
    return len(tokens)


def split_sentences(text):
    guarded = ABBREV_GUARD.sub(lambda m: m.group(0).replace(".", "\x00"), text)
    guarded = re.sub(r"(\d)\.(\d)", lambda m: m.group(1) + "\x00" + m.group(2), guarded)
    parts = re.split(r"(?<=[.!?:])\s+", guarded)
    return [p.replace("\x00", ".").strip() for p in parts if p.strip()]


def is_imperative(sentence):
    first = re.sub(r"^[^A-Za-z]*", "", sentence).split(" ")[0].lower()
    return first in {
        "add", "adjust", "apply", "attach", "build", "cancel", "change", "clean",
        "close", "complete", "configure", "connect", "continue", "copy", "create",
        "delete", "disable", "disconnect", "do", "enable", "examine", "fill",
        "find", "follow", "get", "give", "hold", "identify", "install", "keep",
        "lift", "lock", "make", "measure", "monitor", "move", "obey", "open",
        "operate", "prepare", "prevent", "pull", "push", "put", "read", "record",
        "refer", "release", "remove", "repair", "replace", "reset", "restart",
        "review", "run", "select", "send", "set", "show", "start", "stop",
        "supply", "tell", "test", "tighten", "turn", "update", "use", "verify",
        "wait", "write",
    }


def prose_lines(text):
    """Yield (lineno, raw, masked, para) for prose lines only: no code fences,
    no tables, no headings (headings count as one word), no frontmatter.

    `para` groups consecutive prose lines so that a sentence hard-wrapped
    across several lines is still measured as one sentence.
    """
    in_fence = False
    in_frontmatter = False
    para = 0
    prev_emitted = 0
    for i, raw in enumerate(text.splitlines(), 1):
        if i == 1 and raw.strip() == "---":
            in_frontmatter = True
            continue
        if in_frontmatter:
            if raw.strip() == "---":
                in_frontmatter = False
            continue
        if CODE_FENCE.match(raw):
            in_fence = not in_fence
            para += 1
            continue
        if in_fence:
            continue
        stripped = raw.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("|"):
            para += 1
            continue
        if re.match(r"^\s{4,}\S", raw):  # indented code block
            para += 1
            continue
        if re.match(r"^(?:[-*+]|\d+\.|>)\s+", stripped) or i != prev_emitted + 1:
            para += 1  # list items and paragraph starts are their own unit
        prev_emitted = i
        yield i, stripped, mask(stripped), para


def lint_text(text, banned, allowlist=None):
    findings = []
    allowlist = allowlist if allowlist is not None else load_allowlist()
    paragraphs = {}

    def add(line, kind, msg):
        findings.append((line, kind, msg))

    for lineno, raw, masked, para in prose_lines(text):
        body = re.sub(r"^(?:[-*+]|\d+\.|>)\s+", "", masked)
        slot = paragraphs.setdefault(para, [lineno, []])
        slot[1].append(re.sub(r"^(?:[-*+]|\d+\.|>)\s+", "", raw))

        if SEMICOLON.search(body):
            add(lineno, "punctuation", "Semicolon is not permitted (rule 8.1) — write two sentences.")
        for m in CONTRACTIONS.finditer(body):
            add(lineno, "omitted words", f'Contraction "{m.group(0)}" (rule 4.2) — write it in full.')
        for m in LATIN.finditer(body):
            add(lineno, "Latin abbreviation", f'"{m.group(0)}" (GR-6) — use English words.')
        for m in MODALS.finditer(body):
            w = m.group(0).lower()
            alt = {"could": "can", "should": "must", "shall": "must", "may": "can",
                   "might": "can", "ought to": "must"}.get(w, "a command (imperative)")
            add(lineno, "verb", f'"{m.group(0)}" → {alt}.')
        for m in PERFECT.finditer(body):
            add(lineno, "verb tense", f'Perfect tense "{m.group(0)}" (rule 3.2) — use the simple past.')
        for m in PROGRESSIVE.finditer(body):
            add(lineno, "verb tense", f'Progressive "{m.group(0)}" (rule 3.5) — use the simple present.')
        for m in PASSIVE.finditer(body):
            add(lineno, "passive voice", f'"{m.group(0)}" (rule 3.6) — make the agent the subject, or use the imperative.')
        phrasal_spans = []
        for m in PHRASAL.finditer(body):
            add(lineno, "phrasal verb", f'"{m.group(0)}" (rule 9.3) — use a single approved verb.')
            phrasal_spans.append(m.span())
        for m in POS_CONDITIONAL.finditer(body):
            add(lineno, "part of speech", f'"{m.group(1)}" used as a verb (rule 1.2) — it is approved as a noun only.')

        gm = GERUND_SUBJECT.match(body)
        if gm and gm.group(1).lower() not in ING_OK:
            add(lineno, "verb form", f'Gerund subject "{gm.group(1)}" (rule 3.5) — rewrite with a finite verb.')

        # blank out spans already reported as phrasal verbs, so their component
        # words are not reported a second time
        scrubbed = body
        for start, end in phrasal_spans:
            scrubbed = scrubbed[:start] + " " * (end - start) + scrubbed[end:]
        low = " " + re.sub(r"[^a-z\s'-]", " ", scrubbed.lower()) + " "
        # blank out technical nouns so their component words are not flagged
        for phrase in allowlist:
            if phrase in low:
                low = low.replace(phrase, " " * len(phrase))
        for word, alt in banned.items():
            if " " in word:
                if f" {word} " in low:
                    add(lineno, "word", f'"{word}" → {alt}')
            elif re.search(rf"\b{re.escape(word)}\b", low):
                add(lineno, "word", f'"{word}" → {alt}')

    # Sentence length is measured per paragraph, so a sentence that is
    # hard-wrapped over several lines is still measured whole.
    for _, (lineno, lines) in sorted(paragraphs.items()):
        for sent in split_sentences(" ".join(lines)):
            if len(sent) < 3:
                continue
            n = count_words(sent)
            limit = LIMIT_PROCEDURAL if is_imperative(sent) else LIMIT_DESCRIPTIVE
            if n > limit:
                kind = "procedural" if limit == LIMIT_PROCEDURAL else "descriptive"
                add(lineno, "sentence length",
                    f'{n} words, limit {limit} ({kind}) — split it: "{sent[:60]}…"')

    findings.sort(key=lambda f: f[0])
    return findings


def report(path, findings):
    out = [f"{path}: {len(findings)} STE finding(s)"]
    for lineno, kind, msg in findings[:MAX_FINDINGS]:
        out.append(f"  {path}:{lineno}  [{kind}] {msg}")
    if len(findings) > MAX_FINDINGS:
        out.append(f"  … and {len(findings) - MAX_FINDINGS} more")
    return "\n".join(out)


def lint_path(path, banned):
    try:
        text = open(path, encoding="utf-8").read()
    except OSError:
        return []
    return lint_text(text, banned)


def run_hook():
    if not os.path.exists(FLAG):
        return
    try:
        data = json.load(sys.stdin)
    except Exception:
        return
    ti = data.get("tool_input", {}) or {}
    path = ti.get("file_path") or ti.get("notebook_path") or ""
    if not path or os.path.splitext(path)[1].lower() not in PROSE_EXT:
        return
    if os.path.realpath(path).startswith(os.path.realpath(SKILL_DIR)):
        return  # the skill documents non-STE examples on purpose
    banned = load_banned()
    findings = lint_path(path, banned)
    if not findings:
        return
    msg = (
        "STE lint (ste-writing skill is active) — mechanical findings in the file "
        "you just wrote. Fix the ones that are real; a finding inside a quotation, "
        "a proper name, a technical noun, or a deliberate non-STE example is a "
        "false positive and should be left alone.\n" + report(path, findings)
    )
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": msg,
        }
    }))


def self_test():
    banned = {"utilize": "use", "prior to": "before", "ensure": "make sure"}
    bad = (
        "The service has completed the migration; it is running now.\n"
        "Prior to deployment, ensure the config is verified by the operator.\n"
        "You should utilize the cache because it can't be disabled.\n"
        "Running the tests takes time.\n"
        "This extremely long descriptive sentence exists only to exceed the "
        "twenty-five word limit that Simplified Technical English sets for "
        "descriptive text, and it does so comfortably.\n"
    )
    f = lint_text(bad, banned)
    kinds = {k for _, k, _ in f}
    for expect in ("punctuation", "verb tense", "word", "omitted words",
                   "passive voice", "verb form", "sentence length", "verb"):
        assert expect in kinds, f"missing {expect}: {sorted(kinds)}"

    good = "Before you start the deployment, examine the configuration changes.\n"
    assert lint_text(good, banned) == [], lint_text(good, banned)

    # code, quotes, headings, and frontmatter are exempt
    exempt = (
        "---\ntitle: it's fine here\n---\n"
        "# Heading with a semicolon; and it's fine\n"
        "```\nx = 1;  # utilize this\n```\n"
        "The label reads \"Prior to use, ensure the valve is closed\".\n"
        "Use `utilize()` to call it.\n"
    )
    assert lint_text(exempt, banned) == [], lint_text(exempt, banned)

    # word counting: parenthetical, quoted text, number+unit each count as one
    assert count_words("Remove the safety pin (10).") == 5, count_words("Remove the safety pin (10).")
    assert count_words("The unit weighs 20 kg.") == 4, count_words("The unit weighs 20 kg.")
    assert count_words('Release the "SHORT-CIRCUIT TEST" switch.') == 4

    # real skill tables parse without error
    real = load_banned()
    assert len(real) > 200, f"parsed only {len(real)} banned words"
    assert real.get("utilize"), "expected utilize in parsed table"
    for noisy in ("test", "check", "any", "correct"):
        assert noisy not in real, f"{noisy} must be POS-conditional, not a bare match"
    # markdown header rows must never become substitution pairs
    for header in ("mode", "not approved", "avoid", "word", "sentence limit"):
        assert header not in real, f"header row leaked into the word list: {header}"
    assert "What it is" not in real.values(), "a header cell leaked in as an alternative"
    # only substitution tables may be learned from; classification tables must
    # not become word pairs (e.g. "procedural" -> "Tells the reader to ...")
    for classification in ("procedural", "descriptive", "element", "component"):
        assert classification not in real, f"classification table leaked: {classification}"
    assert all(len(v) < 60 for v in real.values()), "an alternative looks like prose, not a word"
    print(f"self-test OK ({len(real)} banned words parsed from skill)")


def find_spec():
    """Locate the extracted standard, if this machine has it.

    scripts/fetch-ste-spec.sh puts it in the cache directory. The plugin
    repository also keeps a copy beside the reference tables.
    """
    candidates = [
        os.environ.get("STE_WRITING_SPEC"),
        os.path.join(
            os.environ.get("XDG_CACHE_HOME") or os.path.expanduser("~/.cache"),
            "ste-writing", "asd-ste100-issue9.txt",
        ),
        os.path.join(SKILL_DIR, "references", "asd-ste100-issue9.txt"),
    ]
    for path in candidates:
        if path and os.path.isfile(path) and os.path.getsize(path) > 100000:
            return path
    return None


# A dictionary entry starts at column 0 with the word and its part of speech.
ENTRY = re.compile(
    r"^[A-Za-z][A-Za-z0-9 ,'()’-]{0,40}?\((?:n|v|adj|adv|prep|conj|pron|art|TN|TV)\)"
)


def lookup(word):
    """Print each dictionary entry for a word, from the extracted standard."""
    spec = find_spec()
    if not spec:
        print(
            "The standard is not on this machine. Get it with:\n"
            "  ./scripts/fetch-ste-spec.sh\n"
            "It downloads the PDF from asd-ste100.org and extracts the text "
            "to a local cache. The project does not redistribute the standard, "
            "because the text is copyrighted."
        )
        return 2

    lines = open(spec, encoding="utf-8", errors="replace").read().splitlines()

    # The front matter lists every change in this issue, in the same
    # "word (v)" shape as the dictionary. Start after the word list begins, or
    # a lookup returns the changelog entry instead of the definition.
    begin = 0
    for i, line in enumerate(lines):
        if re.search(r"Part 2 - Dictionary\s+Page 2-1-A1\b", line):
            begin = i
            break

    start = re.compile(rf"^\s*{re.escape(word)}\b[^A-Za-z]*\(", re.IGNORECASE)
    found = 0
    for i, line in enumerate(lines):
        if i < begin or not start.match(line):
            continue
        found += 1
        block = [line.rstrip()]
        for follow in lines[i + 1:i + 16]:
            if ENTRY.match(follow) and len(block) > 1:
                break
            if follow.strip():
                block.append(follow.rstrip())
        print("\n".join(block))
        print()
        if found >= 4:
            break

    if not found:
        print(f'No entry for "{word}".')
        print("A word that the dictionary does not list can still be a technical")
        print("noun or a technical verb. Refer to rules 1.5 and 1.12.")
        return 1
    print(f"(from {spec})")
    return 0


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        return 0
    if args[0] == "--self-test":
        self_test()
        return 0
    if args[0] == "--lookup":
        if len(args) < 2:
            print("usage: ste-lint.py --lookup WORD")
            return 2
        return lookup(" ".join(args[1:]))
    if args[0] == "--hook":
        run_hook()
        return 0
    banned = load_banned()
    total = 0
    for path in args:
        findings = lint_path(path, banned)
        total += len(findings)
        if findings:
            print(report(path, findings))
        else:
            print(f"{path}: clean")
    return 1 if total else 0


if __name__ == "__main__":
    sys.exit(main())
