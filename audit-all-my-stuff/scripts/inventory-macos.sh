#!/bin/bash
# Read-only software inventory for macOS. Prints names, versions, and paths. MCP_SERVERS prints only known-safe shapes and masks the rest.
# Usage: inventory-macos.sh > ~/.audit-all-my-stuff/inventory-<host>.txt      (run on each Mac; over SSH: ssh host 'bash -s' < inventory-macos.sh)
# The output maps attack surface. Keep it in the state folder, never in a repository.
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.bun/bin:$HOME/.cargo/bin:$HOME/.local/bin:$HOME/go/bin:$HOME/.deno/bin:$PATH"
export HOMEBREW_NO_AUTO_UPDATE=1
cd / || exit 1  # go, rustup, corepack and version-manager shims read the current folder and can download a toolchain
sec() { echo; echo "=== $* ==="; }
ver() { case $(basename "$1") in ssh) "$1" -V ;; openssl|go) "$1" version ;; java) "$1" -version ;; *) "$1" --version ;; esac 2>&1 | head -1; }

sec HOST; hostname; sw_vers; uname -a
sec PENDING_APPLE_UPDATES; softwareupdate --list 2>&1 | tail -n +3

sec APPS  # path|version|bundle id
for d in /Applications "$HOME/Applications"; do
  find "$d" -maxdepth 2 -name '*.app' -prune 2>/dev/null | while read -r a; do
    echo "$a|$(defaults read "$a/Contents/Info" CFBundleShortVersionString 2>/dev/null)|$(defaults read "$a/Contents/Info" CFBundleIdentifier 2>/dev/null)"
  done
done

sec EMBEDDED  # Electron/CEF Chromium and bundled runtimes inside apps
for a in /Applications/*.app "$HOME"/Applications/*.app; do
  f="$a/Contents/Frameworks/Electron Framework.framework/Resources/Info.plist"
  [ -f "$f" ] && echo "ELECTRON|$(basename "$a")|$(defaults read "$f" CFBundleVersion 2>/dev/null)"
  for cef in "$a"/Contents/Frameworks/*Chromium*.framework "$a"/Contents/Frameworks/*CEF*.framework; do
    [ -d "$cef" ] && echo "CHROMIUM_EMBED|$(basename "$a")|$(basename "$cef")"
  done
done
find /Applications "$HOME/Applications" "$HOME/.local/lib" -maxdepth 10 -type f \( -name node -o -name bun -o -name python3 \) -perm -u+x 2>/dev/null \
  | while read -r f; do echo "RUNTIME|$f|$("$f" --version 2>/dev/null | head -1)"; done

sec BREW; brew list --versions 2>/dev/null; brew list --cask --versions 2>/dev/null
sec BREW_SERVICES; brew services list 2>/dev/null

sec RUNTIMES_ON_PATH
for c in node bun deno python3 uv go rustc java ruby git gh curl openssl ssh docker tailscale; do
  for p in $(which -a "$c" 2>/dev/null | awk '!s[$0]++'); do echo "$c|$p|$(ver "$p")"; done
done
# Package-manager CLIs are what a supply-chain attack replaces, so print where they resolve instead of running them.
for c in npm pnpm claude codex gemini opencode wrangler; do
  for p in $(which -a "$c" 2>/dev/null | awk '!s[$0]++'); do echo "$c|$p|$(readlink -f "$p" 2>/dev/null)"; done
done

sec RUNNING_BINARIES  # the binary a process actually runs can differ from the newest install
pids=$(ps -axo pid=,comm= | awk '{p=$1; $1=""; if ($0 ~ /(^ |\/)(node|bun|deno|python3?(\.[0-9]+)?|Python|java|ruby)$/) printf "%s,", p}')
[ -n "$pids" ] && lsof -a -d txt -p "${pids%,}" -Fpn 2>/dev/null | awk '/^p/{f=1; next} /^n/ && f {print substr($0, 2); f=0}' | sort | uniq -c | head -40
# lsof shows nothing for another user's process unless run as root, so list those by exec path.
[ "$(id -u)" = 0 ] || ps -axo user=,comm= | awk -v me="$(id -un)" '$1 != me {$1=""; if ($0 ~ /(^ |\/)(node|bun|deno|python3?(\.[0-9]+)?|Python|java|ruby)$/) print "(needs root)" $0}' | sort | uniq -c

sec GLOBAL_PACKAGES
# Read package folders: npm, pnpm and pipx run code that a supply-chain attack can replace.
{ for p in $(which -a npm 2>/dev/null | awk '!s[$0]++'); do r=$(readlink -f "$p"); echo "${r%/npm/bin/npm-cli.js}"; done
  p=$(sed -n 's/^prefix *= *//p' "$HOME/.npmrc" 2>/dev/null | tail -1); case $p in "~"/*) p=$HOME${p#"~"} ;; esac; [ -n "$p" ] && echo "$p/lib/node_modules"
  ls -d "$HOME/Library/pnpm/global"/*/node_modules "$HOME/.bun/install/global/node_modules" 2>/dev/null
} | sort -u | while read -r d; do
  for m in "$d"/*/package.json "$d"/@*/*/package.json; do [ -f "$m" ] && echo "${m%/package.json}|$(sed -n 's/^[[:space:]]*"version": *"\([^"]*\)".*/\1/p' "$m" | head -1)"; done
