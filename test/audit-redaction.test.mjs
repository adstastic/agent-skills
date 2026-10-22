import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const script = new URL('../audit-all-my-stuff/scripts/inventory-macos.sh', import.meta.url);
const hasJq = spawnSync('jq', ['--version']).status === 0;

// Every secret value contains "SEKRET" or "sekret", except lowercaseHex, which is checked by value.
const servers = {
  'query-key': { url: 'https://mcp.example.com/mcp?exaApiKey=SEKRET1' },
  'path-token': { url: 'https://api.example.dev/mcp/SEKRETpathToken0123456789abcd' },
  'short-path': { url: 'https://hooks.example.com/mcp/SEKRET2' },
  'userinfo': { url: 'https://admin:SEKRET3@nas.example.com/mcp' },
  'httpurl': { httpUrl: 'https://gem.example.com/mcp?token=SEKRET4' },
  'headers': { url: 'https://h.example.com', headers: { Authorization: 'Bearer SEKRET5' } },
  'env': { command: 'npx', args: ['-y', '@acme/mcp@1.2.3'], env: { ACME_TOKEN: 'SEKRET6' } },
  'flag-space': { command: 'npx', args: ['-y', '@upstash/context7-mcp@1.0.0', '--api-key', 'SEKRET7'] },
  'flag-eq': { command: 'npx', args: ['--token=SEKRET8'] },
  'bearer-arg': { command: 'npx', args: ['mcp-remote', 'https://r.example.com/sse', '--header', 'Authorization: Bearer SEKRET9'] },
  'xapikey-arg': { command: 'npx', args: ['mcp-remote', 'https://x.example.com/mcp', '-H', 'x-api-key: SEKRET10'] },
  'env-inline': { command: '/bin/sh', args: ['-c', 'OPENAI_API_KEY=SEKRET11 npx some-mcp'] },
  'positional': { command: 'npx', args: ['@acme/mcp', 'SEKRETghp0123456789abcdefghijklmnopqrstuv'] },
  'dsn': { command: 'npx', args: ['@modelcontextprotocol/server-postgres', 'postgresql://app:SEKRET12@db.example.com:5432/prod'] },
  'docker-env-name': { command: 'docker', args: ['run', '-e', 'GITHUB_PERSONAL_ACCESS_TOKEN', 'ghcr.io/github/github-mcp-server'] },
  'docker-env-value': { command: 'docker', args: ['run', '-e', 'GITHUB_TOKEN=SEKRET15', 'ghcr.io/github/github-mcp-server'] },
  'custom-header': { command: 'npx', args: ['mcp-remote', 'https://c.example.com/mcp', '--header', 'X-Custom: SEKRET16'] },
  'custom-h': { command: 'npx', args: ['mcp-remote', 'https://c.example.com/mcp', '-H', 'X-Custom: SEKRET17'] },
  'env-bearer-quoted': { command: '/bin/sh', args: ['-c', 'AUTH_HEADER="Bearer SEKRET18" npx mcp-remote https://q.example.com/mcp'] },
  'jwt': { command: 'x', args: ['eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.SEKRETsignature0123456789'] },
  'key-colon-split': { command: 'x', args: ['TOKEN:', 'SEKRET19'] },
  'dashed-positional': { command: 'npx', args: ['-y', '@modelcontextprotocol/server-sequential-thinking', 'sk-ant-api03-SEKRET-0123456789abcdef0123456789'] },
  'password-eq': { command: 'db-mcp', args: ['--password=SEKRET20'] },
};

