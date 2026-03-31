import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generate } from '../src/generator';
import { generateFromSpec } from '../src/generateFromSpec';
import { projectBriefSchema } from '../src/schema';
import { DEFAULT_RUNBOOK_PATHS } from '../src/runbookBundle';
import { writeFile } from '../src/utils/fileWriter';

const SINGLE_REPO_FILE_COUNT = 23 + DEFAULT_RUNBOOK_PATHS.length;
const MULTI_REPO_FILE_COUNT = 39 + DEFAULT_RUNBOOK_PATHS.length;

const SINGLE_BRIEF = {
  specVersion: '1.0',
  project: {
    name: 'Test Single',
    slug: 'test-single',
    description: 'A single-repo test project for generator',
    owner: 'Tester',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  tech: {
    domains: ['web', 'ai'],
    primary_language: 'typescript',
    frameworks: ['Next.js'],
    ai_tools: ['claude_code'],
    ai_tool: 'claude_cli',
    ai_tool_detail: '',
  },
  security: {
    level: 'medium',
    has_api_keys: true,
    has_user_data: true,
    has_payment_data: false,
    has_ip_sensitive: false,
    has_credentials: false,
  },
  structure: {
    repo_type: 'single',
    repos: [],
  },
  workflow: {
    phases_count: 3,
  },
  planning: {
    tech_decisions: [
      {
        topic: 'AI API',
        choice: 'OpenAI API',
        status: 'adopted',
        rationale: 'Contract summaries are generated through the hosted API.',
        decision_date: '2026-01-01',
        notes: '',
      },
      {
        topic: 'Model',
        choice: 'gpt-5.4',
        status: 'candidate',
        rationale: 'Version can still change during evaluation.',
        decision_date: '',
        notes: '',
      },
    ],
    external_dependencies: [
      {
        name: 'OpenAI API',
        category: 'ai_api',
        status: 'adopted',
        purpose: 'Generate summaries from uploaded documents',
        owner: 'AI Platform',
        source: 'https://platform.openai.com/',
        license: 'Commercial',
        env_vars: ['OPENAI_API_KEY'],
        data_outbound: true,
        notes: '',
      },
      {
        name: 'Supabase',
        category: 'database',
        status: 'adopted',
        purpose: 'Store records and metadata',
        owner: 'Platform',
        source: 'https://supabase.com/',
        license: 'Commercial',
        env_vars: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'],
        data_outbound: true,
        notes: '',
      },
    ],
  },
};

const MULTI_BRIEF = {
  specVersion: '1.0',
  project: {
    name: 'Test Multi',
    slug: 'test-multi',
    description: 'A multi-repo test project for generator',
    owner: 'Tester',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  tech: {
    domains: ['web'],
    primary_language: 'typescript',
    frameworks: [],
    ai_tools: ['claude_code'],
    ai_tool: 'claude_cli',
    ai_tool_detail: '',
  },
  security: {
    level: 'high',
    has_api_keys: true,
    has_user_data: false,
    has_payment_data: true,
    has_ip_sensitive: false,
    has_credentials: false,
  },
  structure: {
    repo_type: 'multi',
    repos: [
      { name: 'frontend', type: 'frontend', description: 'UI application', owner: 'Alice', depends_on: [] },
      { name: 'backend', type: 'backend', description: 'API server', owner: 'Bob', depends_on: ['frontend'] },
    ],
  },
  workflow: {
    phases_count: 5,
  },
  planning: {
    tech_decisions: [],
    external_dependencies: [],
  },
};

const CODEX_SINGLE_BRIEF = {
  ...SINGLE_BRIEF,
  tech: {
    ...SINGLE_BRIEF.tech,
    ai_tools: ['codex'],
    ai_tool: 'other' as const,
    ai_tool_detail: '',
  },
};

const PYTHON_CLI_TTS_BRIEF = {
  ...SINGLE_BRIEF,
  project: {
    ...SINGLE_BRIEF.project,
    name: 'Irodori Voice CLI',
    slug: 'irodori-voice-cli',
    description: 'A CLI tool that generates emotion parameters, runs TTS synthesis, and post-processes wav output for Unity handoff.',
  },
  tech: {
    ...SINGLE_BRIEF.tech,
    domains: ['ai', 'cli', 'unity'],
    primary_language: 'python' as const,
    frameworks: ['Typer'],
    ai_tools: ['claude_code'],
    ai_tool: 'claude_cli' as const,
    ai_tool_detail: '',
  },
  workflow: {
    phases_count: 4,
  },
  planning: {
    tech_decisions: [
      {
        topic: 'Core workflow architecture',
        choice: 'text -> emotion parameter generation -> TTS synthesis -> audio post-processing -> wav output',
        status: 'adopted' as const,
        rationale: 'The first useful workflow is explicitly defined as a pipeline.',
        decision_date: '2026-03-29',
        notes: '',
      },
      {
        topic: 'Core feature',
        choice: 'emotion parameter layer',
        status: 'adopted' as const,
        rationale: 'Emotion shaping is one of the key differentiators for the first release.',
        decision_date: '2026-03-29',
        notes: '',
      },
      {
        topic: 'Core feature',
        choice: 'audio post-processing',
        status: 'adopted' as const,
        rationale: 'Post-processing is required to reach the intended audio quality.',
        decision_date: '2026-03-29',
        notes: '',
      },
      {
        topic: 'Post-processing library',
        choice: '',
        status: 'open' as const,
        rationale: 'Need to choose the first wav post-processing library.',
        decision_date: '',
        notes: '',
      },
      {
        topic: 'Runtime mode',
        choice: 'リアルタイム対応',
        status: 'open' as const,
        rationale: 'Need to decide whether realtime synthesis is in scope.',
        decision_date: '',
        notes: '',
      },
      {
        topic: 'Unity handoff',
        choice: 'Unity連携方式',
        status: 'open' as const,
        rationale: 'Need to define how Unity receives generated audio.',
        decision_date: '',
        notes: '',
      },
      {
        topic: 'Licensing',
        choice: '商用利用条件',
        status: 'open' as const,
        rationale: 'Need to confirm commercial usage constraints.',
        decision_date: '',
        notes: '',
      },
      {
        topic: 'Operator interface',
        choice: 'CLI / UI の優先度',
        status: 'open' as const,
        rationale: 'Need to decide whether a UI is required before release.',
        decision_date: '',
        notes: '',
      },
    ],
    external_dependencies: [
      {
        name: 'Irodori-TTS',
        category: 'github_repo' as const,
        status: 'adopted' as const,
        purpose: 'Primary synthesis engine',
        owner: 'Audio Team',
        source: 'https://github.com/example/irodori-tts',
        license: 'Custom',
        env_vars: [],
        data_outbound: false,
        notes: '',
      },
      {
        name: 'librosa',
        category: 'oss' as const,
        status: 'adopted' as const,
        purpose: 'Audio feature extraction and post-processing support',
        owner: 'Audio Team',
        source: 'https://librosa.org/',
        license: 'ISC',
        env_vars: [],
        data_outbound: false,
        notes: '',
      },
      {
        name: 'numpy',
        category: 'oss' as const,
        status: 'adopted' as const,
        purpose: 'Core numeric processing for parameter and waveform operations',
        owner: 'Audio Team',
        source: 'https://numpy.org/',
        license: 'BSD-3-Clause',
        env_vars: [],
        data_outbound: false,
        notes: '',
      },
      {
        name: 'soundfile',
        category: 'oss' as const,
        status: 'adopted' as const,
        purpose: 'Read and write wav artifacts for the first release',
        owner: 'Audio Team',
        source: 'https://python-soundfile.readthedocs.io/',
        license: 'BSD-3-Clause',
        env_vars: [],
        data_outbound: false,
        notes: '',
      },
      {
        name: 'wav post-processing library',
        category: 'oss' as const,
        status: 'open' as const,
        purpose: 'Normalize generated wav output',
        owner: 'Audio Team',
        source: '',
        license: '',
        env_vars: [],
        data_outbound: false,
        notes: '',
      },
    ],
  },
};

const DISTRIBUTED_AUDIO_WEB_BRIEF = {
  ...SINGLE_BRIEF,
  project: {
    ...SINGLE_BRIEF.project,
    name: 'Mistral AI Audio Tool',
    slug: 'mistral-ai-audio-tool',
    description: 'A browser UI reachable from macOS that controls a Windows RTX4090 host for local TTS inference, realtime conversation, and audio post-processing.',
  },
  tech: {
    ...SINGLE_BRIEF.tech,
    domains: ['web', 'ai', 'xr'],
    primary_language: 'typescript' as const,
    frameworks: ['Next.js', 'FastAPI'],
  },
  workflow: {
    phases_count: 4,
  },
  planning: {
    tech_decisions: [
      {
        topic: 'Framework',
        choice: 'Next.js, FastAPI',
        status: 'adopted' as const,
        rationale: 'The browser UI and control API are both part of the first release shape.',
        decision_date: '2026-03-31',
        notes: '',
      },
      {
        topic: 'Model',
        choice: 'self-hosted Qwen',
        status: 'candidate' as const,
        rationale: 'A local-capable LLM is being evaluated for emotion parameter generation.',
        decision_date: '',
        notes: '',
      },
      {
        topic: 'Licensing',
        choice: '商用利用条件',
        status: 'open' as const,
        rationale: 'Need to confirm redistribution and commercial use constraints.',
        decision_date: '',
        notes: '',
      },
      {
        topic: 'Emotion parameter generation',
        choice: '感情パラメータ生成方式',
        status: 'open' as const,
        rationale: 'Need to decide whether emotion generation is local or API-driven.',
        decision_date: '',
        notes: '',
      },
      {
        topic: 'Runtime mode',
        choice: 'リアルタイム対応',
        status: 'open' as const,
        rationale: 'Need to define acceptable realtime latency.',
        decision_date: '',
        notes: '',
      },
    ],
    external_dependencies: [
      {
        name: 'rikorose/deepfilternet',
        category: 'github_repo' as const,
        status: 'candidate' as const,
        purpose: 'Realtime denoise candidate',
        owner: 'Audio Team',
        source: 'https://github.com/rikorose/deepfilternet',
        license: '',
        env_vars: [],
        data_outbound: false,
        notes: '',
      },
      {
        name: 'modelscope/ClearerVoice-Studio',
        category: 'github_repo' as const,
        status: 'candidate' as const,
        purpose: 'Post-processing candidate',
        owner: 'Audio Team',
        source: 'https://github.com/modelscope/ClearerVoice-Studio',
        license: '',
        env_vars: [],
        data_outbound: false,
        notes: '',
      },
    ],
  },
};

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-test-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeInputFile(brief: object): string {
  const inputPath = path.join(tmpDir, 'input.json');
  fs.writeFileSync(inputPath, JSON.stringify(brief), 'utf-8');
  return inputPath;
}

describe('generator — single-repo', () => {
  it('should reject generated file paths that escape the output root', () => {
    expect(() => writeFile(tmpDir, '../escape.txt', 'unsafe')).toThrow(/must stay within the project root/);
    expect(fs.existsSync(path.join(path.dirname(tmpDir), 'escape.txt'))).toBe(false);
  });

  it('should generate all required files for single-repo', () => {
    const inputPath = writeInputFile(SINGLE_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: false });

    expect(result.success).toBe(true);
    expect(result.filesCreated.length).toBe(SINGLE_REPO_FILE_COUNT);

    const expectedFiles = [
      'PROJECT.md',
      'CLAUDE.md',
      'docs/ACTIVE_CONTEXT.md',
      'docs/AI_TOOLING.md',
      'docs/TECH_DECISIONS.md',
      'docs/EXTERNAL_DEPENDENCIES.md',
      'docs/REQUIREMENTS.md',
      'docs/ARCHITECTURE.md',
      'docs/ROADMAP.md',
      'docs/VERSIONING_STANDARD.md',
      'docs/ADR/0000-template.md',
      ...DEFAULT_RUNBOOK_PATHS,
      'plans/template.md',
      'prompts/restart.md',
      'SECURITY.md',
      '.env.example',
      '.gitignore',
      'skills/README.md',
      'repogenesis.skills.json',
      '.repogenesis/manifest.json',
    ];

    for (const file of expectedFiles) {
      const fullPath = path.join(result.outputDir, file);
      expect(fs.existsSync(fullPath), `Expected file to exist: ${file}`).toBe(true);
      const content = fs.readFileSync(fullPath, 'utf-8');
      expect(content.length).toBeGreaterThan(0);
    }
  });

  it('should error when output directory exists without --force', () => {
    const inputPath = writeInputFile(SINGLE_BRIEF);
    // First generate
    generate({ inputPath, outputPath: tmpDir, force: false });
    // Second generate without --force
    const result = generate({ inputPath, outputPath: tmpDir, force: false });
    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('should overwrite when output directory exists with --force', () => {
    const inputPath = writeInputFile(SINGLE_BRIEF);
    // First generate
    generate({ inputPath, outputPath: tmpDir, force: false });
    // Second generate with --force
    const result = generate({ inputPath, outputPath: tmpDir, force: true });
    expect(result.success).toBe(true);
    expect(result.filesCreated.length).toBe(SINGLE_REPO_FILE_COUNT);
  });

  it('should render normalized project descriptions in generated docs', () => {
    const brief = {
      ...SINGLE_BRIEF,
      project: {
        ...SINGLE_BRIEF.project,
        name: 'Visitor Data Collection App',
        slug: 'visitor-data-collection-app',
        description: '- Collect visitor registrations\n- Capture staff notes\n- Export follow-up lists',
      },
    };
    const inputPath = writeInputFile(brief);
    const result = generate({ inputPath, outputPath: tmpDir, force: true });

    const projectMd = fs.readFileSync(path.join(result.outputDir, 'PROJECT.md'), 'utf-8');
    const requirements = fs.readFileSync(path.join(result.outputDir, 'docs/REQUIREMENTS.md'), 'utf-8');

    expect(projectMd).toContain('Collect visitor registrations / Capture staff notes / Export follow-up lists');
    expect(requirements).toContain('**Description**: Collect visitor registrations / Capture staff notes / Export follow-up lists');
  });

  it('should reflect adopted planning docs and env vars in generated outputs', () => {
    const inputPath = writeInputFile(SINGLE_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: true });

    const projectMd = fs.readFileSync(path.join(result.outputDir, 'PROJECT.md'), 'utf-8');
    const activeContext = fs.readFileSync(path.join(result.outputDir, 'docs/ACTIVE_CONTEXT.md'), 'utf-8');
    const architecture = fs.readFileSync(path.join(result.outputDir, 'docs/ARCHITECTURE.md'), 'utf-8');
    const techDecisions = fs.readFileSync(path.join(result.outputDir, 'docs/TECH_DECISIONS.md'), 'utf-8');
    const externalDependencies = fs.readFileSync(path.join(result.outputDir, 'docs/EXTERNAL_DEPENDENCIES.md'), 'utf-8');
    const envExample = fs.readFileSync(path.join(result.outputDir, '.env.example'), 'utf-8');

    expect(projectMd).toContain('Adopted Decisions');
    expect(projectMd).toContain('AI API: OpenAI API');
    expect(projectMd).toContain('docs/TECH_DECISIONS.md');
    expect(projectMd).toContain('docs/EXTERNAL_DEPENDENCIES.md');

    expect(activeContext).toContain('Adopted decision: AI API: OpenAI API');
    expect(activeContext).toContain('Adopted dependency: Supabase (Database)');

    expect(architecture).toContain('## Adopted Technology Decisions');
    expect(architecture).toContain('## Adopted External Dependencies');
    expect(architecture).toContain('OpenAI API (AI API)');

    expect(techDecisions).toContain('## Adopted Decisions');
    expect(techDecisions).toContain('### AI API');
    expect(techDecisions).toContain('OpenAI API');
    expect(techDecisions).toContain('## Candidate Decisions');
    expect(techDecisions).toContain('gpt-5.4');

    expect(externalDependencies).toContain('## Adopted Dependencies');
    expect(externalDependencies).toContain('### Supabase');
    expect(externalDependencies).toContain('SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');

    expect(envExample).toContain('OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE');
    expect(envExample).toContain('SUPABASE_URL=YOUR_SUPABASE_URL_HERE');
    expect(envExample).not.toContain('API_SECRET=YOUR_API_SECRET_HERE');
  });

  it('should generate coherent starter docs without placeholder requirement and architecture text', () => {
    const inputPath = writeInputFile(SINGLE_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: true });

    const activeContext = fs.readFileSync(path.join(result.outputDir, 'docs/ACTIVE_CONTEXT.md'), 'utf-8');
    const roadmap = fs.readFileSync(path.join(result.outputDir, 'docs/ROADMAP.md'), 'utf-8');
    const requirements = fs.readFileSync(path.join(result.outputDir, 'docs/REQUIREMENTS.md'), 'utf-8');
    const architecture = fs.readFileSync(path.join(result.outputDir, 'docs/ARCHITECTURE.md'), 'utf-8');

    expect(activeContext).toContain('## Current Phase');
    expect(activeContext).toContain('Phase 1 — Planning');
    expect(activeContext).toContain('`docs/VERSIONING_STANDARD.md`');
    expect(roadmap).toContain('### Phase 0: Project Setup & Foundation');
    expect(roadmap).toContain('- **Status**: Complete');
    expect(roadmap).toContain('- [x] Create the starter repository structure and baseline docs.');
    expect(roadmap).toContain('### Phase 1: Primary Workflow Delivery');
    expect(roadmap).toContain('- **Status**: In Progress');
    expect(roadmap).toContain('- [ ] Turn the generated starter into a concrete execution plan.');

    expect(requirements).not.toContain('[Define your first requirement]');
    expect(requirements).not.toContain('[Define your second requirement]');
    expect(requirements).toContain('### R1: Deliver the primary workflow');
    expect(requirements).toContain('### R2: Keep the project operable and traceable from day one');
    expect(requirements).toContain('The exact boundary of the initial scope is written down');
    expect(requirements).toContain('AI Tooling Policy: `docs/AI_TOOLING.md`');

    expect(architecture).not.toContain('[Describe the high-level architecture here]');
    expect(architecture).not.toContain('[List and describe key system components]');
    expect(architecture).not.toContain('[Describe how data flows through the system]');
    expect(architecture).not.toContain('[Describe deployment and infrastructure details]');
    expect(architecture).toContain('## Architecture Overview');
    expect(architecture).toContain('## Key Components');
    expect(architecture).toContain('## Data Flow');
    expect(architecture).toContain('## Infrastructure');
  });

  it('should enrich requirements and roadmap from domains, dependencies, and open planning items', () => {
    const inputPath = writeInputFile(PYTHON_CLI_TTS_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: true });

    const requirements = fs.readFileSync(path.join(result.outputDir, 'docs/REQUIREMENTS.md'), 'utf-8');
    const architecture = fs.readFileSync(path.join(result.outputDir, 'docs/ARCHITECTURE.md'), 'utf-8');
    const roadmap = fs.readFileSync(path.join(result.outputDir, 'docs/ROADMAP.md'), 'utf-8');

    expect(requirements).toContain('### R3: Keep the processing pipeline explicit and testable');
    expect(requirements).toContain('text -> emotion parameter generation -> TTS synthesis -> audio post-processing -> wav output');
    expect(requirements).toContain('Audio-related parameters and output format requirements are documented');
    expect(requirements).toContain('### R4: Preserve the differentiating workflow features');
    expect(requirements).toContain('emotion parameter layer');
    expect(requirements).toContain('audio post-processing');
    expect(requirements).toContain('### R5: Provide a stable operator-facing CLI contract');
    expect(requirements).toContain('### R6: Integrate adopted external dependencies intentionally');
    expect(requirements).toContain('Irodori-TTS');
    expect(requirements).toContain('librosa');
    expect(requirements).toContain('numpy');
    expect(requirements).toContain('soundfile');
    expect(requirements).toContain('License or usage terms are reviewed for adopted dependencies before release.');
    expect(requirements).toContain('Open decision: Post-processing library.');
    expect(requirements).toContain('Open decision: Runtime mode -> リアルタイム対応.');
    expect(requirements).toContain('Open decision: Unity handoff -> Unity連携方式.');
    expect(requirements).toContain('Open decision: Licensing -> 商用利用条件.');
    expect(requirements).toContain('Open decision: Operator interface -> CLI / UI の優先度.');
    expect(requirements).toContain('Open dependency: wav post-processing library (oss).');
    expect(requirements).not.toContain('Framework choice is still TBD.');
    expect(architecture).toContain('## First Workflow Shape');
    expect(architecture).toContain('1. text');
    expect(architecture).toContain('emotion parameter layer');
    expect(architecture).toContain('audio post-processing');
    expect(architecture).toContain('Typer');

    expect(roadmap).toContain('Resolve the highest-risk open planning items first');
    expect(roadmap).toContain('Resolve Post-processing library');
    expect(roadmap).toContain('Resolve Runtime mode -> リアルタイム対応.');
    expect(roadmap).toContain('Resolve Unity handoff -> Unity連携方式.');
    expect(roadmap).toContain('Resolve Licensing -> 商用利用条件.');
    expect(roadmap).toContain('Resolve Operator interface -> CLI / UI の優先度.');
    expect(roadmap).toContain('Implement the first working pipeline: text -> emotion parameter generation -> TTS synthesis -> audio post-processing -> wav output.');
    expect(roadmap).toContain('Integrate adopted dependencies needed for the first workflow: Irodori-TTS, librosa, numpy, soundfile.');
    expect(roadmap).toContain('Verify synthesis parameters, output format, and post-processing quality gates.');
    expect(roadmap).not.toContain('Define concrete goals for this phase before implementation starts.');
  });

  it('should generate AGENTS.md for Codex projects and reference it from starter docs', () => {
    const inputPath = writeInputFile(CODEX_SINGLE_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: true });

    const agents = fs.readFileSync(path.join(result.outputDir, 'AGENTS.md'), 'utf-8');
    const projectMd = fs.readFileSync(path.join(result.outputDir, 'PROJECT.md'), 'utf-8');
    const aiTooling = fs.readFileSync(path.join(result.outputDir, 'docs/AI_TOOLING.md'), 'utf-8');
    const activeContext = fs.readFileSync(path.join(result.outputDir, 'docs/ACTIVE_CONTEXT.md'), 'utf-8');
    const restart = fs.readFileSync(path.join(result.outputDir, 'prompts/restart.md'), 'utf-8');

    expect(fs.existsSync(path.join(result.outputDir, 'AGENTS.md'))).toBe(true);
    expect(fs.existsSync(path.join(result.outputDir, 'CLAUDE.md'))).toBe(false);
    expect(agents).toContain('## Codex rules');
    expect(agents).toContain('`AGENTS.md` is only the Codex-specific overlay');
    expect(projectMd).toContain('docs/AI_TOOLING.md');
    expect(aiTooling).toContain('`AGENTS.md`');
    expect(activeContext).toContain('`AGENTS.md`');
    expect(restart).toContain('Read docs/AI_TOOLING.md if it exists');
    expect(restart).toContain('AGENTS.md');
  });

  it('should add CLI- and language-specific guidance to CLAUDE.md when the project calls for it', () => {
    const inputPath = writeInputFile(PYTHON_CLI_TTS_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: true });

    const claude = fs.readFileSync(path.join(result.outputDir, 'CLAUDE.md'), 'utf-8');

    expect(claude).toContain('Treat the CLI contract as first-class');
    expect(claude).toContain('using `Typer`');
    expect(claude).toContain('Keep the first processing pipeline explicit end to end');
    expect(claude).toContain('Keep the Unity integration boundary explicit');
  });

  it('should reflect distributed browser-to-host runtime boundaries for audio web briefs', () => {
    const inputPath = writeInputFile(DISTRIBUTED_AUDIO_WEB_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: true });

    const requirements = fs.readFileSync(path.join(result.outputDir, 'docs/REQUIREMENTS.md'), 'utf-8');
    const architecture = fs.readFileSync(path.join(result.outputDir, 'docs/ARCHITECTURE.md'), 'utf-8');
    const roadmap = fs.readFileSync(path.join(result.outputDir, 'docs/ROADMAP.md'), 'utf-8');
    const versioning = fs.readFileSync(path.join(result.outputDir, 'docs/VERSIONING_STANDARD.md'), 'utf-8');
    const claude = fs.readFileSync(path.join(result.outputDir, 'CLAUDE.md'), 'utf-8');

    expect(requirements).toContain('- Frameworks: Next.js, FastAPI');
    expect(requirements).not.toContain('Framework choice is still TBD.');
    expect(requirements).toContain('Keep the client-host runtime boundary explicit');
    expect(requirements).toContain('browser UI reachable from macOS');
    expect(requirements).toContain('Windows RTX4090 host');
    expect(requirements).toContain('top-right header');
    expect(requirements).toContain('deploy or publication time');
    expect(requirements).toContain('restricted to admins');
    expect(architecture).toContain('## Runtime Boundary');
    expect(architecture).toContain('browser UI reachable from macOS');
    expect(architecture).toContain('Windows RTX4090 host');
    expect(roadmap).toContain('Document the browser client and Windows/GPU host boundary before implementation spreads across both sides.');
    expect(roadmap).toContain('Implement the first browser-to-host handoff between the operator UI and the inference or media runtime.');
    expect(roadmap).toContain('Validate browser-to-host latency, transport failures, and recovery behavior on target hardware.');
    expect(versioning).toContain('deploy or publication time');
    expect(versioning).toContain('top-right of the header');
    expect(versioning).toContain('`v<release> (<commit>) <deploy time>`');
    expect(versioning).toContain('restricted to admins');
    expect(claude).toContain('top-right header');
    expect(claude).toContain('deploy or publication time');
  });
});

