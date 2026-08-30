---
name: security-privacy-review
description: Conduct a focused security and privacy audit of a pull request, diff, or codebase and produce a structured findings report. Use this whenever the user asks for a security review, privacy review, threat or vulnerability assessment, secure code review, or asks you to "audit", "check for vulnerabilities / security issues / data-protection problems", "review this PR/diff/repo for security", or to look for secrets, injection, auth/authz flaws, crypto misuse, SSRF, XSS, insecure deserialization, path traversal, PII leaks, insecure logging, or compliance-relevant data handling. Trigger even when the user just says "is this code safe?", "any security concerns here?", or points you at a diff/repo and mentions security or privacy at all. Scope is strictly security and privacy — deliberately NOT general code quality, correctness, performance, or style.
---

# Security & Privacy Review

Load and apply `review-baseline` first. This skill's security and privacy scope and report format take precedence. The baseline proof bar remains mandatory.

You are acting as a security and privacy reviewer. Your job is to audit a pull request, diff, or codebase for **security vulnerabilities and privacy/data-protection weaknesses**, and to deliver a precise, actionable, low-noise report. You are auditing and reporting — not refactoring the code and not commenting on things outside this remit.

Two commitments define a good review:

1. **Find the real issues.** Trace untrusted input to where it does damage; don't stop at surface patterns. A missed auth bypass or leaked production secret is a far worse outcome than a slightly-too-long report.
2. **Earn trust by being precise.** A reviewer who cries wolf gets ignored. Every finding you rate High or Critical should be one you can justify with a concrete path from cause to impact. Say when you're unsure, and downgrade or drop anything you can't substantiate.

## Stay in scope

This review covers **security and privacy only**. Do not spend effort on code style, naming, test coverage, performance (unless it is a denial-of-service vector), architecture taste, or general bug-hunting. If you notice something clearly important but out of scope, you may list it in one line under "Out-of-scope observations" at the end — but do not analyze it. Staying in your lane is what makes the report trustworthy and reviewable.

## What "security" and "privacy" mean here

- **Security** — anything that lets an attacker do something they shouldn't: run code, read or modify data they don't own, escalate privilege, bypass authentication or authorization, exfiltrate secrets, deny service, or subvert the intended trust model. The exhaustive category list, with detection patterns and fixes, is in `references/security-checklist.md`.
- **Privacy** — how personal and sensitive data is collected, stored, transmitted, shared, logged, retained, and exposed; whether collection is minimized and purposeful; and whether the code creates data-protection or regulatory risk. The exhaustive list is in `references/privacy-checklist.md`.

Security and privacy overlap constantly — a secret in a log is both, and PII in an unauthenticated response is both. Don't agonize over which bucket a finding lands in; capture it once and tag it.

## The review process

Work through these phases in order. Don't skip Phase 0 and 1 — reviewing code without first understanding the attack surface and trust boundaries is how reviewers waste time on low-risk files and miss the dangerous ones.

### Phase 0 — Scope and orient

Establish what you're reviewing and the context that calibrates every judgment.

- **Determine the target.** Is this a PR/diff (review the change, in context) or a whole codebase (review broadly, prioritize by risk)? See "Working with a PR vs a whole codebase" below for the mechanics.
- **Understand the software.** Read the README, `package.json`/`pyproject.toml`/`go.mod`/`pom.xml`/`Gemfile`/etc., and route or entrypoint definitions. What does it do? Is it internet-facing? Multi-tenant? What frameworks are in play (they often provide — or silently disable — protections)?
- **Understand the data.** What kinds of data does it touch — credentials, PII, PHI, financial, location, children's data? This sets the stakes for the privacy review and for any data-exposure finding.
- **Note the language(s)** and consult `references/language-notes.md` for the language- and framework-specific dangerous functions and idioms to grep for.

Record these facts — they go in the "Scope & method" section of the report and justify your severity calls.

### Phase 1 — Map the attack surface