done
for m in "$HOME/.local/pipx/venvs"/*/pipx_metadata.json "$HOME/Library/Application Support/pipx/venvs"/*/pipx_metadata.json; do
  [ -f "$m" ] && jq -r '.main_package | "\(.package)|\(.package_version)"' "$m" 2>/dev/null
done
uv tool list 2>/dev/null; cargo install --list 2>/dev/null

sec CONTAINERS; docker ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}' 2>/dev/null
sec VMS; orb list 2>/dev/null; colima list 2>/dev/null; limactl list 2>/dev/null

sec LISTENING_TCP; lsof -nP -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1{print $1, $2, $9}' | sort -u
sec SHARING; launchctl print-disabled system 2>/dev/null | grep -E 'screensharing|smbd|ssh|ARDAgent'; pgrep -l 'screensharingd|ARDAgent|smbd|sshd' 2>/dev/null
sec FIREWALL; /usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null
sec FILEVAULT_SIP; fdesetup status 2>/dev/null; csrutil status 2>/dev/null

sec LAUNCH_ITEMS; ls "$HOME/Library/LaunchAgents" /Library/LaunchAgents /Library/LaunchDaemons 2>/dev/null
sec PRIVILEGED; ls /Library/PrivilegedHelperTools 2>/dev/null; systemextensionsctl list 2>/dev/null; kmutil showloaded --list-only 2>/dev/null | grep -v com.apple

sec EDITOR_EXTENSIONS
for e in code cursor windsurf; do command -v $e >/dev/null && { echo "-- $e"; $e --list-extensions --show-versions 2>/dev/null; }; done

