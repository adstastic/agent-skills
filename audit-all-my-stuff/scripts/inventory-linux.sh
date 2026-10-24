#!/bin/sh
# Read-only software inventory for Linux hosts (servers, NAS shells, Raspberry Pi, VMs). Never prints secret values.
# Usage: inventory-linux.sh > ~/.audit-all-my-stuff/inventory-<host>.txt      (over SSH: ssh host 'sh -s' < inventory-linux.sh)
# The output maps attack surface. Keep it in the state folder, never in a repository.
cd / || exit 1  # go, rustup, corepack and version-manager shims read the current folder and can download a toolchain
sec() { echo; echo "=== $* ==="; }
ver() { case $(basename "$1") in ssh) "$1" -V ;; openssl|go) "$1" version ;; java) "$1" -version ;; *) "$1" --version ;; esac 2>&1 | head -1; }

sec HOST; uname -n; cat /etc/os-release 2>/dev/null | grep -E '^(PRETTY_NAME|VERSION_ID)='; uname -r; uptime 2>/dev/null
[ "$(id -u)" = 0 ] || echo "not root: SSH_CONFIG, listening process names, and running binaries need sudo"

KEY_PKGS="openssl libssl3 libssl3t64 openssl-libs openssh-server openssh-client openssh-clients curl ca-certificates sudo nginx apache2 caddy haproxy php8.1 php8.2 php8.3 php8.4 nodejs python3 docker-ce docker.io containerd runc podman samba nfs-kernel-server postgresql mariadb-server redis-server tailscale wireguard-tools linux-image-generic"
sec KEY_PACKAGES
if command -v dpkg-query >/dev/null; then
  dpkg-query -W -f='${db:Status-Abbrev}|${Package}|${Version}\n' $KEY_PKGS 'linux-image-*' 2>/dev/null | sed -n 's/^[ih]i *|//p'
elif command -v rpm >/dev/null; then
  for p in $KEY_PKGS kernel; do rpm -q --qf '%{NAME}|%{VERSION}-%{RELEASE}\n' "$p" 2>/dev/null | grep -v 'not installed'; done
elif command -v apk >/dev/null; then
  apk info -v 2>/dev/null | grep -E "$(echo $KEY_PKGS | tr ' ' '|')"
fi

sec PENDING_UPDATES
[ -d /var/lib/apt/lists ] && echo "apt index updated: $(date -r /var/lib/apt/lists/partial '+%F %R' 2>/dev/null || echo never)"
(apt list --upgradable 2>/dev/null || dnf -q check-update 2>/dev/null || apk version -l '<' 2>/dev/null) | head -80
sec AUTO_UPDATES
apt-config dump 2>/dev/null | grep -E '^APT::Periodic::(Update-Package-Lists|Unattended-Upgrade) '
for u in unattended-upgrades apt-daily-upgrade.timer dnf-automatic.timer; do s=$(systemctl is-enabled $u 2>/dev/null); [ -n "$s" ] && echo "$u|$s"; done

sec RUNTIMES
for c in node bun deno python3 uv go java php ruby docker git curl openssl ssh; do
  p=$(command -v $c 2>/dev/null) && echo "$c|$p|$(ver "$p")"
done
sec RUNNING_BINARIES  # "(deleted)" = the process still runs a binary that an update replaced
# Match on the exe, not comm: Node 24 renames its main thread, so its comm is "MainThread".
for d in /proc/[0-9]*; do
  e=$(readlink "$d/exe" 2>/dev/null) || e="(needs root) $(cat "$d/comm" 2>/dev/null)"
  b=${e% (deleted)}
  case ${b##*[/ ]} in node|node-[0-9]*|nodejs|bun|deno|python|python[0-9]*|java|php-fpm*|ruby|ruby[0-9]*) echo "$e" ;; esac
done | sort | uniq -c | head -40

sec LISTENING; (ss -tulpn 2>/dev/null || netstat -tulpn 2>/dev/null) | head -80
sec CONTAINERS  # systemd's docker.socket starts dockerd on first use, so call docker only when dockerd already runs
dockerd_up() { grep -qsx dockerd /proc/[0-9]*/comm; }
if dockerd_up; then docker ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}' 2>/dev/null
elif command -v docker >/dev/null; then echo "dockerd not running: skipped"; fi
podman ps -a --format '{{.Names}}|{{.Image}}|{{.Status}}|{{.Ports}}' 2>/dev/null
sec IMAGES; dockerd_up && docker images --format '{{.Repository}}:{{.Tag}}|{{.CreatedSince}}' 2>/dev/null | head -60
sec SERVICES; systemctl list-units --type=service --state=running --no-legend 2>/dev/null | awk '{print $1}'
sec SNAP_FLATPAK; snap list 2>/dev/null; flatpak list --columns=application,version 2>/dev/null
sec GLOBAL_PACKAGES  # read package folders: npm and pip run code that a supply-chain attack can replace
{ for p in $(which -a npm 2>/dev/null | awk '!s[$0]++'); do r=$(readlink -f "$p"); echo "${r%/npm/bin/npm-cli.js}"; done
  p=$(sed -n 's/^prefix *= *//p' "$HOME/.npmrc" 2>/dev/null | tail -1); case $p in "~"/*) p=$HOME${p#"~"} ;; esac; [ -n "$p" ] && echo "$p/lib/node_modules"
  ls -d "$HOME/.local/share/pnpm/global"/*/node_modules "$HOME/.bun/install/global/node_modules" 2>/dev/null
  echo /usr/lib/node_modules; echo /usr/local/lib/node_modules
} | sort -u | while read -r d; do
  for m in "$d"/*/package.json "$d"/@*/*/package.json; do [ -f "$m" ] && echo "${m%/package.json}|$(sed -n 's/^[[:space:]]*"version": *"\([^"]*\)".*/\1/p' "$m" | head -1)"; done
done
# Read Python package folders: pip starts Python, and Python runs .pth files at startup.
ls -d /usr/lib/python3*/*-packages/*.*-info /usr/lib64/python3*/*-packages/*.*-info /usr/local/lib/python3*/*-packages/*.*-info "$HOME"/.local/lib/python3*/site-packages/*.*-info 2>/dev/null \
  | sed -E 's#.*/##; s/\.(dist|egg)-info$//' | head -80

sec SSH_CONFIG  # settings only
sshd -T 2>/dev/null | grep -E '^(permitrootlogin|passwordauthentication|pubkeyauthentication|port|gssapiauthentication) '

sec CREDENTIAL_FILES_PRESENT  # presence only, never contents
for f in .npmrc .pypirc .netrc .aws/credentials .docker/config.json .kube/config .config/gh/hosts.yml; do [ -e "$HOME/$f" ] && echo "$f"; done
ls "$HOME/.ssh" 2>/dev/null | grep -v -E '^(known_hosts|config|authorized_keys)' || true
