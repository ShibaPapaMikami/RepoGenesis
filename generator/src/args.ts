const VERSION = '0.1.0';

const USAGE = `repogenesis v${VERSION} — AI-ready repository structure generator

Usage: repogenesis --input <path> --output <path> [--force]

Options:
  --input <path>   Path to project_brief.json (required)
  --output <path>  Output directory (required)
  --force          Overwrite existing output directory
  --help           Show this help message
  --version        Show version`;

export interface CliArgs {
  input: string;
  output: string;
  force: boolean;
}

export function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2);

  // Handle --help and --version before other parsing
  if (args.includes('--help') || args.includes('-h')) {
    console.log(USAGE);
    process.exit(0);
  }
  if (args.includes('--version') || args.includes('-v')) {
    console.log(VERSION);
    process.exit(0);
  }

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
        console.error(`Unknown option: ${args[i]}`);
        console.error(USAGE);
        process.exit(1);
    }
  }

  if (!input || !output) {
    console.error('Error: --input and --output are required.\n');
    console.error(USAGE);
    process.exit(1);
    throw new Error('unreachable');
  }

  return { input, output, force };
}
