#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
STATE_DIR="$SKILL_DIR/state"
STATE_FILE="$STATE_DIR/device.env"

usage() {
  cat <<'EOF'
Build, install, and launch an iOS app on a physical iPhone.

Usage:
  run-ios-device.sh [options]

Options:
  --config PATH           Read shell-compatible env config file before options.
  --repo PATH             Repo/worktree root. Default: git root from CWD.
  --app-dir PATH          iOS app directory. Relative paths resolve under repo.
  --project PATH          .xcodeproj path. Relative paths resolve under repo.
  --workspace PATH        .xcworkspace path. Relative paths resolve under repo.
  --scheme NAME           Xcode scheme. Default: project basename.
  --device ID_OR_NAME     iPhone UDID or device name. Saved for future runs.
  --configuration NAME    Xcode configuration. Default: Debug.
  --derived-data PATH     DerivedData path. Default: <app-dir>/build/DerivedData-device.
  --clean                 Run clean before build.
  --no-launch             Build and install, but do not launch.
  --console               Attach device console after launch; waits until app exits.
  --reset-device          Forget saved iPhone before selecting.
  --no-save-device        Do not save selected iPhone.
  --verbose-build         Show full xcodebuild output. Default: -quiet.
  -h, --help              Show this help.

Environment:
  IOS_DEVICE_RUNNER_CONFIG  Same as --config.
  REPO                    Same as --repo.
  APP_DIR                 Same as --app-dir.
  PROJECT                 Same as --project.
  WORKSPACE               Same as --workspace.
  IOS_DEVICE_ID           Same as --device.
  CONFIGURATION           Same as --configuration.
  SCHEME                  Same as --scheme.
  DERIVED_DATA            Same as --derived-data.
EOF
}

log() { printf '\n==> %s\n' "$*"; }
warn() { printf 'warning: %s\n' "$*" >&2; }
fail() { printf 'error: %s\n' "$*" >&2; exit 1; }
shell_quote() { printf "%q" "$1"; }

load_config() {
  local path="$1"
  [ -f "$path" ] || fail "config file not found: $path"
  # shellcheck disable=SC1090
  . "$path"
}