// Shapes that leaked past earlier denylist versions of the redaction.
const leakShapes = {
  'q-api_key-arg': { command: 'npx', args: ['mcp-remote', 'https://m.example.com/mcp?api_key=SEKRETq2'] },
  'q-access_token-c': { command: 'sh', args: ['-c', 'npx mcp-remote https://m.example.com/sse?access_token=SEKRETq3'] },
  'q-schemeless': { command: 'npx', args: ['mcp-remote', 'm.example.com/mcp?api_key=SEKRETq4'] },
  'q-schemeless-path': { command: 'npx', args: ['x', 'hooks.slack.com/services/T0/B0/SEKRETq5abcdef0123456789xyz'] },
  'jwt-c': { command: 'sh', args: ['-c', 'x --jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.SEKRETj0sig0123456789'] },
  'b64-slash': { command: 'x', args: ['SEKRETab12cd34+ef56gh78ij90kl12mn/op56qr78SEKRETb1st90uv12wx34yz56==='] },
  'aws-secret-pos': { command: 'x', args: ['wJalrSEKRETnFEMI/K7MDENG/bPxRfiSEKRETb2PLEKEY'] },
  'b64-plus-eq': { command: 'x', args: ['SEKRETb3cd34+ef56gh78ij90kl12mnop56qr78==='] },
  'slack-pos': { command: 'x', args: ['xoxb-SEKRETs1-123456789012-abcdefghijkl'] },
  'slack-env-c': { command: 'sh', args: ['-c', 'SLACK_BOT=xoxb-SEKRETs2-1234-abcd npx slack-mcp'] },
  'ghpat-pos': { command: 'x', args: ['github_pat_11SEKRET0123456789_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ab'] },
  'ghp-flag-pat': { command: 'x', args: ['--pat', 'ghp_SEKRETg1'] },
  'authz-eq-bearer': { command: 'x', args: ['Authorization=Bearer SEKRETa1'] },
  'H-xapikey': { command: 'x', args: ['-H', 'X-Api-Key: SEKRETh1'] },
  'H-joined': { command: 'x', args: ['-HX-Custom: SEKRETh2'] },
  'header-eq': { command: 'x', args: ['--header=X-Custom: SEKRETh3'] },
  'header-in-c': { command: 'sh', args: ['-c', 'npx mcp-remote https://x.example.com/mcp --header "X-Custom: SEKRETh4"'] },
  'H-in-c': { command: 'sh', args: ['-c', "npx mcp-remote https://x.example.com/mcp -H 'X-Custom:SEKRETh5'"] },
  'header-in-command': { command: 'npx mcp-remote https://x.example.com/mcp --header X-Custom:SEKRETh6' },
  'env-c-export': { command: 'bash', args: ['-lc', 'export DB_PASSWORD=SEKRETe2; npx x'] },
  'userinfo-at-in-pw': { command: 'x', args: ['https://user:SEKRET@u2@host.example.com/x'] },
  'userinfo-upper-scheme': { command: 'x', args: ['HTTPS://user:SEKRETu3@upper.example.com/x'] },
  'userinfo-schemeless': { command: 'x', args: ['--remote', 'user:SEKRETu4@host.example.com'] },
  'redis-pw': { command: 'x', args: ['redis://:SEKRETu5@cache.example.com:6379'] },
  'pos-20': { command: 'x', args: ['SEKRET01234567890abc'] },
  'flag-pw': { command: 'x', args: ['--pw', 'SEKRETp1'] },
  'flag-p': { command: 'mysql-mcp', args: ['-p', 'SEKRETp2'] },
  'flag-cookie': { command: 'x', args: ['--cookie', 'SEKRETp3'] },
  'flag-u-basic': { command: 'x', args: ['-u', 'user:SEKRETp4'] },
  'flag-session': { command: 'x', args: ['--session', 'SEKRETp5'] },
  'client-secret': { command: 'x', args: ['--client-secret', 'SEKRETw1'] },
  'basic-arg': { command: 'x', args: ['Basic SEKRETv1'] },
  'json-arg': { command: 'npx', args: ['-y', '@smithery/cli', 'run', 'exa', '--config', '{"exaApiKey":"SEKRETs3"}'] },
  'json-arg-header': { command: 'x', args: ['--config', '{"headers":{"X-Custom":"SEKRETs4"}}'] },
  'json-arg-spaced': { command: 'x', args: ['{ "token" : "SEKRETs5" }'] },
  'adonet': { command: 'x', args: ['Server=db;User Id=u;Password=SEKRETc2;'] },
  'jdbc': { command: 'x', args: ['jdbc:postgresql://jdbc.example.com:5432/app?user=u&password=SEKRETc3'] },
  'keep-host': { command: 'npx', args: ['mcp-remote', 'https://keep.example.com:8443/mcp'] },
};

