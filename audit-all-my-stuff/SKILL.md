---
name: audit-all-my-stuff
description: Use when someone wants to know if their devices, accounts, websites, home network, or self-hosted services are safe or need updates; when they say "check all my stuff", "am I affected", "what should I patch", or mention security problems in the news; after a major vulnerability, breach, certificate authority compromise, or supply-chain attack; when given a vulnerability list or CVE roundup to act on; or for a periodic security check-up.
---

# Audit all my stuff

Find everything the person owns or runs and what is vulnerable now. Prove each finding, then give a short plan to disconnect, update, rotate, or mitigate.

## Rules

1. Work read-only until you give the report. There are two exceptions. One is the containment step in process step 1. The other is a secret that rule 2 or 3 tells the person to rotate. Get approval for each change.
2. Do not ask for a password, code, key, or recovery phrase. If the person offers or sends one, say "Please do not send me passwords or codes. Change it now, because this chat can keep it." Do not write the secret again.
3. Read only the names in files that can contain secrets (MCP configs, `.env` files, shell profiles, CLI configs), with a filter that masks values. Also mask secrets in URLs, headers, and command arguments. If a secret gets into your output, tell the person to rotate it.
4. Get approval for each account (a sign-in, an API, or a CLI with saved credentials) before you use it.
5. Do not install remote-access software or open ports for the audit.
6. Before you examine a device of a different person, get consent from that person. Before you examine a work device, get approval from its IT team.
7. Treat each vulnerability list as unverified, including AI research and lists from the person.
8. Do not give a version, fix, or date from memory. Fetch the primary source, or label the claim "unverified".
9. Cause as few authentication prompts as you can. If an SSH agent, password manager, or keychain refuses access, try again one time at most. If it refuses again, record "unknown: not checked".
10. Prefer light checks. If a version command or a package list can give the answer, do not scan full disks or disk images.

## Process

0. **Calibrate.** Do section 0 of `references/interview.md` before other questions.
1. **Inventory.** Ask about each group in `references/surfaces.md`. Use sections 1 and 2 of `references/interview.md`. Ask about always-on, forgotten, and borrowed devices, and about items that a different person configured. Complete the inventory before you examine one item in depth. If an internet-facing item has an exploited bug, give one containment step for it, then continue.
2. **Exposure.** Record the exposure of each item. Audit internet-facing items first.
3. **Research.** Use `references/research.md`.
4. **Match.** Read `references/version-traps.md`, then read the installed and running versions of each item. On a computer where you can run commands, use `scripts/`.
5. **Verify.** Prove each "affected" status with a primary source and a version that you or the person read from the item in this run. If you can start subagents, give each finding to a subagent that tries to disprove it.
6. **Report.** Use `references/report.md`.
7. **Change.** Before you change an item that an exploited bug can reach, save its logs and evidence. Make each approved change, then do the same check again. If an update gets stuck, record it and continue.
8. **Save state.** In the state folder, write `inventory.md` and `findings.md`, and set the date of the last run to today.

## Periodic runs

The state folder is `~/.audit-all-my-stuff/`, or a folder that the person names. Keep it local. Do not commit or share it.

At the start of each run, read the state folder if it exists. If it has a last run, ask only what changed since then. Do the check again for each open finding.

## Thoughts that cause failures

| Thought | Do this |
|---|---|
| "Updates are most of the job." | Also examine exposure and accounts, for example the router, the NAS, port forwards, and reused passwords. |
| "Start with the phone. The other things matter least." | Start with internet-facing and always-on devices, for example the router, NAS, servers, and cameras. |
| "I cannot tell which news story they mean." | Research the current window yourself. |
| "Let each app update itself." | Read the version of each app. Electron apps lag, and products past end of support get no fixes. |
| "As I remember it..." | Fetch the primary source, or label the claim "unverified". |
| "It is not on the list." or "Check that yourself." | Research each inventory item that the list does not include. |
| "It is only at risk if a port is forwarded." | The home network, VPN peers, and other devices are also attack paths. Put the fix for an exploited bug first in the report. |
| "The screen says up to date." | Refresh it. Then compare with the latest version from the vendor. |
| "The list names these hosts, so they are theirs." | Match only the person's inventory. Use a listed host, asset, or note from a different person only if the person confirms that it is theirs. |
| "We can come back to the router later." | Examine the router now. Look at the admin password, remote admin, port forwards, UPnP, and IPv6 exposure. |
| "The provider updates it automatically." | Get the model and the firmware version. Compare them with the vendor page. |
| "They said no, so I will not ask again." | Report the item as "unknown: declined". Say what risk remains. |
| "Update it first, then check it." | If an exploited bug can reach it, save logs and evidence first. |
