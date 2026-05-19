---
name: ios-device-runner
description: Build, install, and launch an iOS app on a physical iPhone using xcodebuild and xcrun devicectl. Use when the user asks to run, build, test, install, or launch an iOS app on a connected device.
---

# iOS Device Runner

## Session activation

When this skill is invoked or loaded, treat it as enabled for the rest of the current agent session:

- Run the helper script from the current iOS app worktree, unless user provided different arguments.
- After future code edits that touch the configured iOS app directory, run the helper script automatically once edits finish, unless user says not to run builds.
- If build/install/launch fails, report exact failing command and key error lines. Do not change signing settings unless user asks.

## Command

Preferred from repo root containing one iOS app project:

```bash
./ios-device-runner/scripts/run-ios-device.sh --app-dir apps/my-ios-app --scheme MyApp
```

For repeated use, copy `ios-device-runner/config.example.env` to a private path, edit it, then run:

```bash
./ios-device-runner/scripts/run-ios-device.sh --config /path/to/my-app.env
```

Useful variants:

```bash
# Explicit config file
./ios-device-runner/scripts/run-ios-device.sh --config ~/.config/ios-device-runner/my-app.env

# Explicit repo/app/project
./ios-device-runner/scripts/run-ios-device.sh --repo /path/to/repo --app-dir apps/my-ios-app --scheme MyApp
./ios-device-runner/scripts/run-ios-device.sh --project apps/my-ios-app/MyApp.xcodeproj --scheme MyApp
./ios-device-runner/scripts/run-ios-device.sh --workspace apps/my-ios-app/MyApp.xcworkspace --scheme MyApp

# Choose/save different phone
./ios-device-runner/scripts/run-ios-device.sh --reset-device
./ios-device-runner/scripts/run-ios-device.sh --device <device-udid-or-name>

# Clean build first
./ios-device-runner/scripts/run-ios-device.sh --clean

# Install only, skip launch
./ios-device-runner/scripts/run-ios-device.sh --no-launch

# Stream app console after launch
./ios-device-runner/scripts/run-ios-device.sh --console
```

## Configuration

CLI flags and equivalent environment variables:

| Flag | Env | Meaning |
| --- | --- | --- |
| `--config PATH` | `IOS_DEVICE_RUNNER_CONFIG` | Shell-compatible env file. Loaded before CLI options, so flags can override it. |
| `--repo PATH` | `REPO` | Repo/worktree root. Default: git root from current directory. |
| `--app-dir PATH` | `APP_DIR` | iOS app directory. Relative paths resolve under repo. |
| `--project PATH` | `PROJECT` | `.xcodeproj` path. Relative paths resolve under repo. |
| `--workspace PATH` | `WORKSPACE` | `.xcworkspace` path. Relative paths resolve under repo. |
| `--scheme NAME` | `SCHEME` | Xcode scheme. If omitted, defaults to project basename. |
| `--configuration NAME` | `CONFIGURATION` | Xcode configuration. Default: `Debug`. |
| `--derived-data PATH` | `DERIVED_DATA` | DerivedData path. Default: `<app-dir>/build/DerivedData-device`. |
| `--device ID_OR_NAME` | `IOS_DEVICE_ID` | Physical iPhone UDID or device name. Saved for future runs. |

## Device memory

Typical private config:

```bash
REPO=/path/to/repo
APP_DIR=apps/MyApp
SCHEME=MyApp
# PROJECT=apps/MyApp/MyApp.xcodeproj
# WORKSPACE=apps/MyApp/MyApp.xcworkspace
# IOS_DEVICE_ID=<optional device UDID or name>
```

Selected iPhone is saved locally at:

```text
./ios-device-runner/state/device.env
```

`state/*.env` is ignored by git. Do not commit device identifiers.

Selection behavior:

1. `--device` or `IOS_DEVICE_ID` wins and gets saved unless `--no-save-device` is set.
2. Existing saved device is used if available to Xcode.
3. If no saved device and exactly one physical iPhone is available, use/save it.
4. If multiple phones are available in interactive shell, ask user which one.
5. If multiple phones are available non-interactively, print choices and ask caller to rerun with `--device <id-or-name>`.

## Agent workflow

1. Read nearest app/repo instructions first (`AGENTS.md`, `CLAUDE.md`, README, or project docs).
2. Run helper from current worktree after iOS app edits.
3. If Xcode says destination unavailable, run helper with `--reset-device` or ask user to connect/unlock/trust selected iPhone.
4. Signing failures: surface Xcode error; ask user to fix account/team/device trust in Xcode.