// Lowercase secrets: an allowlist that only masks mixed case would print these.
const lowercaseHex = 'd3adb33fc0ffee0123456789abcdef42';
const lowercase = {
  'lc-hex-positional': { command: 'npx', args: ['@acme/hex-mcp', lowercaseHex] },
  'lc-run-positional': { command: 'npx', args: ['@acme/run-mcp', 'sekret0123456789abcdef0123'] },
  'lc-pw': { command: 'x', args: ['--pw', 'hunter2sekret'] },
  'lc-api-key': { command: 'npx', args: ['-y', '@acme/lc-mcp@0.4.1', '--api-key', 'sekretlowerkey'] },
  'lc-token-eq': { command: 'npx', args: ['--token=sekretlowertoken'] },
  'lc-dsn': { command: 'npx', args: ['@modelcontextprotocol/server-postgres', 'postgresql://app:sekretpg@pg.example.com:5433/prod'] },
  'lc-header': { command: 'x', args: ['-H', 'x-api-key: sekretheader'] },
  'lc-header-eq': { command: 'x', args: ['--header=x-api-key:sekretheader2'] },
  'lc-userinfo': { command: 'x', args: ['user:sekretui@host.example.com'] },
  'lc-key-colon': { command: 'x', args: ['token:', 'sekretsplit'] },
};

// UUID keys contain no "sekret", so they are checked by value.
const uuidKey = '5e3c0d1a-7b2f-4c9e-9a1d-0f6b8e2c4a7d';
const uuidInPath = '9b1f2e3d-4c5a-4b6c-8d7e-1f2a3b4c5d6e';
const digest = '0123456789abcdef'.repeat(4);
const shapes = {
  'uuid-positional': { command: 'npx', args: ['-y', 'exa-mcp-server', uuidKey] },
  'uuid-schemeless-path': { command: 'npx', args: ['mcp-remote', `mcp.composio.dev/server/${uuidInPath}/mcp`] },
  'split-bearer': { command: 'x', args: ['bearer', 'sekretsplitb1'] },
  'split-Bearer': { command: 'x', args: ['Bearer', 'sekretsplitb2'] },
  'authz-colon-bearer': { command: 'x', args: ['authorization:', 'bearer', 'sekretsplitb3'] },
  'token-colon-joined': { command: 'x', args: ['token:sekretjoined1'] },
  'api_key-colon-joined': { command: 'x', args: ['api_key:sekretjoined2'] },
  'token-as-command': { command: 'sk-SEKRET0123456789abcdefghijABCDEFGHIJ' },
  'space-path-secret': { command: 'sh', args: ['-c', '/opt/mcp/run.sh sekretspace1'] },
  'space-command-secret': { command: '/opt/mcp/server sekretspace2' },
  // Kept: these identify the package or path and hold no secret.
  'fetch-pin': { command: 'uvx', args: ['mcp-server-fetch==2025.4.7'] },
  'fetch-digest': { command: 'docker', args: ['run', '-i', '--rm', `mcp/fetch@sha256:${digest}`] },
  'space-path': { command: 'node', args: ['/Users/me/Library/Application Support/x/index.js'] },
  'space-command': { command: '/Applications/My App.app/Contents/MacOS/server' },
  'db-path': { command: 'x', args: ['--db-path', '/x/y.db'] },
};

