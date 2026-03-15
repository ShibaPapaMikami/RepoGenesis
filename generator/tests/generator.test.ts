import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generate } from '../src/generator';
import { generateFromSpec } from '../src/generateFromSpec';
import { projectBriefSchema } from '../src/schema';

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
  it('should generate all required files for single-repo', () => {
    const inputPath = writeInputFile(SINGLE_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: false });

    expect(result.success).toBe(true);
    expect(result.filesCreated.length).toBe(22);

    const expectedFiles = [
      'PROJECT.md',
      'CLAUDE.md',
      'docs/ACTIVE_CONTEXT.md',
      'docs/REQUIREMENTS.md',
      'docs/ARCHITECTURE.md',
      'docs/ROADMAP.md',
      'docs/VERSIONING_STANDARD.md',
      'docs/ADR/0000-template.md',
      'docs/runbooks/README.md',
      'docs/runbooks/skill-install.md',
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
    expect(result.filesCreated.length).toBe(22);
  });
});

describe('generator — multi-repo', () => {
  it('should generate GLOBAL_CONTEXT.md and per-repo structures', () => {
    const inputPath = writeInputFile(MULTI_BRIEF);
    const result = generate({ inputPath, outputPath: tmpDir, force: false });

    expect(result.success).toBe(true);

    // Workspace-level files
    const workspaceFiles = ['PROJECT.md', 'CLAUDE.md', 'GLOBAL_CONTEXT.md', 'REQUIREMENTS.md', 'SECURITY.md', 'VERSIONING_STANDARD.md', 'docs/runbooks/README.md', 'docs/runbooks/skill-install.md', '.gitignore', 'skills/README.md', 'repogenesis.skills.json'];
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

  it('should return Map with 22 files for single-repo', () => {
    const brief = parseBrief(SINGLE_BRIEF);
    const files = generateFromSpec(brief);
    expect(files.size).toBe(22);
    expect(files.has('PROJECT.md')).toBe(true);
    expect(files.has('CLAUDE.md')).toBe(true);
    expect(files.has('SECURITY.md')).toBe(true);
    expect(files.has('docs/VERSIONING_STANDARD.md')).toBe(true);
    expect(files.has('docs/runbooks/README.md')).toBe(true);
    expect(files.has('docs/runbooks/skill-install.md')).toBe(true);
    expect(files.has('.gitignore')).toBe(true);
    expect(files.has('skills/README.md')).toBe(true);
    expect(files.has('repogenesis.skills.json')).toBe(true);
    expect(files.has('.repogenesis/manifest.json')).toBe(true);
  });

  it('should return Map with correct files for multi-repo', () => {
    const brief = parseBrief(MULTI_BRIEF);
    const files = generateFromSpec(brief);
    // 15 workspace + 11 * 2 repos + 1 manifest = 38
    expect(files.size).toBe(38);
    expect(files.has('PROJECT.md')).toBe(true);
    expect(files.has('CLAUDE.md')).toBe(true);
    expect(files.has('GLOBAL_CONTEXT.md')).toBe(true);
    expect(files.has('VERSIONING_STANDARD.md')).toBe(true);
    expect(files.has('docs/runbooks/README.md')).toBe(true);
    expect(files.has('docs/runbooks/skill-install.md')).toBe(true);
    expect(files.has('skills/README.md')).toBe(true);
    expect(files.has('repogenesis.skills.json')).toBe(true);
    expect(files.has('frontend/PROJECT.md')).toBe(true);
    expect(files.has('frontend/CLAUDE.md')).toBe(true);
    expect(files.has('frontend/docs/VERSIONING_STANDARD.md')).toBe(true);
    expect(files.has('backend/PROJECT.md')).toBe(true);
    expect(files.has('backend/CLAUDE.md')).toBe(true);
    expect(files.has('.repogenesis/manifest.json')).toBe(true);
  });

  it('should produce identical output for same input (deterministic)', () => {
    const brief = parseBrief(SINGLE_BRIEF);
    const files1 = generateFromSpec(brief);
    const files2 = generateFromSpec(brief);
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
    expect(manifest.fileCount).toBe(22);
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

    const skillsReadme = files.get('skills/README.md') as string;
    expect(skillsReadme).toContain('Recommended at generation time');
  });

});