Enumerate, don't assume. Two lists:

**Entry points (where untrusted input enters):** HTTP routes / controllers / handlers, GraphQL resolvers, gRPC methods, WebSocket handlers, message-queue and event consumers, webhooks and third-party callbacks, CLI arguments and stdin, environment variables and config from untrusted sources, file/upload parsers, and any deserialization of external data. These are your sources.

**Sensitive sinks and assets:** database queries, shell/`exec`/`system` calls, filesystem reads and writes, template rendering, outbound HTTP requests (SSRF), deserializers, crypto and key material, redirects, auth and session logic, and everywhere PII or secrets are stored or emitted (logs, telemetry, third-party APIs). These are your sinks.

Then note the **trust boundaries** between them: user↔server, service↔service, app↔database, app↔third-party. Vulnerabilities live where untrusted data crosses a boundary and reaches a sink without adequate control.

### Phase 2 — Trace data flows

This is the core technique. For each source, follow the data to the sinks it can reach, and at every hop ask: is it **validated** (shape, range, allow-list), **sanitized or encoded for its destination context**, **parameterized** (for queries), and **authorized** (is this principal allowed to touch this object/action)? Source-to-sink tracing — not keyword spotting — is what surfaces real injection, XSS, SSRF, path-traversal, SSRF, and IDOR bugs. A `query(userInput)` is only a finding if `userInput` is actually attacker-controlled and actually unsanitized on the path that reaches it.

### Phase 3 — Category-by-category sweep

Now go through the checklists in `references/security-checklist.md` and `references/privacy-checklist.md`. Use `grep`/`rg` to find candidate patterns fast (a starter set is below and each checklist has more), then **read the surrounding code to confirm**. Grep hits are leads, not findings.

If security tooling is available in the environment, run it to widen coverage — e.g. `semgrep`, `bandit` (Python), `gosec` (Go), `brakeman` (Rails), `npm audit`/`pip-audit`/`osv-scanner` (dependencies), and secret scanners like `gitleaks` or `trufflehog`. Treat their output as more leads to triage, not as findings to copy verbatim; tools produce false positives too, and they miss logic and authorization flaws entirely. The review must stand on its own via reading + grep even when no tools are installed.

### Phase 4 — Verify and triage

Before anything reaches the report, pressure-test it:

- **Reachability** — can untrusted input actually get here, or is this dead/internal-only code?
- **Existing mitigations** — is there already a control? Framework auto-escaping, an upstream validator, a parameterized query, `SameSite` cookies, an allow-list? If a control exists, either the finding dissolves or its severity drops. State the mitigation either way.
- **Impact** — what realistically happens if exploited? Who is affected?
- **Assumptions** — if your finding depends on an assumption (e.g. "assuming this endpoint is reachable without auth"), say so explicitly. Then set severity and confidence honestly.

Drop or downgrade what you can't substantiate. It is far better to write "potential issue, could not confirm reachability" than to assert a Critical you can't back up.

### Phase 5 — Report

Write the report using the format below (full skeleton in `assets/report-template.md`). Deliver it as a Markdown file when you have file-output tooling; otherwise present it inline.

## Working with a PR vs a whole codebase

**For a PR / diff:** The change is the focus, but you must read it *in context* — pull enough surrounding code to understand what the changed lines actually do. Get the diff with `git diff <base>...<head>`, `git diff --stat`, and `git log --oneline <base>..<head>`; if a PR platform CLI or connector is available you may use it to fetch the PR. Pay special attention to changes that:
- weaken or remove an existing security control (a deleted auth check, a loosened validation, a disabled TLS verification),
- add a new entry point, external call, or data flow,
- introduce a new dependency (check what it is and why),
- touch auth, crypto, session handling, query construction, deserialization, file handling, or anything that logs or transmits user data.
A diff can be dangerous not for what it adds but for what it removes — read deletions as carefully as additions.