test('MCP and credential sections never print secret values', { skip: !hasJq && 'jq not installed' }, async () => {
  const home = await mkdtemp(join(tmpdir(), 'audit-redaction-'));
  try {
    const topLevel = { 'top-access-token': { command: 'npx', args: ['-y', 'pkg@1.2.3', '--access-token', 'SEKRET21'] } };
    await writeFile(join(home, '.claude.json'), JSON.stringify({
      mcpServers: topLevel,
      projects: { '/p': { mcpServers: servers }, '/q': { mcpServers: leakShapes }, '/r': { mcpServers: lowercase }, '/s': { mcpServers: null }, '/t': { mcpServers: shapes } },
    }));
    await mkdir(join(home, '.gemini'));
    await writeFile(join(home, '.gemini/settings.json'), JSON.stringify({ mcpServers: {
      'gem-httpurl': { httpUrl: 'https://g.example.com/mcp/SEKRETl1?key=SEKRETl2', headers: { Authorization: 'Bearer SEKRETl3' } },
      'gem-cmd': { command: 'node', args: ['server.js'], env: { API_KEY: 'SEKRETl4' } },
    } }));
    // A number or boolean arg must not stop the rest of the file from listing.
    await mkdir(join(home, 'Library/Application Support/Claude'), { recursive: true });
    await writeFile(join(home, 'Library/Application Support/Claude/claude_desktop_config.json'), JSON.stringify({ mcpServers: {
      'numeric-port': { command: 'npx', args: ['some-mcp', '--port', 8080] },
      'normal-desktop': { command: 'npx', args: ['-y', 'visible-pkg@2.0.0'] },
    } }));
    await mkdir(join(home, '.cursor'));
    await writeFile(join(home, '.cursor/mcp.json'), JSON.stringify({ mcpServers: {
      'bool-arg': { command: 'npx', args: ['some-mcp', '--debug', true] },
      'normal-cursor': { command: 'npx', args: ['-y', 'cursor-visible@3.0.0'] },
    } }));
    await mkdir(join(home, '.codex'));
    await writeFile(join(home, '.codex/config.toml'), [
      '[mcp_servers.gh]', 'command = "npx"', 'args = ["--token", "SEKRETm1"]', '[mcp_servers.gh.env]', 'TOKEN = "SEKRETm2"',
      '[mcp_servers.web.http_headers]', 'Authorization = "Bearer SEKRETm4"', '[mcp_servers.z] # token SEKRETm3', '',
    ].join('\n'));
    await mkdir(join(home, '.aws'));
    await writeFile(join(home, '.aws/credentials'), 'aws_secret_access_key = SEKRET13\n');
    await writeFile(join(home, '.npmrc'), '//registry.npmjs.org/:_authToken=SEKRET14\n');

    const source = await readFile(script, 'utf8');
    const section = source.slice(source.indexOf('sec MCP_SERVERS'), source.indexOf('sec LOCKFILES'));
    const out = spawnSync('bash', ['-c', `sec() { echo "=== $* ==="; }\n${section}`], {
      env: { PATH: process.env.PATH, HOME: home },
      encoding: 'utf8',
    }).stdout;

    assert.doesNotMatch(out, /sekret/i);
    assert.doesNotMatch(out, new RegExp(lowercaseHex));
    assert.doesNotMatch(out, new RegExp(uuidKey));
    assert.doesNotMatch(out, new RegExp(uuidInPath));
    for (const kept of [
      '@upstash/context7-mcp@1.0.0', 'nas.example.com', 'gem.example.com', 'GITHUB_PERSONAL_ACCESS_TOKEN', '.aws/credentials',
      'postgresql://db.example.com:5432', 'ghcr.io/github/github-mcp-server', 'server-sequential-thinking', 'pkg@1.2.3', 'GITHUB_TOKEN=REDACTED',
    ]) {
      assert.match(out, new RegExp(kept.replace(/[.@/]/g, '\\$&')), `kept ${kept}`);
    }
    // Whole lines prove the output stays useful: names, commands, hosts with ports, package specs, flag names.
    const lines = out.split('\n');
    for (const line of [
      'flag-space|npx -y @upstash/context7-mcp@1.0.0 --api-key REDACTED',
      'top-access-token|npx -y pkg@1.2.3 --access-token REDACTED',
      'docker-env-name|docker run -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server',
      'docker-env-value|docker run -e GITHUB_TOKEN=REDACTED ghcr.io/github/github-mcp-server',
      'dsn|npx @modelcontextprotocol/server-postgres postgresql://db.example.com:5432',
      'lc-dsn|npx @modelcontextprotocol/server-postgres postgresql://pg.example.com:5433',
      'lc-api-key|npx -y @acme/lc-mcp@0.4.1 --api-key REDACTED',
      'lc-token-eq|npx --token=REDACTED',
      'lc-hex-positional|npx @acme/hex-mcp REDACTED',
      'keep-host|npx mcp-remote https://keep.example.com:8443',
      'userinfo-upper-scheme|x https://upper.example.com',
      'jdbc|x jdbc:postgresql://jdbc.example.com:5432',
      'xapikey-arg|npx mcp-remote https://x.example.com -H REDACTED',
      'query-key|https://mcp.example.com',
      'gem-httpurl|https://g.example.com',
      'gem-cmd|node server.js',
      'numeric-port|npx some-mcp --port 8080',
      'normal-desktop|npx -y visible-pkg@2.0.0',
      'bool-arg|npx some-mcp --debug true',
      'normal-cursor|npx -y cursor-visible@3.0.0',
      '[mcp_servers.z]',
      'uuid-positional|npx -y exa-mcp-server REDACTED',
      'fetch-pin|uvx mcp-server-fetch==2025.4.7',
      `fetch-digest|docker run -i --rm mcp/fetch@sha256:${digest}`,
      'space-path|node /Users/me/Library/Application Support/x/index.js',
      'space-command|/Applications/My App.app/Contents/MacOS/server',
      'db-path|x --db-path /x/y.db',
    ]) {
      assert.ok(lines.includes(line), `line ${line}`);
    }
  } finally {
    await rm(home, { recursive: true, force: true });
  }
});
