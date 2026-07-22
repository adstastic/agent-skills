# Language & Framework Notes

Language- and framework-specific dangerous functions, safe alternatives, and grep patterns. Use alongside the security and privacy checklists once you know the target's stack. Patterns are ripgrep (`rg`) syntax and are leads to verify.

## Table of contents

- JavaScript / TypeScript / Node.js
- Python
- Java / Kotlin
- Go
- Ruby / Rails
- PHP
- C / C++
- Rust
- Infrastructure as code (Docker, Terraform, Kubernetes)

---

## JavaScript / TypeScript / Node.js

**Dangerous / watch:**
- `eval`, `new Function`, `vm.runInContext`, `setTimeout`/`setInterval` with a string arg → code injection.
- `child_process.exec`/`execSync` (spawns a shell) → command injection. Prefer `execFile`/`spawn` with an args array.
- `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, React `dangerouslySetInnerHTML`, Vue `v-html`, Angular `bypassSecurityTrust*` → XSS.
- Template/query string concatenation with request data → SQL injection (use parameterized queries: `pool.query('... WHERE id = $1', [id])`, or the ORM's safe builder).
- `require(userInput)` / dynamic `import(userInput)` → arbitrary module load / path traversal.
- `Math.random()` for tokens → weak randomness. Use `crypto.randomBytes` / `crypto.randomUUID`.
- `rejectUnauthorized: false`, `NODE_TLS_REJECT_UNAUTHORIZED=0` → disabled TLS verification.
- Prototype pollution: unsafe deep-merge/`Object.assign` of untrusted objects touching `__proto__`/`constructor`/`prototype`; lodash `merge`/`set` on user data.
- `localStorage`/`sessionStorage` holding tokens (XSS-readable).
- ORM/query gotchas: Sequelize/TypeORM raw queries with interpolation; Mongoose queries taking raw user objects (operator injection).

**Find:**
```bash
rg -n "eval\(|new Function\(|child_process|execSync|innerHTML|dangerouslySetInnerHTML|v-html|bypassSecurityTrust|Math\.random\(|rejectUnauthorized:\s*false|localStorage|_\.merge\(|_\.set\("
```

**Framework notes:** Express — check `helmet`, CORS config, cookie flags, CSRF for cookie sessions, and error handlers leaking stacks. Next.js — API routes and server actions as entry points; `getServerSideProps` trust; env var exposure (`NEXT_PUBLIC_` is shipped to the client). React/Vue/Angular auto-escape by default; findings usually come from the explicit escape-hatches above.

---

## Python

**Dangerous / watch:**
- `eval`, `exec`, `compile`, `__import__`, `getattr(obj, user_input)` → code injection / unsafe dispatch.
- `subprocess` with `shell=True`, `os.system`, `os.popen` → command injection. Use `subprocess.run([...], shell=False)`.
- `pickle.loads`, `cPickle`, `marshal.loads`, `shelve`, `yaml.load` without `SafeLoader` → deserialization RCE. Use `yaml.safe_load`, JSON, or signed payloads.
- String-built SQL / `cursor.execute(f"... {x}")` / `.format()` / `%` → SQL injection. Use parameterized `cursor.execute("... WHERE id = %s", (id,))`.
- Flask `render_template_string(user)` / Jinja from user input → SSTI. Django `mark_safe`, `|safe`, `format_html` misuse → XSS.
- `random` module for tokens → weak randomness. Use `secrets`.
- `requests(..., verify=False)` → disabled TLS verification.
- XML: `xml.etree`, `lxml`, `xml.dom` with entity resolution → XXE. Use `defusedxml`.
- `tarfile.extractall` / `zipfile.extractall` on untrusted archives → path traversal ("tarslip") and zip bombs.
- `assert` used for security checks (stripped under `-O`).
- `Flask(debug=True)`, `DEBUG = True` (Django) in production.

**Find:**
```bash
rg -n "eval\(|exec\(|subprocess.*shell\s*=\s*True|os\.system|pickle\.loads|yaml\.load\((?!.*SafeLoader)|render_template_string|mark_safe|verify\s*=\s*False|random\.random|extractall\(|DEBUG\s*=\s*True"
```

**Framework notes:** Django ORM parameterizes by default — risk is in `.raw()`, `.extra()`, and `RawSQL`; check `DEBUG`, `ALLOWED_HOSTS`, `SECRET_KEY` handling, `SECURE_*` settings, and serializer field allow-lists (DRF). Flask — CSRF (Flask-WTF), session cookie config, and blueprint auth decorators. FastAPI — dependency-based auth actually applied to each route; Pydantic helps validate input.

---

## Java / Kotlin

**Dangerous / watch:**
- `Runtime.getRuntime().exec`, `ProcessBuilder` with concatenated input → command injection.
- JDBC `Statement` with string concatenation → SQL injection. Use `PreparedStatement` with bound params.
- `ObjectInputStream.readObject` on untrusted data → deserialization RCE (gadget chains). Avoid Java native serialization for untrusted input; restrict with filters (`ObjectInputFilter`).
- XML: `DocumentBuilderFactory`, `SAXParserFactory`, `XMLInputFactory`, `TransformerFactory` without hardening → XXE. Disable DTDs/external entities.
- Expression-language / template injection: Spring SpEL from user input, unescaped Thymeleaf/JSP.
- `java.util.Random` / `Math.random` for security tokens → use `SecureRandom`.
- Disabled TLS: custom `TrustManager` trusting all certs, `HostnameVerifier` returning true.
- Reflection driven by user input; unsafe `Class.forName`.

**Find:**
```bash
rg -n "Runtime\.getRuntime\(\)\.exec|ProcessBuilder|createStatement\(|Statement\s+\w+\s*=|readObject\(|DocumentBuilderFactory|new Random\(|Math\.random|TrustManager|X509TrustManager|SpelExpressionParser"
```

**Framework notes (Spring):** check method-level security (`@PreAuthorize`) actually present on sensitive endpoints; Spring Security config for permissive matchers; `spring.jpa.show-sql` and actuator exposure; `@RequestBody` binding without validation (mass assignment); CORS config.

---

## Go

**Dangerous / watch:**
- `exec.Command` where the command or args derive from input, or invoking a shell (`sh -c`) → command injection.
- `fmt.Sprintf` building SQL passed to `db.Query`/`Exec` → SQL injection. Use parameterized `db.Query("... WHERE id = $1", id)`.
- `text/template` (no auto-escaping) used for HTML → XSS. Use `html/template`, and don't feed user input into `template.HTML`/`template.JS`.
- `math/rand` for security tokens → use `crypto/rand`.
- `tls.Config{InsecureSkipVerify: true}` → disabled cert verification.
- `filepath.Join` with user input without confining to a base dir → path traversal (check `filepath.Clean` + prefix validation).
- Missing response-size/body limits (`io.ReadAll` on request bodies) → DoS.
- SSRF via `http.Get`/`http.Client` with user-controlled URLs.

**Find:**
```bash
rg -n "exec\.Command|fmt\.Sprintf\(.*(SELECT|INSERT|UPDATE|DELETE)|text/template|math/rand|InsecureSkipVerify\s*:\s*true|filepath\.Join\(.*(r\.|req|param)|io\.ReadAll\(r\."
```

---

## Ruby / Rails

**Dangerous / watch:**
- `eval`, `instance_eval`, `send`/`public_send` with user input, `Object.const_get` → code injection / unsafe dispatch.
- Backticks, `system`, `%x{}`, `Open3` with interpolated input → command injection.
- `Marshal.load`, `YAML.load` (older Ruby), `Oj` in unsafe modes → deserialization RCE. Use `YAML.safe_load`, JSON.
- ActiveRecord raw fragments with interpolation: `where("name = '#{x}'")`, `find_by_sql`, `.order(params[:sort])` → SQL injection. Use placeholders/hash conditions; allow-list sortable columns.
- ERB/HAML with `raw`, `html_safe`, `<%== %>` on user data → XSS.
- Mass assignment: check strong parameters (`params.require(...).permit(...)`); `permit!` is a red flag.
- `redirect_to params[:url]` → open redirect.
- `SecureRandom` is correct; flag `rand`/`Random` for tokens.
- `Rails.application.config.consider_all_requests_local`, detailed errors, or `config.force_ssl = false` in production.

**Find:**
```bash
rg -n "eval\(|instance_eval|\.send\(|Marshal\.load|YAML\.load\b|find_by_sql|where\(\s*[\"'].*#\{|\.order\(params|html_safe|raw\(|<%==|permit!|redirect_to\s+params"
```

---

## PHP

**Dangerous / watch:**
- `eval`, `assert`, `create_function`, `preg_replace` with `/e` modifier → code injection.
- `system`, `exec`, `shell_exec`, `passthru`, `popen`, backticks with input → command injection. Use `escapeshellarg`/`escapeshellcmd` or avoid the shell.
- String-built SQL with `mysqli`/`PDO` → SQL injection. Use prepared statements with bound params.
- `unserialize()` on untrusted data → object injection RCE. Use JSON; if unavoidable, pass `allowed_classes`.
- `include`/`require` with user input → LFI/RFI. `file_get_contents`/`fopen` with user paths → traversal.
- Echoing input without `htmlspecialchars` → XSS.
- `$_GET`/`$_POST`/`$_REQUEST` used directly in sinks; `extract($_REQUEST)` → variable injection.
- `md5`/`sha1` for passwords → use `password_hash`/`password_verify`.
- `display_errors = On` in production.

**Find:**
```bash
rg -n "\beval\(|\bassert\(|create_function|preg_replace\(.*/e|system\(|shell_exec|passthru|unserialize\(|include\s*\(\s*\$|require\s*\(\s*\$|htmlspecialchars|extract\(\s*\$_|password_hash|display_errors"
```

**Framework notes (Laravel):** Blade `{{ }}` auto-escapes; `{!! !!}` does not (XSS). Check Eloquent raw (`DB::raw`, `whereRaw`), mass assignment `$fillable`/`$guarded`, `APP_DEBUG=true`, and CSRF middleware on web routes.

---

## C / C++

**Dangerous / watch (memory safety is the core concern):**
- Unbounded string ops: `strcpy`, `strcat`, `sprintf`, `gets`, `scanf("%s")` → buffer overflow. Use `strncpy`/`strlcpy`, `snprintf`, bounds-checked reads; prefer `std::string`/`std::vector`/`std::span` in C++.
- `memcpy`/`memmove`/`alloca` with unchecked or attacker-influenced lengths → overflow.
- Integer overflow/underflow feeding `malloc`/indexing/loop bounds → heap overflow. Check arithmetic before allocation.
- `printf(user)` / `syslog(user)` → format-string bug. Use `printf("%s", user)`.
- Use-after-free / double-free: freed pointers reused; unclear ownership; missing null-after-free.
- `system`/`popen`/`exec*` with input → command injection.
- Insecure temp files: `tmpnam`/`mktemp` races → use `mkstemp`.
- Off-by-one and missing NUL-termination.

**Find:**
```bash
rg -n "\b(strcpy|strcat|sprintf|gets|scanf|memcpy|memmove|alloca|tmpnam|mktemp)\b|printf\s*\(\s*[A-Za-z_][A-Za-z0-9_]*\s*\)|system\(|popen\("
```

Note whether compiler/OS mitigations (stack canaries, ASLR, `_FORTIFY_SOURCE`, NX) are enabled — but these are mitigations, not fixes for the underlying bug.

---

## Rust

**Dangerous / watch:** Rust is memory-safe in safe code; focus on:
- `unsafe` blocks — raw pointer deref, `slice::get_unchecked`, `std::mem::transmute`, `from_raw`/`into_raw`, uninitialized memory (`MaybeUninit` misuse, deprecated `mem::uninitialized`), and FFI boundaries. Verify the invariants each `unsafe` relies on actually hold.
- `.unwrap()`/`.expect()`/`panic!`/array indexing on attacker-controlled input → panic/DoS (and in some contexts, availability issues). Prefer `?`/`match`/`get`.
- Integer overflow: release builds wrap by default — use checked/saturating arithmetic for security-relevant math.
- Deserialization of untrusted data (serde with untrusted formats) — validate; be wary of formats allowing type confusion.
- Command execution: `std::process::Command` with untrusted args/shell.
- Disabled TLS verification in reqwest/native-tls (`danger_accept_invalid_certs(true)`).
- Dependency risk: audit `Cargo.toml`; run `cargo audit`/`cargo deny` if available; note transitive `unsafe`.

**Find:**
```bash
rg -n "unsafe\s*\{|get_unchecked|transmute|from_raw|mem::(uninitialized|zeroed)|\.unwrap\(\)|\.expect\(|panic!|process::Command|danger_accept_invalid_certs"
```

---

## Infrastructure as code (Docker, Terraform, Kubernetes)

*Review only if these files are in scope. See security checklist §22 for the full list.*

**Docker — find:**
```bash
rg -n -i "^\s*USER\s+root|(^|\s)FROM\s+\S+:latest|^\s*ADD\s+https?://|ENV\s+.*(SECRET|PASSWORD|KEY|TOKEN)|--privileged|/var/run/docker\.sock"
```
Flags: no non-root `USER`, `latest` tags, `ADD` from URLs, secrets in `ENV`/layers, mounted Docker socket.

**Kubernetes — find:**
```bash
rg -n -i "privileged:\s*true|hostNetwork:\s*true|hostPID:\s*true|allowPrivilegeEscalation:\s*true|runAsNonRoot:\s*false|runAsUser:\s*0|:\s*latest|automountServiceAccountToken:\s*true"
```
Flags: privileged/host-namespace containers, running as root, missing resource limits, secrets in env/ConfigMaps, over-broad RBAC, unpinned images.

**Terraform / cloud — find:**
```bash
rg -n -i "0\.0\.0\.0/0|acl\s*=\s*\"public|\"Effect\"\s*:\s*\"Allow\"[\s\S]*\"\*\"|Action\s*=\s*\"\*\"|Resource\s*=\s*\"\*\"|publicly_accessible\s*=\s*true|encrypted\s*=\s*false|force_destroy\s*=\s*true"
```
Flags: security groups open to the world on sensitive ports, public buckets/ACLs, wildcard IAM actions/resources/principals, unencrypted storage, publicly accessible databases, disabled logging.

**General fix direction:** least privilege for IAM/RBAC/network; drop container privileges, run non-root and read-only where possible; encrypt at rest; keep storage and databases private; inject secrets from a manager rather than baking them in; pin image versions; enable audit logging.
