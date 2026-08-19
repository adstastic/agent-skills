---
name: pr-to-tuicr
description: Turn current changes into a GitHub pull request, using an existing open PR or linked worktree when available and otherwise copying the changes into a new linked worktree, then open the PR in tuicr in a new Herdr pane. Use when the user asks to PR changes and review them in tuicr or Herdr.
compatibility: Requires Git, gh, tuicr, Herdr, jq, and HERDR_ENV=1.
---

# PR to tuicr

Prepare current changes as a GitHub pull request, then open that pull request for user-led review in tuicr.

Load and follow `herdr` and `tuicr`. This workflow selects the repository and pane topology. The specialist skills own their CLI details. Treat the tuicr session as user-led review: do not add agent comments or review your own patch.

## Safety contract

- Invocation authorizes the local branch, linked worktree, and commit operations necessary for this workflow.
- Invocation does not authorize a push or pull-request mutation.
- Immediately before each public action, show the exact content, destination, and command. Wait for explicit confirmation.
- Never use force push, destructive reset, stash/drop, or worktree removal to move changes.
- Never include unrelated changes. Ask for scope when the dirty state is not one coherent change.
- Keep the source checkout unchanged when you copy changes to a new worktree.

## 1. Preflight before mutation

Run:

```bash
test "${HERDR_ENV:-}" = 1
command -v git gh herdr jq tuicr
gh auth status
herdr --help
herdr pane
git status --short --branch
git diff --stat
git diff --cached --stat
git diff --name-only --diff-filter=U
git remote
```

Stop before local or public mutation when:

- this process is not in a Herdr-managed pane,
- a necessary command or GitHub authentication is unavailable,
- the repository has an unresolved merge,
- the change scope is ambiguous, or
- no commit or working-tree change exists relative to the intended base.

Read repository instructions and existing pull-request templates. Determine:

- repository root,
- current branch and HEAD,
- checkout repository, fork parent, and default branch,
- candidate base repositories,
- push remote, head repository owner, and credential-free canonical URL,
- checks required before review.

Use `gh repo view --json nameWithOwner,url,defaultBranchRef,isFork,parent` to resolve repository identity.

Never print a raw Git remote URL. It can contain credentials. Use the remote name for Git commands and the canonical credential-free GitHub URL for display.

Use the installed CLIs as the syntax authority. Do not probe mutating Herdr commands without arguments.

## 2. Select pull request and worktree

Query the checkout repository and its fork parent, when present, for an open pull request from the exact head owner and branch. Do not hide `gh` or API errors. Authentication, network, repository, and API errors stop the workflow.

For each candidate base repository:

```bash
PR_LIST=$(gh pr list --repo <candidate-owner/repo> --state open --limit 1000 \
  --json number,url,state,title,baseRefName,headRefName,headRepositoryOwner)
PR_MATCHES=$(printf '%s\n' "$PR_LIST" | jq -c \
  --arg owner '<head-owner>' \
  --arg branch '<head-branch>' \
  '[.[] | select(
    .headRepositoryOwner.login == $owner and
    .headRefName == $branch
  )]')
```

Combine matches from all candidate repositories. One match is the existing pull request and defines its base. If multiple matches exist, ask which pull request to use. If none exist, determine the intended base repository and branch. For a fork without a user-named destination, ask whether the base is the fork or its parent.

Use this precedence:

1. If the current branch has an `OPEN` pull request, use the current checkout and that pull request.
2. Otherwise, if the current checkout is a linked worktree, use the current checkout.
3. Otherwise, create a new linked worktree and copy the current changes into it.

Git identifies a linked checkout when its absolute Git directory differs from its absolute common Git directory:

```bash
git rev-parse --absolute-git-dir
git rev-parse --path-format=absolute --git-common-dir
```

A closed or merged pull request does not count as an open pull request.

### Create the linked worktree only when necessary

Choose a short branch name from the change purpose and follow repository convention. Use `review/<slug>` only when no convention exists. Choose an unused sibling path outside the source checkout.

Create the branch and worktree from current `HEAD`:

```bash
git worktree add -b <branch> <new-worktree-path> HEAD
```

Copy tracked changes without modifying the source checkout:

```bash
if ! git -C <source-root> diff --quiet HEAD --; then
  git -C <source-root> diff --binary HEAD |
    git -C <new-worktree-path> apply --index
fi
```

Copy non-ignored untracked files with NUL-delimited paths:

```bash
while IFS= read -r -d '' file; do
  mkdir -p "<new-worktree-path>/$(dirname "$file")"
  cp -pP -- "<source-root>/$file" "<new-worktree-path>/$file"
done < <(git -C <source-root> ls-files --others --exclude-standard -z)
```