describe('generator — multi-repo', () => {
  it('should generate GLOBAL_CONTEXT.md and per-repo structures', () => {
    const inputPath = writeInputFile(MULTI_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: false });

    expect(result.success).toBe(true);

    // Workspace-level files
    const workspaceFiles = [
      'PROJECT.md',
      'CLAUDE.md',
      'GLOBAL_CONTEXT.md',
      'REQUIREMENTS.md',
      'SECURITY.md',
      'VERSIONING_STANDARD.md',
      'docs/AI_TOOLING.md',
      'docs/TECH_DECISIONS.md',
      'docs/EXTERNAL_DEPENDENCIES.md',
      ...DEFAULT_RUNBOOK_PATHS,
      '.gitignore',
      'skills/README.md',
      'repogenesis.skills.json',
    ];
    for (const file of workspaceFiles) {
      const fullPath = path.join(result.outputDir, file);
      expect(fs.existsSync(fullPath), `Expected workspace file: ${file}`).toBe(true);
    }

    // Per-repo files
    for (const repoName of ['frontend', 'backend']) {
      const repoFiles = [
        `${repoName}/PROJECT.md`,
        `${repoName}/CLAUDE.md`,
        `${repoName}/docs/ACTIVE_CONTEXT.md`,
        `${repoName}/docs/ARCHITECTURE.md`,
        `${repoName}/docs/ROADMAP.md`,
        `${repoName}/docs/VERSIONING_STANDARD.md`,
        `${repoName}/docs/ADR/0000-template.md`,
        `${repoName}/plans/template.md`,
        `${repoName}/prompts/restart.md`,
        `${repoName}/.env.example`,
        `${repoName}/.gitignore`,
      ];
      for (const file of repoFiles) {
        const fullPath = path.join(result.outputDir, file);
        expect(fs.existsSync(fullPath), `Expected repo file: ${file}`).toBe(true);
      }
    }
  });

  it('should reference workspace AI tooling policy from per-repo starter docs', () => {
    const inputPath = writeInputFile(MULTI_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: true });

    const repoProject = fs.readFileSync(path.join(result.outputDir, 'frontend/PROJECT.md'), 'utf-8');
    const repoActiveContext = fs.readFileSync(path.join(result.outputDir, 'frontend/docs/ACTIVE_CONTEXT.md'), 'utf-8');
    const repoRestart = fs.readFileSync(path.join(result.outputDir, 'frontend/prompts/restart.md'), 'utf-8');

    expect(repoProject).toContain('`../docs/AI_TOOLING.md`');
    expect(repoActiveContext).toContain('`../docs/AI_TOOLING.md`');
    expect(repoRestart).toContain('Read ../docs/AI_TOOLING.md if it exists');
  });

  it('should include GLOBAL_CONTEXT.md with repos list', () => {
    const inputPath = writeInputFile(MULTI_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: false });
    const gc = fs.readFileSync(path.join(result.outputDir, 'GLOBAL_CONTEXT.md'), 'utf-8');
    expect(gc).toContain('frontend');
    expect(gc).toContain('backend');
    expect(gc).toContain('depends on');
  });
});

