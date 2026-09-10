---
name: boxd-subagents
description: Delegate coding tasks to agents running in forked boxd VMs, collect their changes, and resume their native sessions. Use when the user wants remote subagents or isolated cloud workers. Currently supports the existing codex-base VM; the local coordinator can be Codex, Claude Code, or Pi.
---

# Subagents on boxd

Keep the coordinator local and run a headless agent in each disposable boxd fork. Use the local harness's native subagents or background command tools to drive workers when available. A remote session is a separate agent, not automatically an entry in the local harness's subagent registry. Herdr can hold the local session; no remote TTY, Herdr server, or custom orchestration service is required.

## Available base

**`codex-base` already exists** in the configured boxd account. It is a private, normally hibernated Ubuntu VM with Codex, a verified ChatGPT login, and `bubblewrap` (`bwrap`) for Codex's Linux sandbox. Its `/home/boxd/proof-repo` is a synthetic example, not the user's project. Set up the actual project on each worker.

Pi and Claude bases have not been provisioned. Do not infer that `pi-base` or `claude-base` exists or install another harness just because the local coordinator uses it. When those bases are added, document their verified headless launch and resume commands here.

Check the active account and base before work:

```bash
boxd auth
boxd machine get codex-base --json
```

If the base is missing, check account context before creating a replacement. Fork the base rather than doing task work on it. Forks copy files, memory, and running processes; a base must not have an active coordinator or worker agent to duplicate. A hibernated source can remain asleep while its fork runs.

## Delegate a task

Use a unique worker name per task, within the user's requested concurrency and budget. Replace `WORKER` and the example repository path below with the actual values. Shell-quote paths; transfer prompts as files instead of interpolating task text into shell commands.

```bash
boxd machine fork codex-base WORKER --auto-suspend-timeout=0 --auto-hibernate-timeout=0 --json
boxd machine exec WORKER -- 'codex login status && command -v bwrap'
```

Both idle timers watch network traffic, not agent activity. Keep them disabled during work. Never share the private worker with an organization as a setup shortcut: sharing changes credential handling. Treat inherited credentials as sensitive, and do not copy local auth files into a worker. If login is missing, have the user run `boxd machine exec WORKER -- 'codex login --device-auth'` and complete browser sign-in.

Clone or transfer the authorized project, install its dependencies, and prepare a feature checkout following its branch/worktree instructions. Do not change code on main. Record the starting commit. For uncommitted local work, explicitly include the relevant changes; a clone alone omits them. `boxd machine cp -r` can nest the source directory under the destination, so inspect the resulting path before running commands.

Write `task.txt` with the outcome, allowed scope, repository path, tests, and expected deliverables. Ask the worker to leave changes for the coordinator to inspect and commit. Then:

```bash
boxd machine exec WORKER -- 'mkdir -p /home/boxd/boxd-job'
boxd machine cp ./task.txt WORKER:/home/boxd/boxd-job/task.txt
boxd machine exec WORKER -- 'cd /home/boxd/task && bash -o pipefail -c "codex exec --sandbox workspace-write --json -o /home/boxd/boxd-job/final.txt - < /home/boxd/boxd-job/task.txt 2> /home/boxd/boxd-job/stderr.log | tee /home/boxd/boxd-job/events.jsonl"'
```

Run long calls through the local harness's background execution facility and surface progress. Keep local stdout and stderr separate. Do not add boxd's outer `--json` when consuming Codex's JSONL stream; it changes the output envelope. The remote log remains available if local output is truncated or the connection fails.

Record the worker name, repository path, starting commit, and `thread_id` from `thread.started`. Read the final agent message and terminal event. **Exit code zero or `turn.completed` does not prove task success**: Codex can finish by reporting a blocker. Independently run the requested checks and inspect the changed files.

If execution reports missing `bwrap`, install the Ubuntu `bubblewrap` package on the worker and resume the same session. The `workspace-write` sandbox may protect `.git` even when source edits work. Inspect and commit the authorized files with a separate coordinating `boxd machine exec`, or collect a patch for local integration; do not disable the sandbox just to commit.

## Follow up or resume

Use the explicit thread ID on the same VM and in the same repository. Avoid `--last` when multiple jobs exist. Upload a new instruction file and use separate output files for each turn:

```bash
boxd machine cp ./followup.txt WORKER:/home/boxd/boxd-job/followup.txt
boxd machine exec WORKER -- 'cd /home/boxd/task && bash -o pipefail -c "codex exec --sandbox workspace-write resume --json -o /home/boxd/boxd-job/followup-final.txt THREAD_ID - < /home/boxd/boxd-job/followup.txt 2> /home/boxd/boxd-job/followup-stderr.log | tee /home/boxd/boxd-job/followup-events.jsonl"'
```

A saved native session can resume after VM hibernation and wake. Hibernate only when no work is running. A local timeout or disconnect does not prove the remote agent stopped: inspect that worker's saved logs and process state before retrying. Do not start a second writer against the same checkout or native session. This attached-exec workflow does not promise unattended completion when the coordinator's laptop sleeps; use the existing remote process manager if independent execution is explicitly needed.

## Collect and clean up

Retrieve the diff or Git bundle, test results, final response, and native session before deleting a worker. Locate the exact rollout under `~/.codex/sessions` by its thread ID; do not copy the entire Codex home or credentials. Return enough provenance to continue or audit the work: worker, thread ID, starting and resulting commits, and local artifact paths. Verify a downloaded bundle or patch before discarding its only remote copy.

Delete only completed disposable workers created for this task, after collecting their results:

```bash
boxd machine remove WORKER --confirm --json
```

If recovery or another turn is needed, keep the worker and hibernate it once idle. Preserve `codex-base`; if it was woken for maintenance, hibernate it again. Confirm final machine states so a failed task does not leave a worker running indefinitely.

## Verified behavior

The initial Codex proof forked this base's predecessor, fixed five failing tests, hibernated and woke the worker, resumed the same thread, recalled prior conversation context, and passed six tests after a follow-up change. The source checkout stayed unchanged. Git history and the native session were retrieved before worker deletion. The base was then renamed `codex-base`; its login and `bwrap` were verified again.

This validates headless task execution and later session resume, not live mid-turn steering or automatic worker-completion wakeups. Start with the proven CLI flow; add another protocol only when the requested interaction requires it.
