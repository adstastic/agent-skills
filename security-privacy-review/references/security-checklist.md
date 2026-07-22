# Security Checklist

Exhaustive security categories for the review. Each entry gives **what to look for**, **how to find it**, **why it matters**, and **remediation**. Grep patterns use ripgrep (`rg`) syntax and are *leads to verify*, not findings. Confirm reachability and check for existing mitigations (Phase 4 of the main skill) before reporting anything.

## Table of contents

1. Injection (SQL/NoSQL, command, code, template, LDAP/XPath/header/log)
2. Cross-site scripting (XSS)
3. Authentication
4. Authorization & access control (IDOR/BOLA, function-level, mass assignment, multi-tenancy)
5. Session & token management (cookies, JWT, OAuth)
6. Cryptography
7. Secrets management
8. Server-side request forgery (SSRF)
9. Insecure deserialization
10. Path traversal & file handling / uploads
11. XML external entities (XXE)
12. Cross-site request forgery (CSRF)
13. Open redirect
14. Security misconfiguration (CORS, headers, errors, debug, exposed endpoints)
15. Dependencies & supply chain
16. Denial of service (ReDoS, resource exhaustion, decompression bombs)
17. Race conditions & TOCTOU
18. Business logic flaws
19. GraphQL-specific
20. Memory safety (C/C++, unsafe Rust)
21. Logging, monitoring & error handling
22. Infrastructure as code, containers & cloud
23. Client-side & mobile

---

## 1. Injection

**What to look for:** Untrusted input concatenated or interpolated into an interpreter — SQL, a shell command, a database driver call, an OS API, an LDAP filter, an XPath expression, a log line, or another parser.

### SQL / NoSQL injection
- **Look for:** Query strings built with `+`, template literals, `%`/`.format()`, f-strings, or string concatenation that includes request data. For NoSQL (MongoDB etc.), user-controlled objects passed straight into query filters (enabling operator injection like `{"$gt": ""}`).
- **Find:** `rg -n -i "(SELECT|INSERT|UPDATE|DELETE|WHERE|FROM).*(\+|\$\{|%s|\.format\(|f\"|f')"` ; `rg -n "\.(find|findOne|update|remove)\(\s*(req|request|params|body|query)"`
- **Why:** Reads/writes/deletes arbitrary data; can escalate to auth bypass or, via stacked queries and DB features, RCE.
- **Fix:** Parameterized queries / prepared statements / bound parameters everywhere. Use the ORM's safe query builder; never interpolate into raw SQL. For NoSQL, validate/cast types and reject operator objects where scalars are expected.

### OS command injection
- **Look for:** Building shell command strings from input; use of shell-invoking APIs (`sh -c`, `shell=True`).
- **Find:** `rg -n "child_process|execSync|exec\(|spawn\(.*shell|os\.system|subprocess.*shell\s*=\s*True|Runtime\.getRuntime\(\)\.exec|popen|system\("`
- **Why:** Direct RCE.
- **Fix:** Avoid the shell — pass an argument array to `execve`-style APIs (`subprocess.run([...], shell=False)`, `child_process.execFile`). If a shell is unavoidable, strictly allow-list arguments; never pass raw input.

### Code injection / dynamic evaluation
- **Look for:** `eval`, `Function()`, `vm.runInContext`, dynamic `require`/`import` of user-controlled paths, Python `exec`/`eval`, `pickle`/`marshal` of untrusted data (see §9), Ruby `send`/`eval`, PHP `eval`/`assert`/`create_function`.
- **Find:** `rg -n "\beval\(|new Function\(|vm\.run|exec\(|__import__\(|globals\(\)\[|getattr\(.*request"`
- **Fix:** Remove dynamic evaluation of input entirely. Replace `eval`-based parsing with `JSON.parse`; replace dynamic dispatch with an explicit allow-listed map.

### Template injection (SSTI)
- **Look for:** User input rendered *as* a template rather than *into* one — `render_template_string(user)`, string-built Jinja/Twig/ERB/Handlebars/Freemarker templates.
- **Find:** `rg -n "render_template_string|Template\(.*(req|request|body|params)|new Function.*template|Handlebars\.compile\(.*req"`
- **Why:** Often escalates to RCE via the template engine's object access.
- **Fix:** Never build templates from user input. Pass user data as *context variables* to a static template; enable the engine's sandbox/autoescape.