describe('generator — security flag content', () => {
  it('should include API Key section in SECURITY.md when has_api_keys is true', () => {
    const inputPath = writeInputFile(SINGLE_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: false });
    const security = fs.readFileSync(path.join(result.outputDir, 'SECURITY.md'), 'utf-8');
    expect(security).toContain('API Key Handling');
  });

  it('should include PCI DSS in SECURITY.md when has_payment_data is true', () => {
    const inputPath = writeInputFile(MULTI_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: false });
    const security = fs.readFileSync(path.join(result.outputDir, 'SECURITY.md'), 'utf-8');
    expect(security).toContain('PCI DSS');
  });

  it('should include payment rule in PROJECT.md when has_payment_data is true', () => {
    const brief = {
      ...SINGLE_BRIEF,
      security: {
        level: 'high' as const,
        has_api_keys: false,
        has_user_data: false,
        has_payment_data: true,
        has_ip_sensitive: false,
        has_credentials: false,
      },
    };
    const inputPath = writeInputFile(brief);
    const result = generate({ inputPath, outputPath: tmpDir, force: true });
    const projectMd = fs.readFileSync(path.join(result.outputDir, 'PROJECT.md'), 'utf-8');
    expect(projectMd).toContain('payment data');
  });

  it('should include IP confidentiality in PROJECT.md when has_ip_sensitive is true', () => {
    const brief = {
      ...SINGLE_BRIEF,
      security: {
        level: 'medium' as const,
        has_api_keys: false,
        has_user_data: false,
        has_payment_data: false,
        has_ip_sensitive: true,
        has_credentials: false,
      },
    };
    const inputPath = writeInputFile(brief);
    const result = generate({ inputPath, outputPath: tmpDir, force: true });
    const projectMd = fs.readFileSync(path.join(result.outputDir, 'PROJECT.md'), 'utf-8');
    expect(projectMd).toContain('client-confidential');
  });
});

