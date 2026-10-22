#!/bin/bash
# Test which TLS clients on this machine accept or reject certificate chains.
# Each runtime can use its own trust store, so one OS fix does not cover them all.
# Usage: tls-probe.sh [extra-bad-host ...]
#   Pass a known-bad test host from a CA incident to check that each client rejects it.
# Output: client | host | expected | result. A row with result != expected is a finding.
cd / || exit 1  # bun loads .env and bunfig.toml preloads from the current folder
GOOD="example.com"
BAD="expired.badssl.com wrong.host.badssl.com untrusted-root.badssl.com self-signed.badssl.com"

probe() {  # $1=client path/name, $2=host; exit 0 = TLS handshake accepted
  local c=$1 h=$2
  # python3 -S skips site-packages, so a planted .pth file does not run. It also skips a trust store injected by a .pth file.
  case "$(basename "$c")" in
    curl) "$c" -sS -o /dev/null -m 15 "https://$h/" 2>/dev/null ;;
    python3) H=$h "$c" -I -S -c 'import os, sys, urllib.request, urllib.error
try: urllib.request.urlopen("https://" + os.environ["H"], timeout=15)
except urllib.error.HTTPError: pass
except Exception: sys.exit(1)' 2>/dev/null ;;
    node) H=$h "$c" -e 'require("https").get("https://" + process.env.H, () => process.exit(0)).on("error", () => process.exit(1))' 2>/dev/null ;;
    bun) H=$h "$c" -e 'fetch("https://" + process.env.H).then(() => process.exit(0), () => process.exit(1))' 2>/dev/null ;;
    deno) H=$h "$c" eval 'fetch("https://" + Deno.env.get("H")).then(() => Deno.exit(0), () => Deno.exit(1))' 2>/dev/null ;;
    *) return 2 ;;
  esac
}

clients=$(for c in curl python3 node bun deno; do type -ap "$c"; done | awk '!s[$0]++')
bad=""
for h in $GOOD $BAD "$@"; do  # a host that fails without certificate checks makes every "reject" row meaningless
  if command -v curl >/dev/null && ! curl -ksS -o /dev/null -m 15 "https://$h/" 2>/dev/null; then echo "UNREACHABLE: $h (not probed)"; [ "$h" = "$GOOD" ] && exit 1
  elif [ "$h" != "$GOOD" ]; then bad="$bad $h"; fi
done
printf '%-45s %-40s %-8s %s\n' client host expected result
for c in $clients; do
  for h in $GOOD; do probe "$c" "$h" && r=accept || r=reject; printf '%-45s %-40s %-8s %s\n' "$c" "$h" accept "$r"; done
  for h in $bad; do probe "$c" "$h" && r=ACCEPT || r=reject; printf '%-45s %-40s %-8s %s\n' "$c" "$h" reject "$r"; done
done