### LDAP / XPath / header / log injection
- **Look for:** Input placed into LDAP filters, XPath queries, HTTP response headers (CRLF → header/response splitting), or log lines (log forging, and forwarding to log-processing sinks).
- **Find:** `rg -n "setHeader\(|addHeader\(|response\.headers\[|\.filter\(.*(req|request)|selectNodes\(|XPath"`
- **Fix:** Encode/escape for the specific grammar; strip CR/LF from header values; for logs, encode newlines and treat logged user data as untrusted (see §21).

---

## 2. Cross-site scripting (XSS)

**What to look for:** User-controlled data written into HTML/JS/attribute/URL/CSS contexts without contextual output encoding.
- **Reflected:** input echoed straight into a response.
- **Stored:** input persisted then rendered to other users (higher impact).
- **DOM-based:** client-side JS writes untrusted data into the DOM sink.

**Find:** `rg -n "innerHTML|outerHTML|insertAdjacentHTML|document\.write|dangerouslySetInnerHTML|v-html|\{\{\{|mark_safe|\|\s*safe|raw\("` ; for sources: `rg -n "location\.(hash|search|href)|document\.URL|window\.name|document\.referrer"`

**Why:** Executes attacker JS in the victim's session — session theft, account takeover, worming.

**Fix:** Prefer text APIs (`textContent`, framework interpolation) over HTML sinks. Use the framework's contextual auto-escaping and don't defeat it (`dangerouslySetInnerHTML`, `|safe`, `v-html`, `mark_safe` are red flags — each needs a justified, sanitized source). Sanitize any necessary HTML with a vetted library (DOMPurify). Add a strong Content-Security-Policy as defense-in-depth. Watch for encoding mismatches (HTML-encoding data that lands in a JS or URL context is still exploitable).

---

## 3. Authentication

**What to look for:**
- **Password storage:** plaintext, reversible encryption, or fast/broken hashes (MD5, SHA-1, unsalted SHA-256) instead of a slow password hash.
- **Find:** `rg -n -i "md5|sha1|sha256.*password|password.*sha|encrypt.*password"` then confirm the hash is used for passwords.
- **Fix:** Use bcrypt, scrypt, or Argon2id with sane cost parameters; per-user salts are handled by these. Never roll your own.

- **Credential comparison:** non-constant-time comparison of secrets/tokens (`==`, `strcmp`) enabling timing attacks.
- **Fix:** Constant-time compare (`crypto.timingSafeEqual`, `hmac.compare_digest`, `subtle.ConstantTimeCompare`).

- **Brute force / credential stuffing:** no rate limiting, lockout, or throttling on login, OTP, or password-reset endpoints.
- **Fix:** Rate-limit and add exponential backoff/lockout; monitor for stuffing; support MFA.

- **Account recovery:** predictable/guessable reset tokens, tokens that don't expire or aren't single-use, user enumeration via differing responses, reset link leakage in referrer.
- **Fix:** High-entropy, single-use, short-lived tokens; uniform responses; no secrets in URLs that leak.

- **MFA & flow integrity:** MFA that can be skipped, OTPs reused, "remember me" that never expires.

---

## 4. Authorization & access control

Framework auto-escaping saves you from many XSS bugs, but *nothing* auto-generates authorization — these are among the most common and highest-impact findings, and tools cannot find them. Trace every sensitive operation and ask "who is allowed to do this, and is that actually enforced here?"

- **IDOR / BOLA (broken object-level authorization):** an endpoint takes an object ID (`/orders/{id}`, `?userId=`) and returns/modifies it without checking the caller owns or may access it.
- **Find:** `rg -n "(params|req|request)\.(id|user_id|account|order)"` then check each handler for an ownership/authorization check.
- **Fix:** On every object access, verify the authenticated principal is authorized for *that specific object*. Scope queries to the current user (`WHERE owner_id = :currentUser`). Prefer unguessable IDs as defense-in-depth, but never as the only control.

- **Broken function-level authorization (BFLA):** admin/privileged routes or actions reachable by ordinary users; missing role checks; authorization enforced only in the UI.
- **Fix:** Enforce role/permission checks server-side on every privileged action; deny by default.

