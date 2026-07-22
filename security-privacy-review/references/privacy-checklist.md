# Privacy & Data-Protection Checklist

Exhaustive privacy categories for the review. Each entry gives **what to look for**, **how to find it**, **why it matters**, and **remediation**. As with security, grep patterns are *leads to verify*.

**Not legal advice.** This skill identifies engineering and data-protection *risks* and points to the regulatory obligations they implicate. It does not determine legal compliance. Frame regulatory findings as "relevant to X requirement" and recommend that a qualified privacy/legal professional confirm the implications. See §14.

Privacy findings often coincide with security findings (a secret or PII in a log, PII in an unauthenticated response). Capture the issue once and tag both dimensions if relevant.

## Table of contents

1. Data inventory & classification
2. Data minimization (collection, storage, response over-exposure)
3. Consent & lawful basis
4. Third-party data sharing & processors
5. Data transfers & residency
6. Encryption of personal data (in transit & at rest)
7. Retention & deletion
8. Data-subject rights (access, export, deletion, rectification)
9. Sensitive data in logs, telemetry & error trackers
10. Data exposure via responses, URLs, caching & referrers
11. De-identification quality (anonymization, pseudonymization, hashing)
12. Tracking, fingerprinting & session recording
13. Children's data
14. Regulatory hooks (GDPR, CCPA/CPRA, HIPAA, COPPA, PCI-DSS)
15. Permissions & scopes (mobile permissions, OAuth scopes)

---

## 1. Data inventory & classification

**What to look for:** Where does the code touch personal or sensitive data? Build a mental inventory before judging anything. Categories that raise the stakes:
- **Direct identifiers / PII:** name, email, phone, address, government IDs (SSN, passport), IP address, device IDs, precise location.
- **Special-category / sensitive data (higher bar):** health/PHI, biometrics, genetic data, race/ethnicity, religion, sexual orientation, political views, precise geolocation, financial/payment data, children's data.
- **Credentials:** passwords, tokens, keys (also a security concern).

**Find:** `rg -n -i "\b(email|phone|ssn|social.?security|passport|dob|date.?of.?birth|first.?name|last.?name|address|zip|postal|latitude|longitude|geolocation|ip_?address|credit.?card|cardnumber|cvv|iban|health|diagnosis|patient|biometric|fingerprint)\b"` ; inspect DB schemas/migrations and API DTOs for personal fields.

**Why:** Everything downstream — minimization, encryption, retention, sharing, logging — depends on knowing *what* data is in play and *how sensitive* it is.

**Note in report:** what personal/sensitive data the code handles; this frames the rest of the privacy findings.

---

## 2. Data minimization

Collect, store, and return only what's necessary for the stated purpose.

- **Over-collection:** capturing fields the feature doesn't use; free-text fields that invite sensitive input; collecting precise location when coarse would do.
- **Over-storage:** persisting data that only needed to be transient; storing full payment details instead of a token; keeping raw sensitive input alongside a derived value.
- **Response over-exposure (very common):** APIs returning entire records/objects when the client needs a few fields — leaking internal fields, other users' data, password hashes, tokens, emails, or admin flags. Also `SELECT *` feeding a serializer that emits everything.
  - **Find:** `rg -n "SELECT \*|serialize\(|to_json|toJSON|res\.json\(.*user|res\.send\(.*user|JsonResponse\(.*__dict__|\.\.\.user\b"` then check the serializer's field list against what the client needs, and whether it includes sensitive fields.
- **Fix:** Explicit field allow-lists in serializers/DTOs; select only needed columns; separate public vs internal representations; avoid returning nested related objects wholesale; collect the minimum and coarsest data that serves the purpose.

---

## 3. Consent & lawful basis

- **What to look for:** Personal data collected, processed, or shared **before** consent is obtained where consent is the basis; analytics/ads/tracking SDKs that initialize on page/app load prior to a consent choice; cookie/consent banners that set non-essential cookies regardless of the choice; pre-ticked opt-ins; no way to withdraw consent; marketing communications without opt-in.
- **Find:** `rg -n -i "consent|cookieconsent|gtag\(|analytics\.|mixpanel|segment|amplitude|facebook.*pixel|fbq\(|hotjar|optIn|opt_in|tracking"` — check *when* these fire relative to consent.
- **Why:** Processing without a valid basis (and setting non-essential cookies pre-consent) is a core GDPR/ePrivacy risk.
- **Fix:** Gate non-essential data collection, tracking, and third-party SDK initialization behind explicit, granular, opt-in consent; make withdrawal as easy as granting; default to the privacy-preserving choice; only essential cookies before consent.

---

## 4. Third-party data sharing & processors

