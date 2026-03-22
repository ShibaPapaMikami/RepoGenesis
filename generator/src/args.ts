import type { SkillProvider } from './skillsManifest';

const VERSION = '0.1.0';

const GENERATE_USAGE = `repogenesis v${VERSION} — AI-ready repository structure generator

Usage:
  repogenesis --input <path> --output <path> [--force]
  repogenesis migrate-spec --input <path> --output <path> [--force]
  repogenesis doctor --project <path> [--registry <path>]
  repogenesis skills list --registry <path> [--include-experimental]
  repogenesis skills add --project <path> --registry <path> --skill <id> [--provider <name>]...
  repogenesis skills status --project <path> --registry <path>
  repogenesis skills remove --project <path> --skill <id>
  repogenesis skills update --project <path> --registry <path> --skill <id> [--provider <name>]...
  repogenesis skills update --project <path> --registry <path> --all

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
      command: 'migrate-spec';
      input: string;
      output: string;
      force: boolean;
    }
  | {
      command: 'doctor';
      project: string;
      registry?: string;
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
      command: 'skills-status';
      project: string;
      registry: string;
    }
  | {
      command: 'skills-remove';
      project: string;
      skillId: string;
    }
  | {
      command: 'skills-update';
      project: string;
      registry: string;
      skillId?: string;
      all: boolean;
      providers: SkillProvider[];
      installedBy?: string;
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

function parseMigrateSpecArgs(args: string[]): CliArgs {
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
    exitWithUsage('Error: --input and --output are required for migrate-spec.');
  }

  return { command: 'migrate-spec', input, output, force };
}

function parseDoctorArgs(args: string[]): CliArgs {
  let project: string | undefined;
  let registry: string | undefined;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--project':
        project = args[++i];
        break;
      case '--registry':
        registry = args[++i];
        break;
      default:
        exitWithUsage(`Unknown option: ${args[i]}`);
    }
  }

  if (!project) {
    exitWithUsage('Error: --project is required for doctor.');
  }

  return { command: 'doctor', project, registry };
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

  if (subcommand === 'status') {
    let project: string | undefined;
    let registry: string | undefined;

    for (let i = 1; i < args.length; i++) {
      switch (args[i]) {
        case '--project':
          project = args[++i];
          break;
        case '--registry':
          registry = args[++i];
          break;
        default:
          exitWithUsage(`Unknown option: ${args[i]}`);
      }
    }

    if (!project || !registry) {
      exitWithUsage('Error: --project and --registry are required for skills status.');
    }

    return { command: 'skills-status', project, registry };
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

  if (subcommand === 'update') {
    let project: string | undefined;
    let registry: string | undefined;
    let skillId: string | undefined;
    let all = false;
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
        case '--all':
          all = true;
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

    if (!project || !registry) {
      exitWithUsage('Error: --project and --registry are required for skills update.');
    }

    if ((skillId && all) || (!skillId && !all)) {
      exitWithUsage('Error: skills update requires exactly one of --skill or --all.');
    }

    if (all && providers.length > 0) {
      exitWithUsage('Error: --provider cannot be combined with skills update --all.');
    }

    return { command: 'skills-update', project, registry, skillId, all, providers, installedBy };
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

  if (args[0] === 'doctor') {
    return parseDoctorArgs(args.slice(1));
  }

  if (args[0] === 'migrate-spec') {
    return parseMigrateSpecArgs(args.slice(1));
  }

  return parseGenerateArgs(args);
}