- **Mass assignment / over-posting:** binding request bodies directly to models, letting a user set fields they shouldn't (`isAdmin`, `role`, `balance`).
- **Find:** `rg -n "update\(.*req\.body|assign_attributes|\.\.\.req\.body|ModelForm|Object\.assign\(.*req"`
- **Fix:** Explicit allow-lists of bindable fields (strong params / DTOs / schemas); never bind privileged fields from input.

- **Privilege escalation & path issues:** ability to change one's own role/tenant; horizontal (other users' data) and vertical (higher privilege) escalation.

- **Multi-tenant isolation:** queries not scoped by tenant; shared caches/keys leaking across tenants; tenant ID taken from the request body instead of the authenticated session.
- **Fix:** Derive tenant from the authenticated session, enforce tenant scoping in every query, and test cross-tenant access.

---

## 5. Session & token management

- **Cookies:** missing `HttpOnly` (JS can read session), missing `Secure` (sent over HTTP), missing/`None` `SameSite` (CSRF exposure), overly broad `Domain`/`Path`, no expiry/rotation on privilege change.
- **Find:** `rg -n -i "set-?cookie|cookie\(|res\.cookie|SESSION_COOKIE|samesite|httponly|secure"`
- **Fix:** `HttpOnly; Secure; SameSite=Lax` (or `Strict`) for session cookies; rotate session ID on login/privilege change; sensible expiry; invalidate server-side on logout.

- **JWT pitfalls:**
  - `alg: none` or algorithm confusion (RS256 verified as HS256 using the public key as the HMAC secret).
  - Weak or hardcoded signing secret.
  - Missing verification of `exp`, `nbf`, `aud`, `iss`; accepting unsigned or expired tokens.
  - Sensitive data in the (base64, not encrypted) payload.
  - **Find:** `rg -n -i "jwt|jsonwebtoken|alg.*none|verify\(|decode\(.*verify\s*=\s*False|algorithms\s*="`
  - **Fix:** Pin the exact expected algorithm; use a strong secret/managed keys; verify all standard claims; keep secrets out of the payload; short lifetimes + revocation strategy.

- **OAuth / OIDC:** missing `state` (CSRF on the flow), missing PKCE for public clients, over-broad scopes, unvalidated `redirect_uri` (token theft via open redirect — see §13), implicit flow where code+PKCE is appropriate.

- **Session fixation:** accepting a caller-supplied session ID; not regenerating on auth.

---

## 6. Cryptography

- **Weak/broken primitives:** MD5 or SHA-1 for security purposes; DES/3DES, RC4; ECB mode (leaks plaintext patterns); RSA with tiny keys; homemade ciphers.
- **Find:** `rg -n -i "\bMD5\b|\bSHA1\b|\bDES\b|RC4|ECB|createCipher\(|PKCS1"` (`createCipher` without IV is legacy/insecure; want `createCipheriv`).
- **Fix:** AES-GCM or ChaCha20-Poly1305 (authenticated) with unique IVs/nonces; SHA-256+ for integrity; RSA ≥2048 or ECC; established libraries only.

- **Weak randomness for security tokens:** `Math.random()`, `random.random()`, `java.util.Random`, `rand()` used to generate session IDs, password-reset tokens, API keys, IVs, or nonces.
- **Find:** `rg -n "Math\.random|random\.random\(|new Random\(|rand\(\)|mt_rand"`
- **Fix:** CSPRNG: `crypto.randomBytes`/`randomUUID`, `secrets` module, `SecureRandom`, `crypto/rand`.

- **Key & IV handling:** hardcoded keys/IVs (see §7), IV/nonce reuse (catastrophic for GCM/CTR), missing authentication/MAC (padding-oracle risk), keys checked into source or config.
- **Fix:** Unique IV per encryption; use authenticated encryption; store keys in a KMS/secret manager; enable key rotation.

- **Transport/cert validation disabled:** TLS verification turned off.
- **Find:** `rg -n -i "verify\s*=\s*False|rejectUnauthorized:\s*false|InsecureSkipVerify\s*:\s*true|CURLOPT_SSL_VERIFY(PEER|HOST)\s*,\s*(0|false)|trustAllCerts|NODE_TLS_REJECT_UNAUTHORIZED\s*=\s*0"`
- **Fix:** Always validate certificates; pin where appropriate; use modern TLS.

