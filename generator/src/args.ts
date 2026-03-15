import type { SkillProvider } from './skillsManifest';

const VERSION = '0.1.0';

const GENERATE_USAGE = `repogenesis v${VERSION} — AI-ready repository structure generator

Usage:
  repogenesis --input <path> --output <path> [--force]
  repogenesis skills list --registry <path> [--include-experimental]
  repogenesis skills add --project <path> --registry <path> --skill <id> [--provider <name>]...
  repogenesis skills remove --project <path> --skill <id>

Options:
  --input <path>                 Path to project_brief.json
  --output <path>                Output directory
  --force                        Overwrite existing output directory
  --project <path>               Target project root for skill install/remove
  --registry <path>              Skill registry root
  --skill <id>                   Skill id
  --provider <name>              codex | claude_code | gemini_cli | tool_agnostic
  --include-experimental         Include experimental skills in list
  --installed-by <name>          Installer identity to record in manifest
  --help                         Show this help message
  --version                      Show version`;

export type CliArgs =
  | {
      command: 'generate';
      input: string;
      output: string;
      force: boolean;
    }
  | {
      command: 'skills-list';
      registry: string;
      includeExperimental: boolean;
    }
  | {
      command: 'skills-add';
      project: string;
      registry: string;
      skillId: string;
      providers: SkillProvider[];
      installedBy?: string;
    }
  | {
      command: 'skills-remove';
      project: string;
      skillId: string;
    };

function exitWithUsage(message?: string): never {
  if (message) {
    console.error(message);
    console.error('');
  }
  console.error(GENERATE_USAGE);
  process.exit(1);
}

function isSkillProvider(value: string): value is SkillProvider {
  return ['codex', 'claude_code', 'gemini_cli', 'tool_agnostic'].includes(value);
}

function parseGenerateArgs(args: string[]): CliArgs {
  let input: string | undefined;
  let output: string | undefined;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--input':
        input = args[++i];
        break;
      case '--output':
        output = args[++i];
        break;
      case '--force':
        force = true;
        break;
      default:
        exitWithUsage(`Unknown option: ${args[i]}`);
    }
  }

  if (!input || !output) {
    exitWithUsage('Error: --input and --output are required.');
  }

  return { command: 'generate', input, output, force };
}

function parseSkillsArgs(args: string[]): CliArgs {
  const subcommand = args[0];
  if (!subcommand) {
    exitWithUsage('Error: skills subcommand is required.');
  }

  if (subcommand === 'list') {
    let registry: string | undefined;
    let includeExperimental = false;
    for (let i = 1; i < args.length; i++) {
      switch (args[i]) {
        case '--registry':
          registry = args[++i];
          break;
        case '--include-experimental':
          includeExperimental = true;
          break;
        default:
          exitWithUsage(`Unknown option: ${args[i]}`);
      }
    }
    if (!registry) {
      exitWithUsage('Error: --registry is required for skills list.');
    }
    return { command: 'skills-list', registry, includeExperimental };
  }

  if (subcommand === 'add') {
    let project: string | undefined;
    let registry: string | undefined;
    let skillId: string | undefined;
    let installedBy: string | undefined;
    const providers: SkillProvider[] = [];

    for (let i = 1; i < args.length; i++) {
      switch (args[i]) {
        case '--project':
          project = args[++i];
          break;
        case '--registry':
          registry = args[++i];
          break;
        case '--skill':
          skillId = args[++i];
          break;
        case '--provider': {
          const provider = args[++i];
          if (!provider || !isSkillProvider(provider)) {
            exitWithUsage(`Error: invalid provider: ${provider ?? ''}`);
          }
          providers.push(provider);
          break;
        }
        case '--installed-by':
          installedBy = args[++i];
          break;
        default:
          exitWithUsage(`Unknown option: ${args[i]}`);
      }
    }

    if (!project || !registry || !skillId) {
      exitWithUsage('Error: --project, --registry, and --skill are required for skills add.');
    }

    return { command: 'skills-add', project, registry, skillId, providers, installedBy };
  }

  if (subcommand === 'remove') {
    let project: string | undefined;
    let skillId: string | undefined;

    for (let i = 1; i < args.length; i++) {
      switch (args[i]) {
        case '--project':
          project = args[++i];
          break;
        case '--skill':
          skillId = args[++i];
          break;
        default:
          exitWithUsage(`Unknown option: ${args[i]}`);
      }
    }

    if (!project || !skillId) {
      exitWithUsage('Error: --project and --skill are required for skills remove.');
    }

    return { command: 'skills-remove', project, skillId };
  }

  exitWithUsage(`Unknown skills subcommand: ${subcommand}`);
}

export function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(GENERATE_USAGE);
    process.exit(0);
  }
  if (args.includes('--version') || args.includes('-v')) {
    console.log(VERSION);
    process.exit(0);
  }

  if (args[0] === 'skills') {
    return parseSkillsArgs(args.slice(1));
  }

  return parseGenerateArgs(args);
}