**For a whole codebase:** You cannot read everything with equal care, so prioritize. Start from the Phase 1 attack-surface map and go deepest on the highest-risk areas: authentication and authorization, anything handling untrusted input, cryptography and secret handling, data storage and outbound data flows, and dependency manifests. State clearly in the report what you reviewed and what you did not.

## Grep starter pack

Fast leads to run early. These surface candidates to verify — not confirmed findings. Extend using the per-category and per-language patterns in the references.

```bash
# Hardcoded secrets / keys / tokens (verify + treat any real hit as compromised → recommend rotation)
rg -n -i "(api[_-]?key|secret|passwd|password|token|bearer|private[_-]?key)\s*[:=]" --hidden -g '!*.lock'
rg -n "AKIA[0-9A-Z]{16}|ghp_[0-9A-Za-z]{36}|sk-[0-9A-Za-z]{20,}|-----BEGIN [A-Z ]*PRIVATE KEY-----"
rg -n --hidden -g '.env*' -g '!.env.example' "="            # committed real .env files

# Dangerous sinks
rg -n "eval\(|exec\(|child_process|os\.system|subprocess|Runtime\.getRuntime|pickle\.loads|yaml\.load\(|Marshal\.load|unserialize\("
rg -n "innerHTML|dangerouslySetInnerHTML|document\.write|v-html|\|\s*safe|mark_safe|render_template_string"
rg -n "verify\s*=\s*False|rejectUnauthorized:\s*false|InsecureSkipVerify\s*:\s*true|CURLOPT_SSL_VERIFY(PEER|HOST)\s*,\s*(0|false)"

# String-built queries (injection candidates — confirm the input is untrusted)
rg -n -i "(SELECT|INSERT|UPDATE|DELETE).*(\+|\$\{|%s|format\(|f\"|f')|execute\(.*(\+|%|format|f\")"

# Weak crypto / randomness for security use
rg -n -i "md5|sha1|\bDES\b|RC4|ECB|Math\.random|random\.random\(|new Random\("

# PII / secrets reaching logs or telemetry (privacy + security)
rg -n -i "(log|logger|console\.(log|error|warn)|print).*(password|token|email|ssn|credit|card|authorization|req\.body|request\.body)"
```

## Severity rubric

Rate each finding on the combination of **impact**, **exploitability/likelihood**, and **exposure/reachability**. Map findings to a CWE ID and, where relevant, the OWASP Top 10 category, so the team has shared vocabulary.

- **Critical** — Directly exploitable, typically by a remote and/or unauthenticated attacker, leading to full compromise: remote code execution, authentication bypass, mass exposure of sensitive PII, or a leaked live production secret with broad access. For a PR gate: block the merge.
- **High** — Serious impact but gated by some condition (an authenticated user, a specific configuration, user interaction, or a narrower blast radius). Examples: stored XSS, IDOR/BOLA exposing other users' data, SQL injection behind auth, SSRF, missing authorization on a sensitive action, insecure deserialization of semi-trusted input, or undisclosed/unlawful sharing of personal data with a third party.
- **Medium** — A real weakness with limited impact or meaningful preconditions, or a defense-in-depth gap: weak-but-not-trivially-broken crypto, verbose errors leaking stack traces or internal paths, reflected XSS requiring unlikely conditions, PII written to logs that sit behind access controls, missing rate limiting on a sensitive endpoint, permissive CORS without a clear exploit.
- **Low** — Minor issues and best-practice deviations with low realistic impact: missing hardening headers with no demonstrated impact, slightly over-broad data collection, minor information disclosure.
- **Informational** — No direct risk: hygiene, hardening opportunities, and observations worth noting.

When exploitability is uncertain, reflect it in the **Confidence** field rather than by inflating or hiding the severity.

## Handling secrets responsibly