---

## 7. Secrets management

- **What to look for:** Hardcoded API keys, passwords, private keys, tokens, connection strings; committed `.env`/credentials files; secrets in source, config, CI files, Dockerfiles, or client-side bundles (anything shipped to the browser/app is public).
- **Find:** `rg -n -i "(api[_-]?key|secret|passwd|password|token|bearer|access[_-]?key|private[_-]?key|connection[_-]?string)\s*[:=]\s*['\"][^'\"]{6,}"` ; provider tokens: `rg -n "AKIA[0-9A-Z]{16}|ASIA[0-9A-Z]{16}|ghp_[0-9A-Za-z]{36}|gho_|xox[baprs]-|sk-[0-9A-Za-z]{20,}|AIza[0-9A-Za-z_\-]{35}|-----BEGIN [A-Z ]*PRIVATE KEY-----"` ; committed env: `rg -n --hidden -g '.env*' -g '!*.example' "="`
- **Why:** Immediate compromise of the associated system/account.
- **Fix:** **Treat any real hit as compromised → rotate/revoke.** Move secrets to a secret manager or injected env vars; add to `.gitignore`; scrub git history if the secret was live. **In the report, mask the value** (show a prefix + file:line only). Distinguish real secrets from obvious placeholders/test fixtures, but when unsure, flag conservatively.

---

## 8. Server-side request forgery (SSRF)

- **What to look for:** The server makes an outbound request to a URL/host influenced by user input (webhooks, "fetch this URL", link previews, image/PDF fetchers, import-from-URL, SSO metadata).
- **Find:** `rg -n "requests\.get\(|axios\.get\(|fetch\(|http\.get\(|urllib|HttpClient|open-uri|Net::HTTP|curl_exec"` then check whether the URL/host is user-controlled.
- **Why:** Reach internal services, cloud metadata endpoints (`169.254.169.254`) to steal credentials, port-scan the internal network, or hit `file://`/`gopher://` schemes.
- **Fix:** Allow-list destinations (scheme + host); resolve DNS and block private/link-local/loopback ranges (and re-check after redirects to defeat DNS rebinding and redirect-based bypasses); restrict schemes to `https`; disable following redirects to internal hosts; where possible route through an egress proxy with policy.

---

## 9. Insecure deserialization

- **What to look for:** Deserializing untrusted data with an unsafe deserializer that can instantiate arbitrary types or invoke gadget chains.
- **Find:** `rg -n "pickle\.loads|yaml\.load\((?!.*SafeLoader)|Marshal\.load|unserialize\(|ObjectInputStream|readObject|BinaryFormatter|fromXML|JsonConvert.*TypeNameHandling|xstream"`
- **Why:** Frequently RCE (Python pickle, Ruby Marshal, Java `readObject`, PHP `unserialize`, .NET `BinaryFormatter`).
- **Fix:** Don't deserialize untrusted data with these. Use data-only formats (JSON) with schema validation; `yaml.safe_load`; disable type-embedding (`TypeNameHandling.None`); if native serialization is unavoidable, sign the payload and/or restrict allowed types with a strict allow-list.

---

## 10. Path traversal & file handling / uploads

- **Path traversal / LFI-RFI:** user input used in filesystem paths without normalization/confinement (`../../etc/passwd`), or in include/require.
- **Find:** `rg -n "(open|readFile|read_file|createReadStream|sendFile|include|require|File\()\s*\(.*(req|request|params|body|query|input)"`
- **Fix:** Resolve to an absolute path and verify it stays within an allowed base directory (canonicalize, then check prefix); use an allow-list of filenames/IDs mapped to paths; reject `..`, null bytes, and absolute paths.

- **File uploads:** trusting client-supplied filename/content-type; storing uploads in a web-served/executable directory; no size limits; path traversal in the stored name; serving user files from the app origin (enabling stored XSS / content sniffing).
- **Fix:** Validate content by sniffing real type, not extension/header; store outside the webroot (or in object storage) with generated names; enforce size limits; serve from a separate origin with `Content-Disposition: attachment` and `X-Content-Type-Options: nosniff`; never execute uploads.

