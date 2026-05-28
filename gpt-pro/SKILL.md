---
name: gpt-pro
description: Use Adi's ChatGPT Pro subscription from Pi via Oracle browser automation/MCP. Use when the user asks to consult ChatGPT Pro, GPT Pro, Oracle, get a second opinion from ChatGPT, run a long reasoning pass, or send code context to ChatGPT Pro from the terminal/agent.
---

# GPT Pro

Use Oracle to invoke Adi's signed-in ChatGPT Pro account from Pi without manual copy/paste.

## Defaults

- Prefer MCP tool `oracle.consult` when available.
- Use preset `chatgpt-pro-heavy` for ChatGPT Pro browser mode.
- Always run a dry run first for new/unclear requests.
- Use file context generously; Oracle starts with no repo context unless files are attached.
- For long outputs, do not trust only the `consult` tail. Fetch full session via Oracle sessions after completion.

## MCP Usage

Dry run:

```json
{
  "preset": "chatgpt-pro-heavy",
  "prompt": "<prompt>",
  "files": ["src/**/*.ts"],
  "dryRun": true
}
```

Live run:

```json
{
  "preset": "chatgpt-pro-heavy",
  "prompt": "<prompt>",
  "files": ["src/**/*.ts"]
}
```

After live run, if answer may exceed log tail, call `sessions` with:

```json
{
  "id": "<sessionId>",
  "detail": true
}
```

## CLI Fallback

If MCP server/tool unavailable, use CLI directly:

```bash
npx -y @steipete/oracle \
  --engine browser \
  --browser-manual-login \
  --browser-manual-login-profile-dir ~/.oracle/browser-profile \
  --model gpt-5.5-pro \
  --browser-thinking-time extended \
  --browser-auto-reattach-delay 5s \
  --browser-auto-reattach-interval 10s \
  --browser-auto-reattach-timeout 2m \
  -p "<prompt>" \
  --file "src/**/*.ts"
```

For first-time/check login only:

```bash
npx -y @steipete/oracle \
  --engine browser \
  --browser-manual-login \
  --browser-manual-login-profile-dir ~/.oracle/browser-profile \
  --browser-keep-browser \
  --browser-input-timeout 120s \
  --browser-timeout 5m \
  --model gpt-5.5-pro \
  --browser-thinking-time extended \
  -p "Setup smoke test. Reply with exactly: ORACLE_OK"
```

## Important

- Never pass inline cookies unless user explicitly asks. Persistent profile at `~/.oracle/browser-profile` is preferred.
- Browser automation may focus/control visible Chrome.
- If output is truncated, reattach/read full session:

```bash
npx -y @steipete/oracle session <session-id> --render
```

- If a run is already active, reattach instead of starting duplicate expensive/long runs.