abs_under_repo() {
  local path="$1"
  if [[ "$path" = /* ]]; then
    printf '%s\n' "$path"
  else
    printf '%s\n' "$REPO/$path"
  fi
}

save_device() {
  [ "$SAVE_DEVICE" -eq 1 ] || return 0
  [ -n "$DEVICE" ] || return 0
  mkdir -p "$STATE_DIR"
  {
    printf 'IOS_DEVICE_ID=%s\n' "$(shell_quote "$DEVICE")"
    printf 'IOS_DEVICE_NAME=%s\n' "$(shell_quote "${DEVICE_NAME:-}")"
    printf 'IOS_DEVICE_SAVED_AT=%s\n' "$(shell_quote "$(date -u +%Y-%m-%dT%H:%M:%SZ)")"
  } > "$STATE_FILE"
  log "Saved iPhone: ${DEVICE_NAME:-$DEVICE} ($DEVICE)"
}

set_xcode_container_args() {
  if [ -n "$WORKSPACE" ]; then
    XCODE_CONTAINER_ARGS=(-workspace "$WORKSPACE")
  else
    XCODE_CONTAINER_ARGS=(-project "$PROJECT")
  fi
}

parse_destinations() {
  awk '
    /\{ platform:iOS,/ && /arch:/ && !/Simulator/ && !/Any iOS Device/ {
      line = $0
      id = line
      sub(/^.* id:/, "", id)
      sub(/, name:.*$/, "", id)
      name = line
      sub(/^.* name:/, "", name)
      sub(/ \}.*$/, "", name)
      if (id != "" && name != "") print id "\t" name
    }
  ' "$1"
}

show_available_devices() {
  if [ -s "$DEST_FILE" ]; then
    awk -F '\t' '{ printf "  %d) %s (%s)\n", NR, $2, $1 }' "$DEST_FILE" >&2
  else
    printf '  none\n' >&2
  fi
}

find_device_line() {
  awk -F '\t' -v device="$1" '$1 == device || $2 == device { print; exit }' "$DEST_FILE"
}

select_device() {
  local show_output line count choice
  show_output="$(mktemp -t ios-device-runner-showdestinations.XXXXXX)"
  DEST_FILE="$(mktemp -t ios-device-runner-destinations.XXXXXX)"
  trap 'rm -f "$show_output" "${DEST_FILE:-}"' EXIT

  log "Reading available physical iOS destinations"
  if ! xcodebuild \
    "${XCODE_CONTAINER_ARGS[@]}" \
    -scheme "$SCHEME" \
    -showdestinations \
    > "$show_output"; then
    cat "$show_output" >&2 || true
    fail "could not query Xcode destinations"
  fi

  parse_destinations "$show_output" > "$DEST_FILE"

  if [ -n "$DEVICE" ]; then
    line="$(find_device_line "$DEVICE" || true)"
    if [ -n "$line" ]; then
      DEVICE="${line%%$'\t'*}"
      DEVICE_NAME="${line#*$'\t'}"
      return 0
    fi

    warn "saved/selected iPhone not available to Xcode: $DEVICE"
    printf 'Available physical iOS destinations:\n' >&2
    show_available_devices
    fail "connect/unlock/trust saved iPhone, or rerun with --reset-device / --device <id-or-name>"
  fi

  count="$(grep -c . "$DEST_FILE" || true)"
  case "$count" in
    0)
      xcrun xctrace list devices >&2 || true
      fail "no available physical iPhone destination"
      ;;
    1)
      line="$(sed -n '1p' "$DEST_FILE")"
      DEVICE="${line%%$'\t'*}"
      DEVICE_NAME="${line#*$'\t'}"
      save_device
      ;;
    *)
      printf 'Multiple physical iOS destinations available:\n' >&2
      show_available_devices
      if [ -t 0 ]; then
        printf 'Choose iPhone number: ' >&2
        read -r choice
        case "$choice" in ''|*[!0-9]*) fail "invalid choice: $choice" ;; esac
        if [ "$choice" -lt 1 ] || [ "$choice" -gt "$count" ]; then
          fail "choice out of range: $choice"
        fi
        line="$(sed -n "${choice}p" "$DEST_FILE")"
        DEVICE="${line%%$'\t'*}"
        DEVICE_NAME="${line#*$'\t'}"
        save_device
      else
        fail "rerun with --device <id-or-name> to choose and save iPhone"
      fi
      ;;
  esac
}

run_xcodebuild() {
  local args=("${XCODE_CONTAINER_ARGS[@]}")
  args+=(
    -scheme "$SCHEME"
    -configuration "$CONFIGURATION"
    -destination "$DESTINATION"
    -derivedDataPath "$DERIVED_DATA"
  )

  if [ "$VERBOSE_BUILD" -eq 1 ]; then
    xcodebuild "${args[@]}" "$@"
  else
    xcodebuild -quiet "${args[@]}" "$@"
  fi
}

find_one_project() {
  local search_root="$1" found count
  found="$(find "$search_root" \
    -path '*/build/*' -prune -o \
    -path '*/DerivedData/*' -prune -o \
    -name '*.xcodeproj' -type d -print | sort)"
  count="$(printf '%s\n' "$found" | sed '/^$/d' | wc -l | tr -d ' ')"
  case "$count" in
    0) fail "no .xcodeproj found; pass --project or --app-dir" ;;
    1) printf '%s\n' "$found" ;;
    *)
      printf 'Multiple .xcodeproj files found:\n%s\n' "$found" >&2
      fail "pass --project <path>"
      ;;
  esac
}

find_workspace_for_project() {
  local project_dir="$1" workspace
  workspace="$project_dir/project.xcworkspace"
  if [ -d "$workspace" ]; then
    printf '%s\n' "$workspace"
  fi
}

CONFIG_FILE="${IOS_DEVICE_RUNNER_CONFIG:-}"
ORIGINAL_ARGS=("$@")
while [ "$#" -gt 0 ]; do
  case "$1" in
    --config) [ "$#" -ge 2 ] || fail "--config requires PATH"; CONFIG_FILE="$2"; shift 2 ;;
    *) shift ;;
  esac
done
if [ -n "$CONFIG_FILE" ]; then
  load_config "$CONFIG_FILE"
fi
set -- "${ORIGINAL_ARGS[@]}"

REPO="${REPO:-}"
APP_DIR="${APP_DIR:-}"
PROJECT="${PROJECT:-}"
WORKSPACE="${WORKSPACE:-}"
DEVICE="${IOS_DEVICE_ID:-}"
DEVICE_FROM_INPUT=0
DEVICE_NAME=""
CONFIGURATION="${CONFIGURATION:-Debug}"
SCHEME="${SCHEME:-}"
DERIVED_DATA="${DERIVED_DATA:-}"
CLEAN=0
LAUNCH=1
CONSOLE=0
RESET_DEVICE=0
SAVE_DEVICE=1
VERBOSE_BUILD=0

[ -n "$DEVICE" ] && DEVICE_FROM_INPUT=1

while [ "$#" -gt 0 ]; do
  case "$1" in
    --config) [ "$#" -ge 2 ] || fail "--config requires PATH"; CONFIG_FILE="$2"; shift 2 ;;
    --repo) [ "$#" -ge 2 ] || fail "--repo requires PATH"; REPO="$2"; shift 2 ;;
    --app-dir) [ "$#" -ge 2 ] || fail "--app-dir requires PATH"; APP_DIR="$2"; shift 2 ;;
    --project) [ "$#" -ge 2 ] || fail "--project requires PATH"; PROJECT="$2"; shift 2 ;;
    --workspace) [ "$#" -ge 2 ] || fail "--workspace requires PATH"; WORKSPACE="$2"; shift 2 ;;
    --device) [ "$#" -ge 2 ] || fail "--device requires ID_OR_NAME"; DEVICE="$2"; DEVICE_FROM_INPUT=1; shift 2 ;;
    --configuration) [ "$#" -ge 2 ] || fail "--configuration requires NAME"; CONFIGURATION="$2"; shift 2 ;;
    --scheme) [ "$#" -ge 2 ] || fail "--scheme requires NAME"; SCHEME="$2"; shift 2 ;;
    --derived-data) [ "$#" -ge 2 ] || fail "--derived-data requires PATH"; DERIVED_DATA="$2"; shift 2 ;;
    --clean) CLEAN=1; shift ;;
    --no-launch) LAUNCH=0; shift ;;
    --console) CONSOLE=1; shift ;;
    --reset-device) RESET_DEVICE=1; DEVICE=""; DEVICE_FROM_INPUT=0; shift ;;
    --no-save-device) SAVE_DEVICE=0; shift ;;
    --verbose-build) VERBOSE_BUILD=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) fail "unknown option: $1" ;;
  esac
done

if [ -z "$REPO" ]; then
  if REPO_FROM_GIT="$(git rev-parse --show-toplevel 2>/dev/null)"; then
    REPO="$REPO_FROM_GIT"
  else
    REPO="$PWD"
  fi
fi

REPO="$(cd "$REPO" && pwd)" || fail "repo not found: $REPO"

if [ -n "$APP_DIR" ]; then
  APP_DIR="$(abs_under_repo "$APP_DIR")"
  APP_DIR="$(cd "$APP_DIR" && pwd)" || fail "app dir not found: $APP_DIR"
fi

if [ -n "$PROJECT" ]; then
  PROJECT="$(abs_under_repo "$PROJECT")"
else
  if [ -n "$APP_DIR" ]; then
    PROJECT="$(find_one_project "$APP_DIR")"
  else
    PROJECT="$(find_one_project "$REPO")"
  fi
fi
[ -d "$PROJECT" ] || fail "Xcode project not found: $PROJECT"

if [ -z "$APP_DIR" ]; then
  APP_DIR="$(cd "$(dirname "$PROJECT")" && pwd)"
fi

if [ -n "$WORKSPACE" ]; then
  WORKSPACE="$(abs_under_repo "$WORKSPACE")"
elif WORKSPACE_FOUND="$(find_workspace_for_project "$PROJECT")" && [ -n "$WORKSPACE_FOUND" ]; then
  WORKSPACE="$WORKSPACE_FOUND"
fi
if [ -n "$WORKSPACE" ]; then
  [ -d "$WORKSPACE" ] || fail "Xcode workspace not found: $WORKSPACE"
fi

if [ -z "$SCHEME" ]; then
  SCHEME="$(basename "$PROJECT" .xcodeproj)"
fi

set_xcode_container_args

if [ "$RESET_DEVICE" -eq 1 ]; then
  rm -f "$STATE_FILE"
  log "Forgot saved iPhone"
elif [ "$DEVICE_FROM_INPUT" -eq 0 ] && [ -f "$STATE_FILE" ]; then
  # shellcheck disable=SC1090
  . "$STATE_FILE"
  DEVICE="${IOS_DEVICE_ID:-}"
  DEVICE_NAME="${IOS_DEVICE_NAME:-}"
  [ -n "$DEVICE" ] && log "Using saved iPhone: ${DEVICE_NAME:-$DEVICE} ($DEVICE)"
fi

if [ -z "$DERIVED_DATA" ]; then
  DERIVED_DATA="$APP_DIR/build/DerivedData-device"
else
  DERIVED_DATA="$(abs_under_repo "$DERIVED_DATA")"
fi
mkdir -p "$DERIVED_DATA"

select_device
[ "$DEVICE_FROM_INPUT" -eq 1 ] && save_device

DESTINATION="platform=iOS,id=$DEVICE"

log "Repo: $REPO"
log "App dir: $APP_DIR"
log "Project: $PROJECT"
[ -n "$WORKSPACE" ] && log "Workspace: $WORKSPACE"
log "Scheme: $SCHEME"
log "Device: ${DEVICE_NAME:-$DEVICE} ($DEVICE)"
log "Destination: $DESTINATION"
log "DerivedData: $DERIVED_DATA"

if [ "$CLEAN" -eq 1 ]; then
  log "Cleaning $SCHEME"
  run_xcodebuild clean
fi

log "Building $SCHEME for iPhone"
run_xcodebuild -allowProvisioningUpdates build

PRODUCTS_DIR="$DERIVED_DATA/Build/Products/${CONFIGURATION}-iphoneos"
APP_PATH="$(find "$PRODUCTS_DIR" -maxdepth 1 -type d -name '*.app' -print 2>/dev/null | head -n 1)"
[ -n "$APP_PATH" ] || fail "built .app not found under $PRODUCTS_DIR"
[ -d "$APP_PATH" ] || fail "built .app path missing: $APP_PATH"

BUNDLE_ID="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$APP_PATH/Info.plist" 2>/dev/null || true)"
[ -n "$BUNDLE_ID" ] || BUNDLE_ID="$(plutil -extract CFBundleIdentifier raw -o - "$APP_PATH/Info.plist" 2>/dev/null || true)"
[ -n "$BUNDLE_ID" ] || fail "CFBundleIdentifier not found in $APP_PATH/Info.plist"

log "Installing $APP_PATH"
xcrun devicectl device install app --device "$DEVICE" "$APP_PATH"

if [ "$LAUNCH" -eq 1 ]; then
  log "Launching $BUNDLE_ID"
  if [ "$CONSOLE" -eq 1 ]; then
    xcrun devicectl device process launch --device "$DEVICE" --terminate-existing --console "$BUNDLE_ID"
  else
    xcrun devicectl device process launch --device "$DEVICE" --terminate-existing --timeout 30 "$BUNDLE_ID"
  fi
else
  log "Launch skipped"
fi

log "Done"