---

## 11. XML external entities (XXE)

- **What to look for:** XML parsed with external-entity/DTD processing enabled.
- **Find:** `rg -n "DocumentBuilderFactory|SAXParser|XMLReader|etree|lxml|libxml|simplexml_load|XmlReader|resolveEntity|DOCTYPE"`
- **Why:** File disclosure, SSRF, and DoS (billion-laughs).
- **Fix:** Disable DTDs and external entity resolution on the parser (`disallow-doctype-decl`, `external-general-entities=false`, `resolve_entities=False`, `defusedxml` in Python). Prefer JSON where possible.

---

## 12. Cross-site request forgery (CSRF)

- **What to look for:** State-changing endpoints (cookie-authenticated) with no anti-CSRF token and no `SameSite` protection; CSRF protection disabled globally; unsafe use of `GET` for state changes.
- **Find:** `rg -n -i "csrf|csrf_exempt|@csrf|withCredentials|SameSite"`
- **Fix:** Use the framework's CSRF tokens (synchronizer or double-submit) for cookie-based auth; set `SameSite=Lax/Strict`; require re-auth for sensitive actions; note that token-based (Authorization header) APIs are generally not CSRF-prone but must not also accept the cookie.

---

## 13. Open redirect

- **What to look for:** Redirect target taken from a parameter without validation (`?next=`, `?returnUrl=`, `redirect_uri`).
- **Find:** `rg -n -i "redirect\(.*(req|request|params|query|next|return|url)|res\.redirect\(|sendRedirect\(|Location:.*param"`
- **Why:** Phishing; and in OAuth, token/code theft.
- **Fix:** Allow-list redirect targets or restrict to same-origin relative paths; validate the full parsed URL host against an allow-list.

---

## 14. Security misconfiguration

- **CORS:** reflecting arbitrary `Origin`, `Access-Control-Allow-Origin: *` combined with `Allow-Credentials: true`, or overly broad allow-lists.
- **Find:** `rg -n -i "access-control-allow-origin|cors\(|Origin.*reflect|allow_credentials"`
- **Fix:** Explicit origin allow-list; never combine `*` with credentials; echo only vetted origins.

- **Missing/weak security headers where impactful:** absent CSP, `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options`/frame-ancestors (clickjacking), `Referrer-Policy`.
- **Fix:** Add appropriate headers; rate severity by real impact (a missing header with no exploit path is Low/Info).

- **Verbose errors / debug mode:** stack traces, SQL errors, internal paths, framework debug consoles (Flask `debug=True`, Django `DEBUG=True`, Rails detailed errors, Symfony dev) reachable in production.
- **Find:** `rg -n -i "DEBUG\s*=\s*True|debug:\s*true|app\.debug|printStackTrace|display_errors\s*=\s*On|NODE_ENV.*development"`
- **Fix:** Disable debug in production; return generic errors to clients; log details server-side.

- **Exposed sensitive endpoints:** admin panels, `/actuator`, `/metrics`, `/debug`, GraphQL introspection, `.git/`, backup files, directory listing.
- **Fix:** Authenticate/restrict or remove them.

- **Default/weak configuration:** default credentials, permissive file permissions, unnecessary services/ports enabled.

---

## 15. Dependencies & supply chain

- **What to look for:** Known-vulnerable dependency versions; unpinned/floating ranges on security-critical deps; missing or ignored lockfiles; suspicious/typosquatted package names; `postinstall`/build scripts fetching or executing remote code; unverified downloaded binaries; dependency-confusion exposure (internal names resolvable from public registries).
- **Find:** inspect `package.json`/`package-lock.json`, `requirements.txt`/`poetry.lock`, `go.mod`/`go.sum`, `pom.xml`, `Gemfile.lock`, `Cargo.toml`. Run `npm audit` / `pip-audit` / `osv-scanner` / `govulncheck` / `bundle audit` if available. `rg -n "postinstall|preinstall|curl .*\| *sh|wget .*\| *(ba)?sh"`
- **Why:** A single vulnerable or malicious dependency compromises the whole app.
- **Fix:** Pin versions and commit lockfiles; remediate known CVEs; verify new/unusual dependencies; scope registries and reserve internal names to prevent confusion; avoid running remote scripts during install; verify checksums/signatures of fetched artifacts.

