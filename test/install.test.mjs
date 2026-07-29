import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  applyOverrides,
  buildCommands,
  executeCommands,
  loadLiveSources,
  parseArgs,
  overrides,
  parseSkillList,
  resolveOwnSource,
  selectDefaults,
  sources,
} from '../bin/install.mjs';

const listed = (names) =>
  `◇  Found ${names.length} skill${names.length === 1 ? '' : 's'}\n${names
    .map((name) => `│\n│    ${name}\n│\n│      Description for ${name}`)
    .join('\n')}\n`;

test('uses portable GitHub source outside a development checkout', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agent-skills-source-'));
  try {
    assert.equal(resolveOwnSource(root), 'adstastic/agent-skills');
    await writeFile(join(root, '.git'), 'gitdir: test');
    assert.equal(resolveOwnSource(root), root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('parses shared installer options', () => {
  assert.deepEqual(parseArgs(['--yes', '--global', '--agent', 'pi', '-a', 'codex', '--copy']), {
    agents: ['pi', 'codex'],
    copy: true,
    global: true,
    help: false,
    yes: true,
  });
  assert.throws(() => parseArgs(['--agent']), /requires an agent ID/);
});

test('reads a checked skill list from upstream output', () => {
  assert.deepEqual(parseSkillList(listed(['one', 'two']), 'Test'), ['one', 'two']);
  assert.throws(
    () => parseSkillList('◇  Found 2 skills\n│\n│    one\n', 'Test'),
    /expected 2, parsed 1/
  );
});

test('loads every current source catalog through Skills CLI list mode', async () => {
  const calls = [];
  const catalogs = await loadLiveSources(async (args) => {
    calls.push(args);
    return { code: 0, stdout: listed(['current-skill']), stderr: '' };
  });

  assert.equal(catalogs.length, sources.length);
  assert.equal(catalogs.every((source) => source.skills[0].name === 'current-skill'), true);
  assert.equal(calls.every((args) => args.at(-1) === '--list'), true);
});

test('persistent overrides prefer local forks only when both sources are selected', () => {
  assert.equal(overrides['grill-me'], 'adstastic/agent-skills');
  const both = applyOverrides([
    {
      id: 'adstastic/agent-skills',
      skills: [{ name: 'grill-me' }, { name: 'local-only' }],
    },
    { id: 'mattpocock/skills', skills: [{ name: 'grill-me' }, { name: 'matt-only' }] },
  ]);
  assert.deepEqual(both[0].skills.map((skill) => skill.name), ['grill-me', 'local-only']);
  assert.deepEqual(both[1].skills.map((skill) => skill.name), ['matt-only']);

  const mattOnly = applyOverrides([
    { id: 'mattpocock/skills', skills: [{ name: 'grill-me' }] },
  ]);
  assert.deepEqual(mattOnly[0].skills, [{ name: 'grill-me' }]);
});

test('noninteractive mode keeps only curated default names', () => {
  const selected = selectDefaults();
  assert.deepEqual(selected[0].skills, [{ name: '*' }]);
  assert.equal(
    selected.find((source) => source.source === 'mattpocock/skills').skills.length,
    10
  );
});

test('builds one noninteractive install per source with shared choices', () => {
  const commands = buildCommands(
    [{ label: 'Test', source: 'owner/repo', skills: [{ name: 'one' }, { name: 'two' }] }],
    { agents: ['pi', 'codex'], copy: true, global: true }
  );
  assert.deepEqual(commands[0].args, [
    '-y',
    'skills',
    'add',
    'owner/repo',
    '--skill',
    'one',
    '--skill',
    'two',
    '--agent',
    'pi',
    '--agent',
    'codex',
    '--global',
    '--copy',
    '--yes',
  ]);
});

test('stops after first failed installation', async () => {
  const commands = [
    { label: 'One', args: [] },
    { label: 'Two', args: [] },
    { label: 'Three', args: [] },
  ];
  const attempted = [];
  await assert.rejects(
    executeCommands(commands, async (command) => {
      attempted.push(command.label);
      return command.label === 'Two' ? 7 : 0;
    }),
    /Two installation failed \(7\)/
  );
  assert.deepEqual(attempted, ['One', 'Two']);
});
