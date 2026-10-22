---
name: audit-all-my-stuff
description: Use when someone wants to know if their devices, accounts, websites, home network, or self-hosted services are safe or need updates; when they say "check all my stuff", "am I affected", "what should I patch", or mention security problems in the news; after a major vulnerability, breach, certificate authority compromise, or supply-chain attack; when given a vulnerability list or CVE roundup to act on; or for a periodic security check-up.
---

# Audit all my stuff

Find all the things the person owns or runs. Find what is vulnerable at this time. Prove each finding. Give a short plan: disconnect, update, rotate, mitigate.

## Rules

1. Work read-only first. Get approval for each change before you make it.
2. Do not ask for a password, code, key, or recovery phrase. If the person offers one, stop them. If they sent it, do not write it again. Tell them to change it immediately, because the chat keeps it.
3. Do not read a file that can contain secrets in full: MCP configs, `.env` files, shell profiles, CLI configs. Extract only names, with a filter that masks values. Also mask secrets in URLs, headers, and command arguments. If a secret gets into your output, tell the person to rotate it.
4. Get approval before you use an account: a sign-in, an API, or a CLI with saved credentials. Approval for one account does not apply to a different account.
5. Do not install remote-access software or open ports for the audit.
6. Examine the devices of a different person only with the consent of that person. Examine a work device only with approval from its IT team.
7. Treat each vulnerability list as unverified. This includes AI research and lists from the person. A list can name hosts that are not theirs.
8. Do not give a version, fix, or date from memory. Fetch the primary source, or label the claim "unverified".
9. Cause as few authentication prompts as you can. If an SSH agent, password manager, or keychain refuses access, try one more time at most. Then record "unknown: not checked".
10. Prefer light checks. Do not scan full disks or disk images if a version command or a package list can answer.

## Process

0. **Calibrate.** Do section 0 of `references/interview.md` before other questions. Tell the person what you can see and what you cannot see.
1. **Inventory.** Use each group in `references/surfaces.md` and sections 1 to 3 of `references/interview.md` for their level. Ask about always-on, forgotten, and borrowed devices. Ask about things that a different person configured. Complete the inventory of all groups before you examine one item in depth. Exception: for an internet-facing item with an exploited bug, give one containment step, then continue the inventory.
2. **Exposure.** For each item, record if the internet, the home network, or a VPN can connect to it. Audit internet-facing items first.
3. **Research.** Use `references/research.md` and the newest feed in `feeds/` if it covers part of the window. With a supplied list, verify it and research the inventory items that it does not include. Also research each part of the window that no list includes.
4. **Match.** Read the version from each item: each installed copy and each running process. Read `references/version-traps.md`. On a computer where you can run commands, use `scripts/`.
5. **Verify.** Prove each "affected" result with a primary source and a version read from the item in this run, by you or by the person. If you can start subagents, give each finding to a subagent that tries to disprove it.
6. **Report.** Use `references/report.md`. Start with the most urgent actions for today.
7. **Change.** If an exploited bug can reach the item, save its logs and evidence first. Make each approved change, then do the same check again.
8. **Save state.** Write the inventory, the findings, and the date of this run to the state folder.

Do not change anything before the report. There are two exceptions: the containment step in step 1, and a secret that rule 2 or 3 tells the person to change. If one update gets stuck, record it and continue with the other items.

## Periodic runs

The state folder is `~/.audit-all-my-stuff/`, or a folder that the person names. Keep `inventory.md`, `findings.md`, and the date of the last run in it. The folder is a map of attack surface. Keep it local. Do not commit or share it.

On each subsequent run, read the state folder. Ask only what changed. Research only the time since the last run. Do the check again for each open finding.

## Thoughts that cause failures

These thoughts came from agents that did this task without this skill.

| Thought | Do this |
|---|---|
| "Updates are most of the job." | Also check exposure and accounts: router, NAS, port forwards, reused passwords. |
| "Start with the phone. The other things matter least." | Start with internet-facing and always-on devices: router, NAS, servers, cameras. |
| "I cannot tell which news story they mean." | Research the current window yourself. |
| "Let each app update itself." | Check the version. Electron apps lag. Products past end of support get no fixes. |
| "As I remember it..." | Fetch the source, or label the claim "unverified". |
| "It is not on the list." or "Check that yourself." | Research each inventory item that the list does not include. |
| "It is only at risk if a port is forwarded." | The home network, VPN peers, and other devices are attack paths. Install the fix for an exploited bug immediately. |
| "The screen says up to date." | Compare with the latest version from the vendor. Refresh and check again. |
| "The list names these hosts, so they are theirs." | Match only the inventory of the person. |
| "We can come back to the router later." | Check the router now: admin password, remote admin, port forwards, UPnP, IPv6 exposure. |
| "The provider updates it automatically." | Get the model and the firmware version. Compare them with the vendor page. |
| "They said no, so I will not ask again." | Record the item as "unknown: declined" in the report. Say what risk remains. |
| "Update it first, then check it." | If an exploited bug can reach it, save logs and evidence first. |