---

## 16. Denial of service

- **ReDoS (catastrophic backtracking):** regexes with nested/overlapping quantifiers (`(a+)+`, `(.*)*`, `(\w+\s?)*`) applied to user input.
- **Find:** `rg -n "\(\S*\+\S*\)\+|\(\S*\*\S*\)\*|\(\.\*\)\+"` then inspect regexes over user input.
- **Fix:** Simplify/anchor regexes, bound input length, use linear-time engines (RE2), add timeouts.

- **Resource exhaustion:** unbounded loops, allocations, recursion, or reads driven by input; missing pagination/limits on list endpoints; unbounded request/body/file sizes; unbounded concurrency.
- **Fix:** Enforce input/size/page limits; cap recursion and concurrency; stream instead of buffering.

- **Decompression/parse bombs:** unbounded unzip/gunzip of untrusted archives (zip bombs); deeply nested JSON/XML/YAML.
- **Fix:** Limit decompressed size and nesting depth; reject oversized/over-nested inputs.

---

## 17. Race conditions & TOCTOU

- **What to look for:** Security-relevant check separated from the action it guards (time-of-check to time-of-use): balance checks then debits, "does file exist" then open, uniqueness check then insert, coupon/one-time-use redemption, quota enforcement — all without atomicity or locking. Concurrent requests can double-spend, bypass limits, or win a file-race.
- **Find:** manual — look for read-then-write on shared/persistent state without a transaction, lock, or atomic operation, especially on money, quotas, and one-time tokens.
- **Fix:** Make the check-and-act atomic — DB transactions with appropriate isolation, `SELECT ... FOR UPDATE`, unique constraints, atomic compare-and-set, idempotency keys, or locks. For files, use atomic open flags (`O_CREAT|O_EXCL`) instead of check-then-open.

---

## 18. Business logic flaws

- **What to look for:** Abuse of intended functionality that no scanner catches: negative or fractional quantities/amounts, price/discount manipulation from the client, skipping steps in a multi-step workflow (e.g. reaching "confirm" without "pay"), replaying requests, integer overflow in totals, coupon stacking, refund/withdrawal logic, order-of-operations bugs, trusting client-supplied prices/roles/state.
- **Find:** manual — reason about the workflow and what an adversarial user could do with valid-looking requests in an unexpected order or with boundary values.
- **Fix:** Enforce invariants server-side (positive amounts, server-computed prices, valid state transitions), make sensitive operations idempotent, and validate the whole workflow, not just individual requests.

---

## 19. GraphQL-specific

- **What to look for:** Introspection enabled in production; no query depth/complexity limits (DoS via deeply nested queries); batching abuse; field-level authorization missing (object-level checks skipped because resolvers fetch freely); verbose errors; mutations without authorization.
- **Find:** `rg -n -i "graphql|introspection|ApolloServer|makeExecutableSchema|resolvers"`
- **Fix:** Disable introspection in prod; enforce depth/complexity limits and query cost analysis; apply authorization at the resolver/field level; rate-limit; generic errors.

---

## 20. Memory safety (C/C++, unsafe Rust)

- **What to look for:** Buffer overflows and out-of-bounds access (`strcpy`, `strcat`, `sprintf`, `gets`, unchecked `memcpy`, manual index math); use-after-free and double-free; integer overflow/underflow feeding allocation or bounds; format-string bugs (`printf(user)`); missing length checks on parsed input; in Rust, `unsafe` blocks and raw pointer/FFI misuse.
- **Find:** `rg -n "\b(strcpy|strcat|sprintf|gets|scanf|memcpy|alloca)\b|printf\s*\(\s*[a-zA-Z_]" ` ; Rust: `rg -n "unsafe\s*\{|from_raw|transmute|get_unchecked|std::mem::(uninitialized|zeroed)"`
- **Why:** Memory corruption → crashes, info leaks, and RCE.
- **Fix:** Bounded functions (`strncpy`/`snprintf`, or safer still, C++ `std::string`/`std::span`); validate lengths before copies; check for integer overflow before allocation/indexing; never pass user data as a format string; in Rust, minimize and justify `unsafe`, uphold its invariants, and prefer safe abstractions.