sec MCP_SERVERS  # headers and env are never read
command -v jq >/dev/null || echo "jq not found: MCP servers not listed"
# Allowlist: prints server names, commands, URL scheme://host:port, package specs, paths, and flag names.
# Every other value prints as REDACTED.
# Gap: a short lowercase secret passed as its own argument with no keyword flag before it (for example -p pw or -u user:pw) can still print, so read this section before you share the output.
for f in "$HOME/.claude.json" "$HOME/Library/Application Support/Claude/claude_desktop_config.json" "$HOME/.cursor/mcp.json" "$HOME/.gemini/settings.json"; do
  [ -f "$f" ] || continue; echo "-- $f"
  jq -r 'def kw: "key|token|secret|pass|pwd|pw|pat(?!h)|auth|bearer|cred|cookie|session|header";
    def longrun: sub("@sha256:[0-9a-f]{64}$"; "") | any(scan("[A-Za-z0-9]{20,}"); test("[0-9]") and test("[A-Za-z]"));
    def masked: test(":[^/@]+@") or longrun or test("[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}"; "i") or test("^[a-z_]*(\(kw))[a-z_]*:"; "i");
    def spaced: test(" -| [^ /]*( |$)");
    def url: (capture("^(?<s>[A-Za-z][A-Za-z0-9+.:-]*)://(?<a>[^/?#]*)") | "\(.s)://\(.a | sub("^.*@"; ""))" | ascii_downcase
      | select(test("^[a-z][a-z0-9+.:-]*://([a-z0-9._-]+|\\[[0-9a-f:.]+\\])(:[0-9]+)?$"))) // "REDACTED";
    def flag: if test("^(--[A-Za-z][A-Za-z0-9_-]*|-[A-Za-z][a-z]{0,2})$") then .
      else capture("^(?<f>--[A-Za-z][A-Za-z0-9_-]*|-[A-Za-z])(?<v>.*)") | "\(.f)\(if .v | startswith("=") then "=" else "" end)REDACTED" end;
    def secretflag: test("^-H$") or test("^(bearer|basic)$"; "i") or (test("^--?[A-Za-z][A-Za-z0-9_-]*$|[:=]$") and test(kw; "i"));
    def arg($prev):
      if $prev | secretflag then "REDACTED"
      elif test("^--?[A-Za-z]") then flag
      elif test("^[A-Za-z][A-Za-z0-9+.:-]*://") then url
      elif test("^[a-z0-9][a-z0-9._-]*(==|~=|>=|<=|!=)[0-9][a-z0-9.+*!-]*$") and (masked | not) then .
      elif test("^[A-Za-z_][A-Za-z0-9_.-]*=(?!=*$)") then capture("^(?<n>[^=]*)").n | if longrun then "REDACTED" else "\(.)=REDACTED" end
      elif ($prev | test("^(-e|--env)$")) and test("^[A-Z_][A-Z0-9_]*$") then .
      elif test("^([a-z0-9@][a-z0-9@._/:+~^-]*|[~./][A-Za-z0-9._/: -]*|-?[0-9.]+)$") and ((spaced or masked) | not) then .
      else "REDACTED" end;
    def target: if .command then .command | tostring | select(test("^[A-Za-z0-9_./~+-]+$|^/[A-Za-z0-9_./ +-]+$") and ((spaced or masked) | not)) // "REDACTED"
      else .url // .httpUrl // .serverUrl // empty | tostring | url end;
    [.. | objects | .mcpServers? | objects | to_entries[] | select(.value | type == "object")
     | ([.value.args // empty] | flatten | map(tostring)) as $a
     | "\(.key)|\([.value | target] + [range($a | length) as $i | $a[$i] | arg(if $i > 0 then $a[$i - 1] else "" end)] | join(" "))"] | unique[]' "$f" 2>/dev/null
done
[ -f "$HOME/.codex/config.toml" ] && { echo "-- ~/.codex/config.toml"; grep -oE '^\[mcp_servers[^]]*\]' "$HOME/.codex/config.toml"; }

sec CREDENTIAL_FILES_PRESENT  # presence only, never contents
for f in .npmrc .pypirc .netrc .aws/credentials .config/gh/hosts.yml .docker/config.json .kube/config .cargo/credentials.toml .config/gcloud .azure .vercel .config/op .gnupg; do
  [ -e "$HOME/$f" ] && echo "$f"
done
ls "$HOME/.ssh" 2>/dev/null | grep -v -E '^(known_hosts|config|authorized_keys)' || true

sec LOCKFILES  # for osv-scanner and supply-chain checks
find "$HOME/code" "$HOME/src" "$HOME/projects" "$HOME/Developer" "$HOME/dev" "$HOME/git" "$HOME/repos" "$HOME/workspace" -maxdepth 4 \( -name node_modules -o -name .git -o -name .worktrees \) -prune -o \
  \( -name package-lock.json -o -name bun.lock -o -name pnpm-lock.yaml -o -name yarn.lock -o -name uv.lock -o -name poetry.lock -o -name Cargo.lock -o -name go.sum -o -name Package.resolved \) -print 2>/dev/null | head -300
