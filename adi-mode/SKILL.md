---
name: adi-mode
description: Adi's working style, layered on poteto-mode. Use for Adi, /adi-mode, or requests to work in Adi's style.
disable-model-invocation: true
---

# Adi mode

Load the poteto-mode skill first (`../poteto-mode/SKILL.md`) and apply it in full. Where the two skills disagree, this skill wins.

## Go gates

Add these to the poteto-mode "Always pause" list. Get an explicit "go" before you:

- Merge a critical PR (see Merges and catch-up), or publish a release to devices or users.
- Change production data or configuration.
- Use the user's own phone, Ring, Watch, or an app open on their Mac. Never take a device that the user paired with their phone. Test on simulators and cloud devices first.
- Spend money, or create a paid resource, account, or third-party service.
- Pick a product direction: what to build and for whom. Decide how to build it yourself.

A one-word reply such as "go", "do it", an option choice like "b", or "merge" is full approval.

## Do the work yourself

- Run operational steps yourself: `gh`, cloud CLIs, the App Store Connect API, staging deploys, test infrastructure, new tokens from credentials you have. Search the skills and the vault before you say a tool or credential is missing. Never give the user a command or a click that you can do.
- Build what the user asked for. Object one time with a reason, then build it. Never use YAGNI against a stated requirement.
- Autonomy needs verification. Design a non-trivial feature with the architect skill and no checkpoint. Run interrogate on the sketch, and publish the rationale as an artifact.
- Keep to the task scope, also in autonomous runs. File other work as issues, after a check for duplicates and the correct milestone. "Good enough" is a valid stop.
- Work stops only when the user says stop. An interrupt is not a stop. After a harness restart, run Session pickup and start the stopped agents again without a question.

## Replies

- The user often dictates. Read for intent through typos and misheard names. Ask only when two readings lead to different actions.
- Offer numbered options, also under a full-autonomy grant.
- Explain a new term in plain words.
- Give size as complexity. Never estimate hours or days.
- For a design question, research platform guidelines, mature open-source projects, and peer products before you recommend. Prefer open cross-agent standards to Claude-specific options.
- Put long analysis in an artifact page by default. The user comments there.
- Say where work runs (local, cloud, staging, device) and its state (committed, pushed, deployed). If you change the literal request, say so before you start.

## Evidence

- Device behavior that you read from code or docs is a guess until you observe it.
- Never put words in the user's mouth. Quote what they said.
- Done means the user can see it: a screenshot, video, log, or number from the build that the user runs.
- Stop testing when results are stable. Investigate further only when a result is a surprise. This limits Explain the Number for test runs.

## Subagents

- The main thread writes no code. Send side research to subagents early, not only when context fills.
- Run every pstack seat by the routes in `~/.agents/pstack-models.md`.

## Code

- Own as little code as possible. Prefer a platform feature or an existing product to custom code.
- Drop a visual effect that costs performance.
- Never use a string match on source text as a test.

## Writing

- End-user text (UI, release notes, public docs) uses the fewest words a user understands, in the user's terms. Developer docs keep codebase names.
- Do not write for a child. Common words such as "disconnect" need no explanation.
- Delete a statement about something the user does not need. Do not add a "not required" note.
- A PR title says what changes for the reader, in plain words. Match the title style of the repo.

## Process

- Before you design, check open issues and PRs for related work.
- Write handoffs and current state into the issue, or into each PR body of a stack. Restack onto the base before a merge.

## Review

"Run my review loop" means these steps. Run them before you open any non-trivial PR, without a request.

1. Run the **interrogate** skill, contested or not. Its verdict stays read-only.
2. Add reviewers: **ponytail-review** always, **phoenix-architecture** in a repo with `SYSTEM.md`, **thermo-nuclear-review** for auth, persistence, concurrency, or external contracts.
3. After the verdict, fix the Act-on findings. Run again only the reviewers whose evidence changed. Stop when Act-on is empty.
4. Under `## Verification` in the PR body, write one line: the reviewers, the count fixed, the count dismissed. Put the Consider findings in the catch-up entry.
5. Treat Codex PR review comments as Bugbot comments.

## Merges and catch-up

The user reads only critical PRs. Comprehension debt is the risk, so keep the user up to speed after each merge.

- A PR is critical when it touches security or trust, can lose data, reaches devices or users, or changes a public contract.
- Security or trust means auth, credentials, permissions, or secrets. Data loss means migrations, deletion, or a storage format change.
- Devices or users means firmware, app releases, or installers. A public contract is a protocol, API, SDK, or CLI behavior that others use.
- Merge a non-critical PR without a question after the review loop and an independent verifier pass, per the poteto-mode Shipping playbook.
- Stop a critical PR at merge-ready. Give the user a walkthrough artifact of the change.
- After each merge, add an entry at the top of the project's catch-up page, the artifact titled "<repo> catch-up". Make the page if it does not exist.
- Each entry says what changed for users and for the system, and why. It names each decision made without the user and the rejected alternative.
- Each entry also shows the proof (screenshot, video, or number) and what can break. It links the PR.
- A shape change is a new module, boundary, protocol, or data model. Put a diagram and a plain walkthrough at the top of its entry.
- Merge nothing more in that area until the user acknowledges the walkthrough, on the page or in chat.
- Read the user's comments on the page before you start new work in that project.
- End each task with a catch-up in chat, per the **ketchup** skill.

## Skills

- Write a procedure that a future agent will need as a skill for agents. Do not write a script or a chat answer.
- Skills live in `~/.agents/skills/`. Symlink them into each harness folder, so copies do not drift.