---

## 21. Logging, monitoring & error handling

Two directions, both in scope:

- **Sensitive data in logs/telemetry (privacy + security):** passwords, tokens, session IDs, API keys, full `Authorization` headers, full request/response bodies, PII, or card data written to logs, stdout, crash reporters (Sentry), or analytics.
  - **Find:** `rg -n -i "(log|logger|console\.(log|error|warn)|print|logging)\b.*(password|token|secret|authorization|req\.body|request\.body|ssn|credit|card|cvv|email)"`
  - **Fix:** Redact/allow-list logged fields; never log secrets or credentials; scrub PII; configure error trackers to strip sensitive keys and request bodies.
- **Insufficient logging of security events:** auth failures, access-control denials, and sensitive actions not logged, hindering detection and forensics.
  - **Fix:** Log security-relevant events with enough context (without logging the sensitive values themselves), and ensure logs are protected and tamper-evident.
- **Information disclosure via errors:** exceptions returned to clients with internal details (also §14).

---

## 22. Infrastructure as code, containers & cloud

*Review only if these files are in the target's scope.*

- **Dockerfiles:** running as root (no `USER`), `ADD` of remote URLs, `latest` tags, secrets baked into layers/`ENV`, unnecessary packages, exposed Docker socket mount.
  - **Find:** `rg -n -i "^\s*USER\s+root|^\s*ADD\s+http|:latest|ENV\s+.*(SECRET|PASSWORD|KEY|TOKEN)|/var/run/docker.sock"`
- **Kubernetes:** `privileged: true`, `hostNetwork`/`hostPID`, `allowPrivilegeEscalation`, running as root, secrets in env/ConfigMaps, missing resource limits, over-broad RBAC, `imagePullPolicy` and unpinned images.
- **Terraform / cloud config:** public storage buckets, security groups open to `0.0.0.0/0` on sensitive ports, unencrypted storage/volumes, publicly accessible databases, over-broad IAM (`"Action": "*"`, `"Resource": "*"`, wildcard principals), disabled logging, public snapshots/AMIs, hardcoded credentials.
  - **Find:** `rg -n -i "0\.0\.0\.0/0|acl\s*=\s*\"public|\"Effect\":\s*\"Allow\".*\"\*\"|publicly_accessible\s*=\s*true|encrypted\s*=\s*false"`
- **Fix:** Least privilege everywhere (IAM, RBAC, network); drop container privileges and run non-root read-only where possible; encrypt at rest; keep storage/DBs private; inject secrets from a manager; pin images; enable audit logging.

---

## 23. Client-side & mobile

- **Web:** secrets or long-lived tokens in `localStorage`/`sessionStorage` (readable by any XSS); `dangerouslySetInnerHTML`/`v-html`/`eval` (see §2); `postMessage` handlers without an `origin` check; `target="_blank"` without `rel="noopener"`; client-side "auth" that trusts the browser; sensitive data cached in the browser.
  - **Find:** `rg -n "localStorage|sessionStorage|postMessage|addEventListener\(.?['\"]message|target=.?_blank|window\.opener"`
- **Mobile (Android/iOS):** secrets in the app bundle/strings; insecure local storage of tokens/PII (unencrypted SharedPreferences/UserDefaults/SQLite); cleartext traffic allowed (Android `usesCleartextTraffic`, iOS ATS exceptions); disabled TLS/cert pinning bypass; exported activities/receivers/providers without permission; `WebView` with `setJavaScriptEnabled` + `addJavascriptInterface` exposed to untrusted content; unvalidated deep links/intents.
  - **Find:** `rg -n -i "usesCleartextTraffic|NSAllowsArbitraryLoads|addJavascriptInterface|setJavaScriptEnabled|exported=.?true|SharedPreferences|UserDefaults"`
- **Fix:** Keep secrets off the client; store tokens in platform secure storage (Keystore/Keychain); enforce TLS (+ pinning for high-value apps); restrict exported components and validate all IPC/deep-link input; lock down `WebView` and never bridge native capabilities to untrusted web content.