- **What to look for:** Personal data sent to third parties — analytics, advertising, crash/error reporting, feature-flagging, session recording, CDNs, payment processors, and **AI/LLM APIs**. Check *which fields* leave: is the payload minimized, or is it full user objects, emails, message contents, or free-text that may contain PII? Watch especially for sending user content or PII to LLM/inference endpoints.
- **Find:** `rg -n -i "sentry|bugsnag|datadog|segment|mixpanel|amplitude|fullstory|hotjar|logrocket|stripe|braintree|openai|anthropic|api\.(openai|cohere|replicate)|googleapis|analytics"` then trace the payload.
- **Why:** Each recipient is a data flow with legal (processor agreements, disclosure, transfer) and exposure implications; over-sharing to third parties is a frequent, high-impact privacy failure.
- **Fix:** Minimize fields sent to each third party; scrub PII from crash/analytics payloads (see §9); confirm the data flow is disclosed and covered by an appropriate agreement (flag as a legal follow-up — you're identifying the flow, not adjudicating the contract); prefer server-side control over what leaves; avoid sending sensitive content to external inference services without a clear basis and safeguards.

---

## 5. Data transfers & residency

- **What to look for:** Personal data moving across regions/borders (e.g. EU→US), storage/region configuration that ignores residency requirements, third-party services processing in unexpected jurisdictions.
- **Find:** inspect infra/region config, bucket/DB regions, and third-party endpoints; `rg -n -i "region\s*[:=]|us-east|eu-west|data_?residency"`
- **Why:** Cross-border transfer of personal data triggers legal safeguards (e.g. GDPR transfer mechanisms).
- **Fix:** Pin storage/processing to required regions; document transfers; flag the mechanism as a legal follow-up.

---

## 6. Encryption of personal data

- **What to look for:** Personal/sensitive data transmitted over plaintext (HTTP, unencrypted DB connections, cleartext mobile traffic) or stored unencrypted at rest (databases, files, object storage, backups, mobile local storage). This intersects with the crypto section of the security checklist — here the lens is "is *personal data* protected in transit and at rest."
- **Find:** `rg -n -i "http://|usesCleartextTraffic|NSAllowsArbitraryLoads|ssl\s*=\s*false|sslmode=disable|encrypt(ion)?\s*[:=]\s*(false|off|none)"`
- **Fix:** TLS for all personal-data transport; encryption at rest for sensitive stores and backups; platform secure storage on mobile; strong, well-managed keys (see security §6).

---

## 7. Retention & deletion

- **What to look for:** No retention limits (data kept forever); no deletion on account closure; soft-delete only (data persists indefinitely behind a flag); PII lingering in backups, caches, logs, search indexes, or analytics after deletion elsewhere; hard-coded "keep everything."
- **Find:** `rg -n -i "deleted_at|soft.?delete|paranoid|retention|expire|ttl|purge|cascade"` — check whether real deletion happens and whether all copies are covered.
- **Why:** Indefinite retention increases breach blast radius and conflicts with storage-limitation and erasure obligations.
- **Fix:** Define and enforce retention periods (TTLs, scheduled purges); on deletion, remove or anonymize across all stores (primary DB, caches, indexes, logs where feasible, and backups per policy); ensure account deletion actually erases or anonymizes personal data.

---

## 8. Data-subject rights

- **What to look for:** Endpoints for data access/export/deletion/rectification. Then check: are they **authenticated and authorized** so a user can only reach *their own* data (a data-subject-access endpoint that leaks another user's data via IDOR is both a privacy and security failure — see security §4)? Does export include everything it should without over-exposing internal data? Does deletion truly propagate (see §7)?
- **Find:** `rg -n -i "export.*data|download.*data|gdpr|dsar|right.?to.?(access|erasure|be.?forgotten)|delete.?account|data.?request"`
- **Fix:** Provide access/export/deletion mechanisms; authenticate and scope them tightly to the requesting subject; ensure deletion propagates across stores.

---

## 9. Sensitive data in logs, telemetry & error trackers

*(Mirrors security §21 from the privacy side — one of the most common real-world privacy leaks.)*

- **What to look for:** PII, credentials, tokens, full request/response bodies, or payment data written to application logs, stdout, structured logging, crash reporters (Sentry/Bugsnag), APM, or analytics events. Error handlers that attach the full request (headers + body) to the report.
- **Find:** `rg -n -i "(log|logger|console\.(log|error|warn)|print|capture(Exception|Message)|track\(|addBreadcrumb)\b.*(password|token|secret|authorization|email|ssn|credit|card|cvv|req\.body|request\.body|user\b)"`
- **Why:** Logs and third-party monitoring are frequently broadly accessible and long-retained; PII there is a silent, durable exposure.
- **Fix:** Redact/allow-list logged and reported fields; strip PII and secrets from crash/analytics payloads; configure error trackers with data-scrubbing and request-body filtering; never log credentials.

---

## 10. Data exposure via responses, URLs, caching & referrers

- **What to look for:**
  - Personal data or tokens in **URLs / query strings** (they land in server logs, browser history, proxies, and the `Referer` header sent to third parties).
  - Sensitive responses marked cacheable (missing `Cache-Control: no-store`), or personal data cached by CDNs/browsers.
  - Guessable/sequential identifiers exposing enumeration of personal records (ties to IDOR, security §4).
  - PII echoed in error messages.
  - Metadata leakage (EXIF/geolocation in uploaded images served back).
- **Find:** `rg -n -i "\?(token|email|ssn|password|session|api_?key)=|Cache-Control|no-store|Referrer-Policy|exif"`
- **Fix:** Keep personal data and tokens out of URLs (use headers/body); set `Cache-Control: no-store` (and `Referrer-Policy: no-referrer`/`strict-origin`) for sensitive responses; use unguessable identifiers; scrub metadata from user media; generic error messages.

---

## 11. De-identification quality

- **What to look for:** "Anonymization" that is actually reversible or weak — hashing identifiers (email/phone) with a plain, unsalted, fast hash (trivially reversible via rainbow tables / small keyspaces), pseudonymization with a static mapping, or datasets that remain re-identifiable via quasi-identifier combinations. Treating pseudonymized data as if it were fully anonymous.
- **Find:** `rg -n -i "anonymi|pseudonym|hash.*(email|phone|user|id)|md5\(.*email|sha1\(.*email|de.?identif"`
- **Why:** Weak de-identification gives a false sense of safety while the data remains personal data in practice (and often in law).
- **Fix:** For true anonymization, remove or aggregate identifiers such that re-identification is not reasonably possible; if reversibility is needed, treat the result as pseudonymous personal data (still protected) and secure the mapping/keys; don't rely on plain hashing of low-entropy identifiers as anonymization.

---

## 12. Tracking, fingerprinting & session recording

- **What to look for:** Persistent tracking identifiers; device/browser fingerprinting; cross-site/third-party tracking; session-recording/replay tools capturing user input (which can capture PII, passwords, and card fields unless masked); analytics events carrying PII.
- **Find:** `rg -n -i "fingerprint|fpjs|fullstory|hotjar|logrocket|smartlook|clarity|canvas.*fingerprint|navigator\.(userAgent|plugins|hardwareConcurrency)|localStorage.*(id|track)"`
- **Why:** Tracking and recording are high-sensitivity processing with consent/disclosure obligations, and replay tools can inadvertently record secrets and PII.
- **Fix:** Gate tracking behind consent (§3); mask sensitive inputs in session recording (exclude password/payment/PII fields); minimize identifiers; disclose tracking; prefer privacy-preserving analytics.

---

## 13. Children's data

- **What to look for:** Services likely to be used by children that collect personal data without age gating or parental-consent flows; data practices applied uniformly without child-specific protections.
- **Find:** `rg -n -i "age|birth.?date|dob|parent|guardian|coppa|under.?13|minor"`
- **Why:** Children's data carries heightened obligations (e.g. COPPA in the US; special protection under GDPR).
- **Fix:** Implement age assurance and parental-consent flows where applicable; minimize data from children; flag for legal review.

---

## 14. Regulatory hooks

Identify *where the code touches a regulated regime* and *what obligation is implicated*, as engineering pointers — then recommend legal confirmation. This is **not legal advice**.

- **GDPR / UK GDPR (EU/UK personal data):** lawful basis & consent (§3), data-subject rights (§8), minimization (§2), storage limitation/retention (§7), international transfers (§5), records of processing, breach-notification readiness, privacy-by-design. *Hook example:* "Analytics fires before consent — relevant to GDPR/ePrivacy consent."
- **CCPA / CPRA (California):** notice at collection, right to know/delete/correct, right to opt out of "sale"/"sharing" (relevant when data goes to ad/analytics third parties, §4), sensitive-personal-information limits. *Hook example:* "Personal data shared with an ad SDK — relevant to CPRA opt-out-of-sharing."
- **HIPAA (US health data / PHI):** if the code handles PHI, obligations around access controls, audit logging, encryption, and minimum-necessary use; business-associate relationships for third parties. *Hook example:* "Diagnosis fields returned in an unauthenticated response — relevant to HIPAA safeguards."
- **COPPA (US children under 13):** verifiable parental consent, minimization (§13).
- **PCI-DSS (payment card data):** cardholder data should be tokenized/handled by a compliant processor, not stored raw; CVV must never be stored; encryption and scope-minimization. *Hook example:* "Raw PAN/CVV persisted — relevant to PCI-DSS; should be tokenized via the processor."

For each hook, state the code location, the implicated requirement, and "confirm with a qualified professional."

---

## 15. Permissions & scopes

- **What to look for:** Requesting more access than needed. Mobile apps requesting broad permissions (location, contacts, camera, microphone, storage) unrelated to features; OAuth integrations requesting broad scopes (`read/write all`, full mailbox/drive) when narrow scopes suffice; background location without justification.
- **Find:** `rg -n -i "uses-permission|NSLocationAlways|NSCameraUsage|NSContactsUsage|scope\s*[:=].*(read|write|all|admin|mail|drive|repo)|requestPermission"`
- **Why:** Excess permissions/scopes expand what a compromise or a third party can reach and violate minimization.
- **Fix:** Request the narrowest permissions/scopes that the feature needs; request at point of use with rationale; drop unused permissions; prefer incremental/granular scopes.