describe('generator — error handling', () => {
  it('should fail when input file does not exist', () => {
    const result = generate({ inputPath: '/nonexistent/file.json', outputPath: tmpDir, force: false });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot read input file');
  });

  it('should fail when input is invalid JSON', () => {
    const inputPath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(inputPath, 'not json', 'utf-8');
    const result = generate({ inputPath, outputPath: tmpDir, force: false });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid JSON');
  });

  it('should fail when input fails schema validation', () => {
    const inputPath = writeInputFile({ project: {} });
    const result = generate({ inputPath, outputPath: tmpDir, force: false });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Validation failed');
  });

  it('should fail when specVersion exists but is unsupported', () => {
    const inputPath = writeInputFile({
      ...SINGLE_BRIEF,
      specVersion: '2.0',
    });
    const result = generate({ inputPath, outputPath: tmpDir, force: false });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported specVersion');
  });
});

describe('generateFromSpec — pure function', () => {
  function parseBrief(data: object) {
    const result = projectBriefSchema.safeParse(data);
    if (!result.success) throw new Error(`Invalid brief: ${result.error}`);
    return result.data;
  }

  it('should return Map with default runbook bundle for single-repo', () => {
    const brief = parseBrief(SINGLE_BRIEF);
    const files = generateFromSpec(brief);
    expect(files.size).toBe(SINGLE_REPO_FILE_COUNT);
    expect(files.has('PROJECT.md')).toBe(true);
    expect(files.has('CLAUDE.md')).toBe(true);
    expect(files.has('docs/AI_TOOLING.md')).toBe(true);
    expect(files.has('SECURITY.md')).toBe(true);
    expect(files.has('docs/TECH_DECISIONS.md')).toBe(true);
    expect(files.has('docs/EXTERNAL_DEPENDENCIES.md')).toBe(true);
    expect(files.has('docs/VERSIONING_STANDARD.md')).toBe(true);
    for (const runbook of DEFAULT_RUNBOOK_PATHS) {
      expect(files.has(runbook), `Missing runbook: ${runbook}`).toBe(true);
    }
    expect(files.has('.gitignore')).toBe(true);
    expect(files.has('skills/README.md')).toBe(true);
    expect(files.has('repogenesis.skills.json')).toBe(true);
    expect(files.has('.repogenesis/manifest.json')).toBe(true);
  });

  it('should return Map with correct files for multi-repo', () => {
    const brief = parseBrief(MULTI_BRIEF);
    const files = generateFromSpec(brief);
    // 22 workspace + 11 * 2 repos + 1 manifest = 45
    expect(files.size).toBe(MULTI_REPO_FILE_COUNT);
    expect(files.has('PROJECT.md')).toBe(true);
    expect(files.has('CLAUDE.md')).toBe(true);
    expect(files.has('GLOBAL_CONTEXT.md')).toBe(true);
    expect(files.has('docs/AI_TOOLING.md')).toBe(true);
    expect(files.has('docs/TECH_DECISIONS.md')).toBe(true);
    expect(files.has('docs/EXTERNAL_DEPENDENCIES.md')).toBe(true);
    expect(files.has('VERSIONING_STANDARD.md')).toBe(true);
    for (const runbook of DEFAULT_RUNBOOK_PATHS) {
      expect(files.has(runbook), `Missing workspace runbook: ${runbook}`).toBe(true);
    }
    expect(files.has('skills/README.md')).toBe(true);
    expect(files.has('repogenesis.skills.json')).toBe(true);
    expect(files.has('frontend/PROJECT.md')).toBe(true);
    expect(files.has('frontend/CLAUDE.md')).toBe(true);
    expect(files.has('frontend/docs/VERSIONING_STANDARD.md')).toBe(true);
    expect(files.has('backend/PROJECT.md')).toBe(true);
    expect(files.has('backend/CLAUDE.md')).toBe(true);
    expect(files.has('.repogenesis/manifest.json')).toBe(true);
  });

  it('should include Codex wrappers when codex is enabled', () => {
    const brief = parseBrief({
      ...MULTI_BRIEF,
      tech: {
        ...MULTI_BRIEF.tech,
        ai_tools: ['codex', 'gemini_cli'],
        ai_tool: 'other',
        ai_tool_detail: '',
      },
    });
    const files = generateFromSpec(brief);

    expect(files.has('AGENTS.md')).toBe(true);
    expect(files.has('GEMINI.md')).toBe(true);
    expect(files.has('frontend/AGENTS.md')).toBe(true);
    expect(files.has('frontend/GEMINI.md')).toBe(true);
    expect(files.has('backend/AGENTS.md')).toBe(true);
    expect(files.has('backend/GEMINI.md')).toBe(true);
  });

  it('should produce identical output for same input (deterministic)', () => {
    const brief = parseBrief(SINGLE_BRIEF);
    const options = {
      generatedAt: '2026-01-01T00:00:00.000Z',
    };
    const files1 = generateFromSpec(brief, options);
    const files2 = generateFromSpec(brief, options);
    expect(files1.size).toBe(files2.size);
    for (const [path, content] of files1) {
      expect(files2.get(path)).toBe(content);
    }
  });

  it('should generate 4 convention files for single-repo', () => {
    const brief = parseBrief(SINGLE_BRIEF);
    const files = generateFromSpec(brief);
    const conventionFiles = [
      'CONTRIBUTING.md',
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/ISSUE_TEMPLATE/bug_report.md',
      '.github/ISSUE_TEMPLATE/feature_request.md',
    ];
    for (const f of conventionFiles) {
      expect(files.has(f), `Missing convention file: ${f}`).toBe(true);
      expect(files.get(f)!.length).toBeGreaterThan(0);
    }
  });

  it('should generate 4 convention files for multi-repo at workspace level', () => {
    const brief = parseBrief(MULTI_BRIEF);
    const files = generateFromSpec(brief);
    const conventionFiles = [
      'CONTRIBUTING.md',
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/ISSUE_TEMPLATE/bug_report.md',
      '.github/ISSUE_TEMPLATE/feature_request.md',
    ];
    for (const f of conventionFiles) {
      expect(files.has(f), `Missing convention file: ${f}`).toBe(true);
    }
  });

  it('CLI generate() and generateFromSpec() should produce same file set', () => {
    const inputPath = path.join(tmpDir, 'equiv.json');
    fs.writeFileSync(inputPath, JSON.stringify(SINGLE_BRIEF), 'utf-8');
    const cliResult = generate({ inputPath, outputPath: tmpDir, force: false });
    expect(cliResult.success).toBe(true);

    const brief = parseBrief(SINGLE_BRIEF);
    const pureFiles = generateFromSpec(brief);

    expect(cliResult.filesCreated.length).toBe(pureFiles.size);
    for (const file of cliResult.filesCreated) {
      expect(pureFiles.has(file), `Pure function missing: ${file}`).toBe(true);
    }
  });

  it('should include manifest metadata', () => {
    const brief = parseBrief(SINGLE_BRIEF);
    const files = generateFromSpec(brief);
    const manifestRaw = files.get('.repogenesis/manifest.json');
    expect(manifestRaw).toBeTruthy();
    const manifest = JSON.parse(manifestRaw as string);
    expect(manifest.specVersion).toBe('1.0');
    expect(manifest.repoType).toBe('single');
    expect(manifest.fileCount).toBe(SINGLE_REPO_FILE_COUNT);
    expect(manifest.source).toBe('legacyBrief');
    expect(manifest.selectedSkills).toEqual([]);
  });

  it('should record selected skills in manifest and runbooks', () => {
    const brief = parseBrief(SINGLE_BRIEF);
    const files = generateFromSpec(brief, {
      selectedSkills: [
        {
          id: 'repo-readiness-review',
          name: 'Repo Readiness Review',
          version: '0.1.0',
          sourceType: 'curated',
          providers: ['codex'],
        },
      ],
    });

    const manifest = JSON.parse(files.get('.repogenesis/manifest.json') as string);
    expect(manifest.selectedSkills).toHaveLength(1);
    expect(manifest.selectedSkills[0].id).toBe('repo-readiness-review');

    const runbook = files.get('docs/runbooks/skill-install.md') as string;
    expect(runbook).toContain('Recommended For This Project');
    expect(runbook).toContain('repo-readiness-review');
    expect(runbook).toContain('scripts/install-selected-skills.sh');

    const skillsReadme = files.get('skills/README.md') as string;
    expect(skillsReadme).toContain('Selected AI work guides at generation time');

    const script = files.get('scripts/install-selected-skills.sh') as string;
    expect(script).toContain('REPOGENESIS_ROOT');
    expect(script).toContain('repo-readiness-review');
  });

  it('should include pre-bundled selected skills when provided by the caller', () => {
    const brief = parseBrief(SINGLE_BRIEF);
    const files = generateFromSpec(brief, {
      selectedSkills: [
        {
          id: 'repo-readiness-review',
          name: 'Repo Readiness Review',
          version: '0.1.0',
          sourceType: 'curated',
          providers: ['claude_code'],
        },
      ],
      selectedSkillsBundled: true,
      selectedSkillsManifest: {
        version: 1,
        source: 'repogenesis',
        installed: [
          {
            id: 'repo-readiness-review',
            version: '0.1.0',
            installedAt: '2026-03-15T00:00:00.000Z',
            installedBy: 'test',
            sourceType: 'curated',
            artifacts: [
              {
                provider: 'claude_code',
                artifactKind: 'skill',
                path: '.claude/skills/repo-readiness-review/SKILL.md',
              },
            ],
          },
        ],
      },
      selectedSkillFiles: [
        ['.claude/skills/repo-readiness-review/SKILL.md', '# Repo Readiness Review\n'],
      ],
    });

    expect(files.has('.claude/skills/repo-readiness-review/SKILL.md')).toBe(true);
    expect(files.has('scripts/install-selected-skills.sh')).toBe(false);

    const skillManifest = JSON.parse(files.get('repogenesis.skills.json') as string);
    expect(skillManifest.installed).toHaveLength(1);

    const runbook = files.get('docs/runbooks/skill-install.md') as string;
    expect(runbook).toContain('Bundled In This Repository');
    expect(runbook).not.toContain('scripts/install-selected-skills.sh');

    const skillsReadme = files.get('skills/README.md') as string;
    expect(skillsReadme).toContain('already bundled');
  });

});
