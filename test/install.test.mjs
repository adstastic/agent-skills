import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  buildCommands,
  discoverLocalSkills,
  executeCommands,
  loadSources,
  parseArgs,
  selectDefaults,
} from '../bin/install.mjs';

test('parses non-interactive installer options', () => {
  assert.deepEqual(
    parseArgs(['--yes', '--global', '--agent', 'pi', '-a', 'codex', '--copy']),
    {
      agents: ['pi', 'codex'],
      copy: true,
      global: true,
      help: false,
      yes: true,
    }
  );
  assert.throws(() => parseArgs(['--agent']), /requires an agent ID/);
  assert.throws(() => parseArgs(['--wat']), /Unknown option/);
});

test('discovers direct child skills by frontmatter name', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agent-skills-'));
  try {
    await mkdir(join(root, 'second'));
    await writeFile(join(root, 'second', 'SKILL.md'), '---\nname: zed-skill\ndescription: Test\n---\n');
    await mkdir(join(root, 'first'));
    await writeFile(join(root, 'first', 'SKILL.md'), '---\nname: "alpha-skill"\n---\n');
    await mkdir(join(root, 'not-a-skill'));

    assert.deepEqual(await discoverLocalSkills(root), [
      { name: 'alpha-skill', description: undefined },
      { name: 'zed-skill', description: 'Test' },
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('loads local and curated upstream sources', async () => {
  const sources = await loadSources();
  const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
  assert.equal(sources[0].source, packageRoot);
  assert.equal(sources[0].skills.some((skill) => skill.name === 'repo-audit'), true);
  assert.deepEqual(
    sources.find((source) => source.source === 'vercel-labs/agent-browser').skills,
    [{ name: 'agent-browser', default: true }]
  );
  const matt = sources.find((source) => source.source === 'mattpocock/skills');
  assert.equal(matt.skills.length, 41);
  assert.equal(matt.skills.filter((skill) => skill.default).length, 10);
  assert.equal(matt.skills.find((skill) => skill.name === 'ask-matt').default, false);
});

test('recommended bundle selects defaults and rejects duplicate names', () => {
  assert.deepEqual(
    selectDefaults([
      {
        label: 'One',
        skills: [
          { name: 'default-one', default: true },
          { name: 'optional', default: false },
        ],
      },
      { label: 'Two', skills: [{ name: 'default-two', default: true }] },
    ]).map((source) => source.skills.map((skill) => skill.name)),
    [['default-one'], ['default-two']]
  );

  assert.throws(
    () =>
      selectDefaults([
        { label: 'One', skills: [{ name: 'duplicate', default: true }] },
        { label: 'Two', skills: [{ name: 'duplicate', default: true }] },
      ]),
    /Recommended skill duplicate is duplicated/
  );
});

test('builds one non-interactive Skills CLI call per source', () => {
  const commands = buildCommands(
    [
      {
        label: 'Local',
        source: '/tmp/my skills',
        skills: [{ name: 'one' }, { name: 'two' }],
      },
    ],
    { agents: ['pi', 'codex'], copy: true, global: true }
  );

  assert.deepEqual(commands, [
    {
      label: 'Local',
      source: '/tmp/my skills',
      args: [
        '-y',
        'skills',
        'add',
        '/tmp/my skills',
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
      ],
    },
  ]);
});

test('stops installation after first failed source', async () => {
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
