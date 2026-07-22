# Security & Privacy Review — <TARGET>

<!--
Fill this in and deliver as a Markdown file (or inline if no file tooling).
Order findings by severity, Critical first. Delete guidance comments before delivering.
Keep secret values masked. Every finding needs a concrete, actionable recommendation.
Stay strictly within security and privacy scope.
-->

## Scope & method

- **Target:** <PR #NN @ commit SHA | repository @ commit SHA | path>
- **What was reviewed:** <changed files in the diff | the following areas of the codebase: …>
- **Languages / frameworks:** <e.g. TypeScript + Express, Python + Django>
- **Data handled:** <e.g. user PII (email, name, IP), payment tokens; no PHI>
- **Exposure:** <internet-facing | internal | multi-tenant SaaS | library>
- **Not reviewed / limitations:** <e.g. front-end not in scope; infra config not provided; could not confirm runtime auth config>
- **Assumptions:** <e.g. assumed endpoints under /admin require the admin role via gateway>
- **Tools run:** <none | semgrep, npm audit, gitleaks — treated as leads and triaged manually>

## Summary

**Findings:** Critical N · High N · Medium N · Low N · Informational N

<2–4 sentences on the overall risk posture and the headline issues a decision-maker needs to know.>

**Merge recommendation (PRs):** <Block — Critical/High must be fixed first | Approve with required changes | Approve>

---

## Findings

<!-- Repeat the block below per finding, in descending severity. -->

### [CRITICAL | HIGH | MEDIUM | LOW | INFO] <Short, specific title>  (CWE-XXX; OWASP A0X:2021 if applicable)

- **Location:** `path/to/file.ext:LINE` <and other affected locations>
- **Category:** <Security | Privacy> — <subcategory, e.g. SQL injection / Broken object-level authorization / PII in logs>
- **Description:** <What the issue is, precisely. Reference the relevant code.>
- **Impact:** <What an attacker achieves, or what data/harm results, and who is affected.>
- **Exploit scenario:** <A concrete, conceptual walk-through from input to impact. Do not include weaponized exploit code.>
- **Existing mitigations:** <Any controls already present that limit this — or "none observed".>
- **Recommendation:** <Specific fix. Include a short code snippet where it clarifies the fix.>

  ```language
  // Example of the corrected pattern (illustrative)
  ```

- **Confidence:** <High | Medium | Low> — <one line on why, e.g. "reachability confirmed via route → handler" or "could not confirm the input is attacker-controlled">

---

## Positive observations (optional)

- <Security/privacy controls done well and worth preserving — e.g. parameterized queries throughout the data layer; secrets sourced from a manager; PII scrubbed before logging.>

## Out-of-scope observations (optional)

<!-- One line each. Non-security/privacy items noticed in passing. Flag, don't analyze. -->

- <e.g. This module has no tests — flagging only; outside this review's scope.>