Compare the changed-path set, tracked diff relative to `HEAD`, untracked-file list, and copied file contents. The staging columns can differ because `git apply --index` stages the copied tracked changes. Continue only when the destination contains the complete intended change. Do not clean the source checkout. The unchanged source is the rollback path.

If the current linked worktree has no branch or uses the base branch, create a feature branch before you commit.

## 3. Prepare one reviewable commit

In the selected worktree:

1. Inspect the complete branch delta and working-tree delta.
2. Confirm that the branch contains no unrelated commits relative to the base.
3. Run the repository's focused and required checks.
4. Stage only the intended paths.
5. Inspect the staged diff, including deletions and untracked files.
6. Commit with an outcome-focused message.

Do not change implementation merely to make the pull request look cleaner. If checks fail, stop and report the failure unless the user asks for a fix.

Build an exact pull-request title and body from the verified change. The body must contain:

```markdown
## Summary
- <observable change>

## Verification
- `<command>` — <result>
```

Do not add issue-closing text, reviewers, labels, projects, or draft state. Add them only when the user or repository policy requires them.

## 4. Public-action confirmation

Fetches and local commits are not publication. Pushes and pull-request mutations are public actions.

Immediately before publication, show this proposal with resolved values:

```text
Destination repository: <owner/repo> — <repository URL>
Push destination: <remote name> — <credential-free canonical GitHub URL> — refs/heads/<head branch>
Commits: <SHA and subject for each unpublished commit>
Files: <changed paths>
Pull request: <base owner/repo>:<base branch> <- <head owner>:<head branch>
Title: <exact title>
Body:
<exact body>
Draft: yes|no
Commands:
  git -C <worktree> push -u <remote> <head branch>
  gh pr create --repo <base owner/repo> --base <base> --head <head spec> --title <title> --body-file <file>
```

For an existing pull request, show its number and URL. Omit `gh pr create`. Show the exact push that will update it.

Shell-quote every resolved command argument. Bash arrays plus `printf '%q ' "${ARGS[@]}"` are safe for display. Execute the same argument vector without `eval` after confirmation.

Ask for explicit confirmation of these exact actions. The initial request to use this skill is not confirmation. Re-resolve the state after confirmation. If content, destination, branch, commits, or commands changed, show the proposal again and reconfirm.

After confirmation:

1. Push the branch without force.
2. Create the pull request with explicit `--repo`, `--base`, `--head`, `--title`, and `--body-file` values when no open pull request exists. For a fork, use `<head-owner>:<branch>` as the head spec.
3. Capture the returned pull-request URL.
4. If push succeeds but pull-request creation fails, report the pushed branch. Do not create a different pull request without a new confirmation.

If an open pull request already contains all intended commits, skip publication and use its URL. No confirmation is necessary when no public mutation occurs.

## 5. Open the pull request in a new Herdr pane

Inspect the current pane layout. Split right from a wide pane. Split down from a narrow or tall pane. Focus the new pane:

```bash
herdr pane layout --pane "$HERDR_PANE_ID"
SPLIT_JSON=$(herdr pane split --current \
  --direction <right-or-down> \
  --cwd <selected-worktree> \
  --focus)
REVIEW_PANE=$(printf '%s\n' "$SPLIT_JSON" | jq -er '.result.pane.pane_id')
printf -v TUICR_COMMAND 'tuicr pr %q' '<pull-request-url>'
herdr pane run "$REVIEW_PANE" "$TUICR_COMMAND"

TUICR_STARTED=
for attempt in $(seq 1 50); do
  PROCESS_JSON=$(herdr pane process-info --pane "$REVIEW_PANE")
  if printf '%s\n' "$PROCESS_JSON" | jq -e '
    .result.process_info.foreground_processes[]?
    | select(
        .name == "tuicr" or
        .argv0 == "tuicr" or
        ((.argv[0]? // "") | endswith("/tuicr"))
      )
  ' >/dev/null; then
    TUICR_STARTED=1
    break
  fi
  sleep 0.1
done
test "$TUICR_STARTED" = 1
```

This bounded check confirms that tuicr owns the pane foreground. Do not wait for the interactive process to exit, close the pane, or reclaim focus. If pane launch or process confirmation fails, close only the pane created by this workflow and report the existing pull-request URL.

## 6. Hand off the review

Report:

- pull-request number and URL,
- selected worktree and branch,
- commit SHA,
- checks run,
- Herdr pane ID.

When the user finishes review, follow the `tuicr` user-comment workflow. Find the PR session slug and read saved comments. Answer each comment first. Do not edit until the user explicitly says to apply fixes.
