---
name: deep-research-pro
description: Use Adi's logged-in ChatGPT Pro subscription through Oracle browser automation for ChatGPT Deep Research. Use when the user asks for deep research, cited web research, market/library/company research, broad source comparison, or a research report using logged-in provider capabilities.
---

# Deep Research Pro

Use Oracle to run ChatGPT Deep Research from Adi's signed-in ChatGPT Pro browser profile.

## Defaults

- Prefer MCP tool `oracle.consult` when available.
- Use browser engine with `browserResearchMode: "deep"`.
- Run `dryRun: true` first for new/unclear research tasks.
- Deep Research is for broad public-web research with citations, not normal code review.
- Put full research plan in the initial prompt. Oracle rejects browser follow-ups with Deep Research.
- For long reports, fetch full session detail after completion; do not rely on `consult` log tail.

## MCP Usage

Dry run:

```json
{
  "preset": "chatgpt-pro-heavy",
  "browserResearchMode": "deep",
  "prompt": "Research <topic>. Cite sources. Compare evidence. Produce concise report.",
  "files": [],
  "dryRun": true
}
```

Live run:

```json
{
  "preset": "chatgpt-pro-heavy",
  "browserResearchMode": "deep",
  "prompt": "Research <topic>. Cite sources. Compare evidence. Produce concise report.",
  "files": []
}
```

After live run, fetch full report:

```json
{
  "id": "<sessionId>",
  "detail": true
}
```

## Prompt Shape

Include:

1. Research question.
2. Scope boundaries.
3. Desired sources or domains, if any.
4. Required output format.
5. Decision criteria.

Example prompt:

```text
Research current best options for invoking logged-in AI provider subscriptions from CLI coding agents. Focus on ChatGPT Pro, Claude Pro/Max, Gemini Advanced, and Perplexity Pro. Compare official APIs, browser automation, MCP servers, reliability, ToS/security risks, and setup complexity. Cite sources. End with recommendation for a macOS Pi coding-agent workflow.
```

## CLI Fallback

If MCP unavailable:

```bash
npx -y @steipete/oracle \
  --engine browser \
  --browser-manual-login \
  --browser-manual-login-profile-dir ~/.oracle/browser-profile \
  --browser-research deep \
  --browser-timeout 2h \
  --browser-auto-reattach-delay 30s \
  --browser-auto-reattach-interval 60s \
  --browser-auto-reattach-timeout 3m \
  -p "<research prompt>"
```

Fetch full session/report:

```bash
npx -y @steipete/oracle session <session-id> --render
```

## Important

- Browser automation may focus/control visible Chrome.
- Never pass inline cookies unless user explicitly asks.
- Use persistent profile `~/.oracle/browser-profile`.
- If run times out or detaches, reattach; do not rerun same Deep Research unless session unrecoverable.
- Local artifacts live under `~/.oracle/sessions/<id>/artifacts/`; Deep Research report may be saved as `deep-research-report.md`.
