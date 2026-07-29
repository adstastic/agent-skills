#!/usr/bin/env node

import * as p from '@clack/prompts';
import { spawn } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const commonAgents = [
  ['claude-code', 'Claude Code'],
  ['codex', 'Codex'],
  ['pi', 'Pi'],
  ['cursor', 'Cursor'],
  ['opencode', 'OpenCode'],
  ['gemini-cli', 'Gemini CLI'],
  ['github-copilot', 'GitHub Copilot'],
  ['windsurf', 'Windsurf'],
];

export function parseArgs(argv) {
  const options = { agents: [], copy: false, global: undefined, help: false, yes: false };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--yes' || arg === '-y') options.yes = true;
    else if (arg === '--global' || arg === '-g') options.global = true;
    else if (arg === '--project' || arg === '-p') options.global = false;
    else if (arg === '--copy') options.copy = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--agent' || arg === '-a') {
      const agent = argv[index + 1];
      if (!agent || agent.startsWith('-')) throw new Error(`${arg} requires an agent ID`);
      options.agents.push(agent);
      index += 1;
    } else throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function frontmatterValue(content, key) {
  const match = content.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!match) return undefined;
  const value = match[1].trim();
  if (/^[>|]-?$/.test(value)) return undefined;
  return value.replace(/^(['"])(.*)\1$/, '$2');
}

export async function discoverLocalSkills(root = packageRoot) {
  const entries = await readdir(root, { withFileTypes: true });
  const skills = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
      .map(async (entry) => {
        try {
          const content = await readFile(join(root, entry.name, 'SKILL.md'), 'utf8');
          return {
            name: frontmatterValue(content, 'name') ?? entry.name,
            description: frontmatterValue(content, 'description'),
          };
        } catch {
          return null;
        }
      })
  );

  return skills.filter(Boolean).sort((left, right) => left.name.localeCompare(right.name));
}

export async function loadSources(root = packageRoot) {
  const bundle = JSON.parse(await readFile(join(root, 'skills-bundle.json'), 'utf8'));
  if (bundle.version !== 1 || !Array.isArray(bundle.sources)) {
    throw new Error('Unsupported skills-bundle.json format');
  }

  return [
    {
      label: "Adi's Agent Skills",
      source: root,
      skills: await discoverLocalSkills(root),
    },
    ...bundle.sources.map((source) => ({
      ...source,
      skills: source.skills.map((name) => ({ name })),
    })),
  ];
}

function cancelIfNeeded(value) {
  if (!p.isCancel(value)) return false;
  p.cancel('Installation cancelled');
  return true;
}

async function chooseSkills(sources) {
  const preset = await p.select({
    message: 'Installation preset',
    initialValue: 'recommended',
    options: [
      { value: 'recommended', label: 'Recommended bundle', hint: 'Install every curated skill' },
      { value: 'custom', label: 'Customize', hint: 'Choose skills from each source' },
    ],
  });
  if (cancelIfNeeded(preset)) return null;
  if (preset === 'recommended') return sources;

  const selectedSources = [];
  for (const source of sources) {
    let selectedNames;
    if (source.skills.length === 1) {
      const selected = await p.confirm({
        message: `Install ${source.skills[0].name} from ${source.label}?`,
        initialValue: true,
      });
      if (cancelIfNeeded(selected)) return null;
      selectedNames = selected ? [source.skills[0].name] : [];
    } else {
      const selected = await p.multiselect({
        message: `Skills from ${source.label}`,
        options: source.skills.map((skill) => ({
          value: skill.name,
          label: skill.name,
          hint: skill.description,
        })),
        initialValues: source.skills.map((skill) => skill.name),
      });
      if (cancelIfNeeded(selected)) return null;
      selectedNames = selected;
    }

    if (selectedNames.length > 0) {
      selectedSources.push({
        ...source,
        skills: source.skills.filter((skill) => selectedNames.includes(skill.name)),
      });
    }
  }

  if (selectedSources.length === 0) p.cancel('No skills selected');
  return selectedSources.length > 0 ? selectedSources : null;
}

async function chooseOptions() {
  const global = await p.select({
    message: 'Installation scope',
    initialValue: false,
    options: [
      { value: false, label: 'Project', hint: 'Available in current project' },
      { value: true, label: 'Global', hint: 'Available across all projects' },
    ],
  });
  if (cancelIfNeeded(global)) return null;

  const selectedAgents = await p.multiselect({
    message: 'Coding agents',
    options: [
      ...commonAgents.map(([value, label]) => ({ value, label })),
      { value: 'other', label: 'Other', hint: 'Enter Skills CLI agent IDs' },
    ],
    initialValues: ['claude-code', 'codex', 'pi'],
    required: true,
  });
  if (cancelIfNeeded(selectedAgents)) return null;

  const agents = selectedAgents.filter((agent) => agent !== 'other');
  if (selectedAgents.includes('other')) {
    const otherAgents = await p.text({
      message: 'Other agent IDs, comma-separated',
      placeholder: 'zed, qwen-code',
      validate(value) {
        const ids = value.split(',').map((id) => id.trim()).filter(Boolean);
        return ids.length > 0 && ids.every((id) => /^[a-z0-9-]+$/.test(id))
          ? undefined
          : 'Use comma-separated Skills CLI agent IDs';
      },
    });
    if (cancelIfNeeded(otherAgents)) return null;
    agents.push(...otherAgents.split(',').map((agent) => agent.trim()).filter(Boolean));
  }

  const mode = await p.select({
    message: 'Installation method',
    initialValue: 'symlink',
    options: [
      { value: 'symlink', label: 'Symlink', hint: 'Recommended; one canonical copy' },
      { value: 'copy', label: 'Copy', hint: 'Independent copy for each agent' },
    ],
  });
  if (cancelIfNeeded(mode)) return null;

  return { agents: [...new Set(agents)], copy: mode === 'copy', global };
}

export function buildCommands(sources, options) {
  return sources.map((source) => {
    const args = ['-y', 'skills', 'add', source.source];
    for (const skill of source.skills) args.push('--skill', skill.name);
    for (const agent of options.agents) args.push('--agent', agent);
    if (options.global) args.push('--global');
    if (options.copy) args.push('--copy');
    args.push('--yes');
    return { args, label: source.label, source: source.source };
  });
}

function runCommand(command) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(npxCommand, command.args, { stdio: 'inherit' });
    child.once('error', reject);
    child.once('exit', (code) => resolvePromise(code ?? 1));
  });
}

