#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';

export const sources = [
  { label: "Adi's Agent Skills", source: packageRoot },
  { label: 'Vercel Labs', source: 'vercel-labs/agent-browser' },
  { label: 'Phoenix Architecture', source: 'adstastic/phoenix-architecture' },
  {
    label: 'Cursor Thermos',
    source: 'https://github.com/cursor/plugins/tree/main/thermos',
  },
  { label: 'Torvalds Doctrine', source: 'leopiney/linus-torvalds-skills' },
  { label: 'Matt Pocock', source: 'mattpocock/skills' },
];

export function buildCommands(extraArgs = []) {
  return sources.map(({ label, source }) => ({
    label,
    args: ['-y', 'skills', 'add', source, ...extraArgs],
  }));
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    const child = spawn(npxCommand, command.args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => resolve(code ?? 1));
  });
}

export async function executeCommands(commands, run = runCommand) {
  for (const command of commands) {
    console.log(`\n=== ${command.label} ===\n`);
    const exitCode = await run(command);
    if (exitCode !== 0) throw new Error(`${command.label} installer failed (${exitCode})`);
  }
}

function printHelp() {
  console.log(`Usage: agent-skills [npx skills add options]\n\nRuns each bundled repository's upstream Skills CLI questionnaire.\nArguments are forwarded to every installer.\n\nExamples:\n  agent-skills\n  agent-skills --global --agent pi\n  agent-skills --yes --global\n\nWarning: --yes selects every skill exposed by every repository.`);
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.includes('--help') || argv.includes('-h')) {
    printHelp();
    return;
  }
  await executeCommands(buildCommands(argv));
  console.log('\nAll selected agent skills installed.');
}

const invokedPath = process.argv[1] ? realpathSync(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
