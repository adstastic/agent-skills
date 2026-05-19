---
name: repo-audit
description: Checkout a repository into /tmp, read and understand the codebase, then produce a critical deep-dive audit covering purpose, operation, architecture, security, code quality, minimalism, functional risk, and slop. Use when user runs /audit or asks to audit/deep-review a repo by name, path, or URL.
---

# Repo Audit

## Purpose

Deep audit a repo with hostile/critical eye. Default stance: verify by reading code, not README claims. Detect slop: unnecessary abstractions, dead code, cargo-cult patterns, hidden complexity, weak tests, brittle design, security footguns, dependency bloat, and misleading docs.

## Invocation

User-facing prompt command:

```text
/audit <repo name/url/path> <instructions>
```

This prompt expands to use this skill. Treat first argument as repo target. Treat remaining text as audit-specific instructions.

## Checkout

Always checkout/copy into `/tmp` first. Never audit original working tree directly unless user explicitly asks.

Use helper:

```bash
./repo-audit/scripts/checkout.sh '<repo name/url/path>'
```

Helper prints final repo path as last line. `cd` there before analysis.

Supported targets:

- HTTPS/SSH/git URLs
- GitHub `owner/repo`
- local git directory or path
- bare repo names only if `gh` can resolve them; otherwise ask user for URL/owner/repo

## Mandatory Workflow

1. **Resolve and checkout** target into `/tmp/agent-repo-audit-*`.
2. **Identify repo facts**:
   - `pwd`, `git remote -v`, `git rev-parse HEAD`, branch/tag if available
   - top-level files, package manifests, build config, CI, Docker/IaC, tests
3. **Inventory all tracked files**:
   - Prefer `git ls-files`
   - Also inspect untracked important files if clone/source includes them
   - Exclude dependency/vendor/build/cache/binary/generated artifacts unless security-relevant
4. **Read code deeply**:
   - Read README/docs first only for orientation; do not trust them
   - Read all source, config, scripts, tests, CI, deployment, auth/crypto/network/db/deserialization code
   - For large repos: read every audit-relevant file; if context/time prevents literal full read, explicitly list unread file classes and why. Never say “read all code” unless true.
5. **Map behavior**:
   - Entry points, call graph, data flow, trust boundaries
   - State model, persistence, networking, permissions
   - Build/test/runtime path
6. **Run safe local checks when available**:
   - Static checks/lints/tests only if dependencies are present or install is low-risk
   - Do not run destructive commands, deployment, migrations against real services, or unknown install scripts without warning user
   - Prefer read-only commands: `npm test -- --help`, `go test ./...`, `cargo test`, `pytest`, `rg`, `git grep`, language-specific analyzers if already installed
7. **Security review**:
   - Secrets, authn/authz, injection, SSRF, path traversal, insecure deserialization, crypto misuse, unsafe eval/exec, shell quoting, dependency risk, supply-chain risk, CI token exposure, Docker/IaC misconfig, unsafe defaults
8. **Quality/slop review**:
   - Overengineering, underengineering, dead code, duplication, leaky abstractions, global state, magic constants, poor error handling, bad naming, unnecessary deps, generated-looking code, inconsistent style, test theater, README mismatch
9. **Final report** with evidence:
   - Cite paths and functions/classes/config keys
   - Separate confirmed facts from suspicion
   - Rank issues by severity and confidence

## File Reading Strategy

Use these commands to guide reading:

```bash
# overview
find . -maxdepth 2 -type f | sort | sed 's#^./##' | head -200

# tracked inventory
git ls-files | sort > /tmp/repo-audit-files.txt

# important markers
rg -n "TODO|FIXME|HACK|XXX|eval\(|exec\(|spawn\(|system\(|pickle|yaml\.load|md5|sha1|JWT|token|password|secret|api[_-]?key|private[_-]?key|cors|csrf|ssrf|deserialize|sanitize|escape|shell|subprocess|chmod|sudo|curl|wget|docker|terraform|kubernetes|helm|workflow|permissions:" .
```

Read files with `read`, not `cat`. Use `rg`, `find`, and language tools for navigation. For huge files, read in chunks and summarize only after enough context.

## Report Template

Use this structure unless user asks otherwise:

```markdown
# Repo Audit: <name>

## Verdict
- Overall: <good/mixed/bad> — <one-line reason>
- Functional confidence: <high/medium/low>
- Security posture: <high/medium/low risk>
- Code quality/slop score: <1-10, 10 = clean/minimal>

## What This Repo Is
<plain-English purpose, based on code>

## How It Works
- Entry points:
- Main flows:
- Data/storage model:
- External systems:
- Build/test/runtime:

## Architecture
<patterns, module boundaries, coupling, dependency graph, notable design choices>

## Security Review
### Critical/High
- <issue> — evidence: `<path>` / `<symbol>` — impact — fix
### Medium/Low
- ...
### Positive Security Notes
- ...

## Code Quality + Slop Review
- Clean/minimal parts:
- Slop flags:
- Dead/duplicated/generated-looking code:
- Error handling:
- Dependency bloat:
- Tests quality:

## Functional Risks / Bugs
- ...

## Docs vs Reality
- README claims that match code:
- README claims not proven or contradicted:

## Recommendations
1. <highest leverage fix>
2. ...

## Evidence Map
- Files read:
- Commands run:
- Files/classes/functions most important:
- Files not read, if any, and why:
```

## Bias Rules

- Be blunt but fair.
- Prefer concrete evidence over style opinions.
- Flag uncertainty explicitly.
- Do not inflate severity.
- Do not praise boilerplate.
- Do not reward complexity without payoff.
- Minimal, functional, understandable code scores highest.