export async function executeCommands(commands, run = runCommand) {
  for (const command of commands) {
    p.log.step(`Installing ${command.label}`);
    const exitCode = await run(command);
    if (exitCode !== 0) throw new Error(`${command.label} installation failed (${exitCode})`);
  }
}

function formatPlan(sources, options) {
  const sourceLines = sources.map(
    (source) => `${source.label} (${source.source})\n  ${source.skills.map((skill) => skill.name).join(', ')}`
  );
  return [
    ...sourceLines,
    '',
    `Scope: ${options.global ? 'global' : 'project'}`,
    `Agents: ${options.agents.join(', ') || 'auto-detect'}`,
    `Method: ${options.copy ? 'copy' : 'symlink'}`,
  ].join('\n');
}

function printHelp() {
  console.log(`Usage: agent-skills [options]\n\nOptions:\n  -y, --yes           Install recommended bundle without prompts\n  -g, --global        Install globally\n  -p, --project       Install in current project\n  -a, --agent <id>    Target agent; repeatable\n      --copy           Copy instead of symlink\n  -h, --help           Show help`);
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  if (args.help) {
    printHelp();
    return;
  }

  const sources = await loadSources();
  let selectedSources;
  let options;

  if (args.yes) {
    selectedSources = sources;
    options = { agents: args.agents, copy: args.copy, global: args.global ?? false };
  } else {
    p.intro('Agent Skills installer');
    selectedSources = await chooseSkills(sources);
    if (!selectedSources) return;
    options = await chooseOptions();
    if (!options) return;

    p.note(formatPlan(selectedSources, options), 'Review third-party sources before installing');
    const confirmed = await p.confirm({ message: 'Install this bundle?', initialValue: true });
    if (cancelIfNeeded(confirmed) || !confirmed) {
      if (confirmed === false) p.cancel('Installation cancelled');
      return;
    }
  }

  await executeCommands(buildCommands(selectedSources, options));
  p.outro('Agent skills installed');
}

const invokedPath = process.argv[1] ? realpathSync(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    p.cancel(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