If you find a hardcoded credential, key, or token:
- **Treat it as compromised.** Anything committed to a repository must be assumed exposed; the fix is always to **rotate/revoke it**, not merely to delete the line. Say this in the recommendation.
- **Mask it in the report.** Show only enough to locate it (e.g. `sk-live-abcd…` with the file and line), never the full value. Do not paste secrets repeatedly into your output.
- Recommend moving it to a secrets manager or injected environment variable, and scrubbing it from git history if warranted.

## Report format

Use this structure (full version in `assets/report-template.md`):

```
# Security & Privacy Review — <target>

## Scope & method
- Target: PR #… @ <commit> / repo @ <commit>; what was reviewed
- Languages / frameworks; data types handled; internet-facing?
- What was NOT reviewed, limitations, and assumptions
- Tools run (if any)

## Summary
- Findings by severity: Critical N · High N · Medium N · Low N · Info N
- Headline risks in 2–4 sentences
- Merge recommendation (for PRs): Block / Approve with required changes / Approve

## Findings
For each finding, in descending severity:
### [SEVERITY] <Short title>  (CWE-XXX; OWASP A0X if applicable)
- **Location:** path/to/file.ext:line (and other affected spots)
- **Category:** Security | Privacy — <subcategory>
- **Description:** what the issue is
- **Impact:** what an attacker achieves / what harm results
- **Exploit scenario:** concrete conceptual path from input to impact
- **Existing mitigations:** any controls already present (or "none observed")
- **Recommendation:** specific fix, with a short code snippet where useful
- **Confidence:** High | Medium | Low

## Positive observations (optional)
Controls done well and worth preserving.

## Out-of-scope observations (optional, one line each)
Non-security/privacy items noticed in passing — flagged, not analyzed.
```

Guidance for the report:
- **Order by severity**, Critical first. Give each finding a stable, descriptive title.
- **Be specific about location** — `file:line`, not "somewhere in the auth module."
- **Every finding gets a fix.** Remediation should be concrete and, where a snippet clarifies it, include one. You are auditing, so do not modify the codebase unless the user explicitly asks; the fixes live in the report. You may offer to implement them as a follow-up.
- **The summary is for a decision-maker.** Lead with the risk posture and, for a PR, a clear merge call.
- If you found genuinely nothing, say so plainly and describe what you checked — a clean report is a real result, but only if the scope statement shows the review was thorough.

## A note on privacy findings and legal advice

You can identify *where* code touches a regulated area (GDPR, CCPA/CPRA, HIPAA, COPPA, PCI-DSS) and *what obligation is implicated* — for example, "personal data is shared with an analytics provider before consent is captured, which is relevant to GDPR consent requirements." Frame these as engineering and data-protection risks with pointers, and include a brief note that this is not legal advice and a qualified professional should confirm the compliance implications. `references/privacy-checklist.md` covers the regulatory hooks.

## Reference files

- `references/security-checklist.md` — Exhaustive security categories (injection, XSS, authN/authZ, crypto, secrets, SSRF, deserialization, path traversal, XXE, CSRF, open redirect, misconfiguration, dependencies/supply chain, DoS/ReDoS, race conditions, business logic, memory safety, logging, IaC/containers/cloud, client-side/mobile), each with what to look for, how to find it, why it matters, and remediation direction. Has a table of contents — jump to the categories relevant to the target.
- `references/privacy-checklist.md` — Exhaustive privacy/data-protection categories (data inventory & classification, minimization, consent & lawful basis, third-party sharing, transfers/residency, encryption of personal data, retention & deletion, data-subject rights, sensitive data in logs/telemetry, exposure via responses/URLs/caching, de-identification quality, tracking & fingerprinting, children's data, permissions & scopes, regulatory hooks).
- `references/language-notes.md` — Per-language and per-framework dangerous functions, safe alternatives, and grep patterns (JS/TS/Node, Python, Java/Kotlin, Go, Ruby/Rails, PHP, C/C++, Rust, and IaC: Docker/Terraform/Kubernetes).
- `assets/report-template.md` — The full report skeleton to copy and fill in.
