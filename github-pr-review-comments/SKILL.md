---
name: github-pr-review-comments
description: Read, create, reply to, and resolve GitHub pull request inline review comments using gh CLI and GitHub GraphQL. Use whenever working with GitHub PR reviews, inline comments, review threads, reviewer feedback, or when asked to address/respond to PR comments.
---

# GitHub PR Review Comments

Use this skill for GitHub PR review threads, especially inline comments. For private repos, always use `gh` CLI/API, not web fetch.

## Rules

- Prefer GraphQL `reviewThreads` for inline comments. `gh pr view --json comments,reviews` does **not** include inline thread bodies.
- Read comments before changing code. Preserve reviewer wording in summaries.
- Reply with concrete status: fixed, explained, deferred, or need clarification.
- Do not resolve another person's thread unless user asked, or fix is complete and repo convention allows it. If unsure: reply only.
- For multiline bodies, write body to temp file and pass via `-F body=@file`.
- Keep PR responses short and specific. Mention commit/path only if useful.

## Get repo + PR metadata

From current branch:

```bash
OWNER=$(gh repo view --json owner --jq .owner.login)
REPO=$(gh repo view --json name --jq .name)
PR=$(gh pr view --json number --jq .number)
PR_URL=$(gh pr view --json url --jq .url)
```

For explicit PR number, set `PR=<number>`.

## Read inline review threads

List review threads with IDs needed for replies/resolution:

```bash
gh api graphql \
  -f owner="$OWNER" \
  -f name="$REPO" \
  -F number="$PR" \
  -f query='
query($owner:String!, $name:String!, $number:Int!) {
  repository(owner:$owner, name:$name) {
    pullRequest(number:$number) {
      id
      url
      reviewThreads(first:100) {
        pageInfo { hasNextPage endCursor }
        nodes {
          id
          isResolved
          path
          line
          originalLine
          startLine
          originalStartLine
          diffSide
          comments(first:50) {
            nodes {
              id
              databaseId
              author { login }
              body
              createdAt
              updatedAt
              url
              outdated
              path
              line
              originalLine
              diffHunk
            }
          }
        }
      }
    }
  }
}'
```

Compact unresolved summary:

```bash
gh api graphql \
  -f owner="$OWNER" -f name="$REPO" -F number="$PR" \
  -f query='
query($owner:String!, $name:String!, $number:Int!) {
  repository(owner:$owner, name:$name) {
    pullRequest(number:$number) {
      reviewThreads(first:100) {
        nodes {
          id isResolved path line originalLine
          comments(first:50) { nodes { author { login } body createdAt url outdated line originalLine } }
        }
      }
    }
  }
}' \
  --jq '.data.repository.pullRequest.reviewThreads.nodes[]
    | select(.isResolved == false)
    | {threadId:.id, path, line, originalLine,
       comments:[.comments.nodes[] | {author:.author.login, body, url, outdated, line, originalLine}]}'
```

If `pageInfo.hasNextPage` is true, rerun with `reviewThreads(first:100, after:$cursor)` and `-f cursor=<endCursor>`.

## Read non-inline PR comments/reviews

```bash
gh pr view "$PR" --json number,title,url,comments,reviews,latestReviews \
  --jq '{number,title,url,
         comments:[.comments[]|{author:.author.login,body,createdAt,url}],
         reviews:[.reviews[]|{author:.author.login,state,body,submittedAt}]}'
```

## Reply to an existing inline thread

Use `threadId` from `reviewThreads.nodes[].id`:

```bash
BODY_FILE=$(mktemp)
cat > "$BODY_FILE" <<'EOF'
Fixed. Read-only status checks no longer mutate state; writes only happen on explicit update paths.
EOF

gh api graphql \
  -F thread="$THREAD_ID" \
  -F body=@"$BODY_FILE" \
  -f query='
mutation($thread:ID!, $body:String!) {
  addPullRequestReviewThreadReply(input:{pullRequestReviewThreadId:$thread, body:$body}) {
    comment { id url body }
  }
}'
```

## Resolve / unresolve thread

```bash
gh api graphql \
  -F thread="$THREAD_ID" \
  -f query='
mutation($thread:ID!) {
  resolveReviewThread(input:{threadId:$thread}) {
    thread { id isResolved }
  }
}'
```

```bash
gh api graphql \
  -F thread="$THREAD_ID" \
  -f query='
mutation($thread:ID!) {
  unresolveReviewThread(input:{threadId:$thread}) {
    thread { id isResolved }
  }
}'
```

## Create a new inline review thread

First get PR node ID:

```bash
PR_ID=$(gh api graphql \
  -f owner="$OWNER" -f name="$REPO" -F number="$PR" \
  -f query='query($owner:String!, $name:String!, $number:Int!) { repository(owner:$owner, name:$name) { pullRequest(number:$number) { id } } }' \
  --jq '.data.repository.pullRequest.id')
```

Then create line-level thread on diff side (`RIGHT` for new file side, `LEFT` for old side):

```bash
BODY_FILE=$(mktemp)
cat > "$BODY_FILE" <<'EOF'
Consider moving this guard into a helper so CI and local builds share the same validation.
EOF

gh api graphql \
  -F pr="$PR_ID" \
  -f path="src/build.sh" \
  -F line=123 \
  -f side="RIGHT" \
  -F body=@"$BODY_FILE" \
  -f query='
mutation($pr:ID!, $path:String!, $line:Int!, $side:DiffSide!, $body:String!) {
  addPullRequestReviewThread(input:{pullRequestId:$pr, path:$path, line:$line, side:$side, body:$body}) {
    thread {
      id path line isResolved
      comments(last:1) { nodes { id url body } }
    }
  }
}'
```

For multi-line comments, also pass `startLine` and `startSide`:

```bash
-F startLine=118 -f startSide="RIGHT"
```

For file-level comments, use `subjectType:FILE` and omit `line`.

## Batch response workflow

1. Read all unresolved threads.
2. Build table: `threadId`, path/line, reviewer, comment, intended response.
3. Make code/doc changes.
4. Run relevant tests.
5. Reply to each addressed thread with concise status.
6. Resolve only when instructed or clearly appropriate.
7. Summarize responses and tests for user.

## Common errors

- `Unknown JSON field: reviewThreads` from `gh pr view`: use GraphQL query above.
- `Could not resolve to a node`: wrong `THREAD_ID` or not authenticated with repo access.
- `Line must be part of the diff`: use current diff line and correct `side`; inspect PR files/diff.
- Multiline body quoting breaks: use `BODY_FILE` + `-F body=@file`.
