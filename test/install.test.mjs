import test from 'node:test';
import assert from 'node:assert/strict';

import { buildCommands, executeCommands, sources } from '../bin/install.mjs';

test('collects local and upstream skill repositories', () => {
  assert.deepEqual(
    sources.slice(1),
    [
      { label: 'Vercel Labs', source: 'vercel-labs/agent-browser' },
      { label: 'Phoenix Architecture', source: 'adstastic/phoenix-architecture' },
      {
        label: 'Cursor Thermos',
        source: 'https://github.com/cursor/plugins/tree/main/thermos',
      },
      { label: 'Torvalds Doctrine', source: 'leopiney/linus-torvalds-skills' },
      { label: 'Matt Pocock', source: 'mattpocock/skills' },
    ]
  );
});

test('forwards options to every upstream Skills CLI questionnaire', () => {
  const commands = buildCommands(['--global', '--agent', 'pi']);
  assert.equal(commands.length, 6);
  for (const command of commands) {
    assert.deepEqual(command.args.slice(0, 3), ['-y', 'skills', 'add']);
    assert.deepEqual(command.args.slice(-3), ['--global', '--agent', 'pi']);
  }
});

test('stops after first failed upstream installer', async () => {
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
    /Two installer failed \(7\)/
  );
  assert.deepEqual(attempted, ['One', 'Two']);
});
