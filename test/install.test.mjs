import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  buildCommands,
  executeCommands,
  findOverrideSource,
  loadLiveSources,
  installBundle,
  markCodexManualOnly,
  npxEnv,
  parseArgs,
  overrides,
  parseSkillList,
  resolveOwnSource,
  selectNoninteractive,
  sources,
} from '../bin/install.mjs';

test('package name and bin leave `npx skills` to the Skills CLI', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  assert.notEqual(pkg.name, 'skills');
  assert.equal(Object.hasOwn(pkg.bin, 'skills'), false);
});

const listed = (names) =>
  `◇  Found ${names.length} skill${names.length === 1 ? '' : 's'}\n${names
    .map((name) => `│\n│    ${name}\n│\n│      Description for ${name}`)
    .join('\n')}\n`;

test('uses portable GitHub source outside a development checkout', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agent-skills-source-'));
  try {
    assert.equal(resolveOwnSource(root), 'adstastic/skills');
    await writeFile(join(root, '.git'), 'gitdir: test');
    assert.equal(resolveOwnSource(root), root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('nested npx does not inherit the outer package selection', () => {
  assert.deepEqual(
    npxEnv({ PATH: '/bin', npm_config_package: '/outer/package' }),
    { PATH: '/bin' }
  );
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

test('persistent overrides choose a source only when that provider is selected', () => {
  assert.equal(overrides['grill-with-docs'], 'adstastic/skills');
  assert.equal(
    findOverrideSource('grill-with-docs', [
      { id: 'adstastic/skills', source: '/local' },
      { id: 'mattpocock/skills', source: 'mattpocock/skills' },
    ]),
    '/local'
  );
  assert.equal(
    findOverrideSource('grill-with-docs', [
      { id: 'mattpocock/skills', source: 'mattpocock/skills' },
    ]),
    undefined
  );
});

const captureWith = (pstackNames) => async ([, , , url]) => {
  const source = sources.find((candidate) => candidate.source === url);
  const names =
    source.id === 'cursor/plugins/pstack'
      ? pstackNames
      : source.defaults === '*'
        ? ['local-skill']
        : [...source.defaults, 'uncurated'];
  return { code: 0, stdout: listed(names), stderr: '' };
};
const skillNames = (selected, id) =>
  selected.find((source) => source.id === id).skills.map((skill) => skill.name);

test('noninteractive mode keeps only curated default names', async () => {
  const selected = await selectNoninteractive(captureWith(['poteto-mode']));
  assert.deepEqual(skillNames(selected, 'adstastic/skills'), ['local-skill']);
  assert.deepEqual(skillNames(selected, 'herdrdev/herdr'), ['herdr']);
  assert.deepEqual(skillNames(selected, 'agavra/tuicr'), ['tuicr']);
  assert.deepEqual(
    skillNames(selected, 'mattpocock/skills'),
    sources.find((source) => source.id === 'mattpocock/skills').defaults
  );
});

test('noninteractive mode applies overrides to live catalogs', async () => {
  const selected = await selectNoninteractive(captureWith(['poteto-mode', 'tdd', 'teach']));
  assert.deepEqual(skillNames(selected, 'cursor/plugins/pstack'), ['poteto-mode']);
  assert.ok(skillNames(selected, 'mattpocock/skills').includes('tdd'));
  assert.ok(skillNames(selected, 'mattpocock/skills').includes('teach'));
});

test('noninteractive mode rejects an unmapped duplicate', async () => {
  await assert.rejects(
    selectNoninteractive(captureWith(['poteto-mode', 'herdr'])),
    /Duplicate skill herdr from herdrdev\/herdr, cursor\/plugins\/pstack; add a skill-overrides\.json entry/
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

test('marks manual-only skills for Codex and leaves existing policy files alone', async () => {
  const root = await mkdtemp(join(tmpdir(), 'agent-skills-codex-'));
  const skill = async (name, skillMd, yaml) => {
    await mkdir(join(root, name), { recursive: true });
    await writeFile(join(root, name, 'SKILL.md'), skillMd);
    if (yaml === undefined) return;
    await mkdir(join(root, name, 'agents'));
    await writeFile(join(root, name, 'agents', 'openai.yaml'), yaml);
  };
  const yamlOf = (name) => readFileSync(join(root, name, 'agents', 'openai.yaml'), 'utf8');
  const flagged = '---\nname: x\ndisable-model-invocation: true\n---\n\nBody\n';
  const keyed = 'policy:\n  allow_implicit_invocation: true\n';
  const unkeyed = 'interface:\n  display_name: Unkeyed\n';
  try {
    await skill('flagged', flagged);
    await skill('plain', '---\nname: plain\n---\n\nBody\n');
    await skill('keyed', flagged, keyed);
    await skill('unkeyed', flagged, unkeyed);
    await skill('body-flag', '---\nname: body-flag\n---\n\ndisable-model-invocation: true\n');

    const warnings = [];
    const names = ['flagged', 'plain', 'keyed', 'unkeyed', 'body-flag', 'missing'];
    assert.deepEqual(markCodexManualOnly(root, names, (message) => warnings.push(message)), ['flagged']);
    assert.deepEqual(markCodexManualOnly(root, names, () => {}), []);
    assert.equal(yamlOf('flagged'), 'policy:\n  allow_implicit_invocation: false\n');
    assert.equal(existsSync(join(root, 'plain', 'agents')), false);
    assert.equal(existsSync(join(root, 'body-flag', 'agents')), false);
    assert.equal(yamlOf('keyed'), keyed);
    assert.equal(yamlOf('unkeyed'), unkeyed);
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /\bunkeyed\b/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('install marks only installed skills, in the chosen scope, after every command succeeds', async () => {
  const home = await mkdtemp(join(tmpdir(), 'agent-skills-home-'));
  const cwd = await mkdtemp(join(tmpdir(), 'agent-skills-cwd-'));
  const flagged = '---\nname: x\ndisable-model-invocation: true\n---\n';
  const yaml = (base, name) => existsSync(join(base, '.agents', 'skills', name, 'agents', 'openai.yaml'));
  try {
    for (const [base, name] of [[home, 'm'], [cwd, 'm'], [cwd, 'other']]) {
      await mkdir(join(base, '.agents', 'skills', name), { recursive: true });
      await writeFile(join(base, '.agents', 'skills', name, 'SKILL.md'), flagged);
    }
    const selected = [{ label: 'One', source: 'one', skills: [{ name: 'm' }] }];
    await assert.rejects(installBundle(selected, { agents: [], global: true }, { run: async () => 1, home, cwd }));
    assert.equal(yaml(home, 'm'), false);
    assert.deepEqual(await installBundle(selected, { agents: [], global: false }, { run: async () => 0, home, cwd }), ['m']);
    assert.equal(yaml(cwd, 'm'), true);
    assert.equal(yaml(cwd, 'other'), false);
    assert.equal(yaml(home, 'm'), false);
  } finally {
    await rm(home, { recursive: true, force: true });
    await rm(cwd, { recursive: true, force: true });
  }
});
