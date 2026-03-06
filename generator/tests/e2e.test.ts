import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.resolve(__dirname, '..');
const DIST_INDEX = path.join(ROOT, 'dist', 'index.js');
const FIXTURES = path.join(__dirname, 'fixtures');
const TMP_OUTPUT = path.join(__dirname, 'tmp_output');

function run(fixtureName: string, caseName: string): { stdout: string; stderr: string; exitCode: number } {
  const inputPath = path.join(FIXTURES, fixtureName);
  const outputPath = path.join(TMP_OUTPUT, caseName);
  fs.mkdirSync(outputPath, { recursive: true });

  try {
    const stdout = execSync(
      `node ${DIST_INDEX} --input ${inputPath} --output ${outputPath} --force`,
      { encoding: 'utf-8', cwd: ROOT, timeout: 10000 },
    );
    return { stdout, stderr: '', exitCode: 0 };
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string; status?: number };
    return {
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? '',
      exitCode: e.status ?? 1,
    };
  }
}

beforeAll(() => {
  // Ensure dist/index.js exists (run `npm run build` before tests)
  if (!fs.existsSync(DIST_INDEX)) {
    throw new Error(
      `dist/index.js not found. Run "npm run build" before running E2E tests.`,
    );
  }
});

beforeEach(() => {
  // Clean tmp_output before each test
  if (fs.existsSync(TMP_OUTPUT)) {
    fs.rmSync(TMP_OUTPUT, { recursive: true, force: true });
  }
  fs.mkdirSync(TMP_OUTPUT, { recursive: true });
});

describe('E2E — single-repo', () => {
  const SLUG = 'e2e-single-test';

  it('should exit 0 and generate files', () => {
    const result = run('test_brief_single.json', 'single');
    expect(result.exitCode, `CLI failed.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`).toBe(0);
    expect(result.stdout).toContain('Generated');
  });

  it('should create all required single-repo files', () => {
    run('test_brief_single.json', 'single');
    const base = path.join(TMP_OUTPUT, 'single', SLUG);

    const requiredFiles = [
      'claude.md',
      'docs/ACTIVE_CONTEXT.md',
      'docs/REQUIREMENTS.md',
      'docs/ARCHITECTURE.md',
      'docs/ROADMAP.md',
      'docs/VERSIONING_STANDARD.md',
      'docs/ADR/0000-template.md',
      'plans/template.md',
      'prompts/restart.md',
      'SECURITY.md',
      '.env.example',
      '.gitignore',
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(base, file);
      expect(fs.existsSync(fullPath), `Missing: ${file}`).toBe(true);
      expect(fs.readFileSync(fullPath, 'utf-8').length, `Empty: ${file}`).toBeGreaterThan(0);
    }
  });

  it('should reflect has_payment_data in SECURITY.md (PCI DSS)', () => {
    run('test_brief_single.json', 'single');
    const security = fs.readFileSync(
      path.join(TMP_OUTPUT, 'single', SLUG, 'SECURITY.md'), 'utf-8',
    );
    expect(security).toContain('PCI DSS');
    expect(security).toContain('Payment Data Policy');
  });

  it('should reflect has_payment_data in claude.md (payment rule)', () => {
    run('test_brief_single.json', 'single');
    const claude = fs.readFileSync(
      path.join(TMP_OUTPUT, 'single', SLUG, 'claude.md'), 'utf-8',
    );
    expect(claude).toContain('payment data');
  });

  it('should reflect has_api_keys in .env.example', () => {
    run('test_brief_single.json', 'single');
    const env = fs.readFileSync(
      path.join(TMP_OUTPUT, 'single', SLUG, '.env.example'), 'utf-8',
    );
    expect(env).toContain('API_KEY');
  });

  it('should generate GitHub convention files (CONTRIBUTING, PR template, issue templates)', () => {
    run('test_brief_single.json', 'single');
    const base = path.join(TMP_OUTPUT, 'single', SLUG);

    const githubFiles = [
      'CONTRIBUTING.md',
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/ISSUE_TEMPLATE/bug_report.md',
      '.github/ISSUE_TEMPLATE/feature_request.md',
    ];
    for (const file of githubFiles) {
      expect(fs.existsSync(path.join(base, file)), `Missing: ${file}`).toBe(true);
    }

    const contributing = fs.readFileSync(path.join(base, 'CONTRIBUTING.md'), 'utf-8');
    expect(contributing).toContain('Conventional Commits');
    expect(contributing).toContain('Security');
    expect(contributing).toContain('vX.Y.Z');

    const pr = fs.readFileSync(path.join(base, '.github/PULL_REQUEST_TEMPLATE.md'), 'utf-8');
    expect(pr).toContain('Security Checklist');
  });
});

describe('E2E — app export', () => {
  const SLUG = 'app-export-test';

  it('should exit 0 and generate 17 files from app export JSON', () => {
    const result = run('test_brief_app_export.json', 'app-export');
    expect(result.exitCode, `CLI failed.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`).toBe(0);
    expect(result.stdout).toContain('17 files');
  });

  it('should create all 17 required single-repo files from app export', () => {
    run('test_brief_app_export.json', 'app-export');
    const base = path.join(TMP_OUTPUT, 'app-export', SLUG);

    const requiredFiles = [
      'claude.md',
      'docs/ACTIVE_CONTEXT.md',
      'docs/REQUIREMENTS.md',
      'docs/ARCHITECTURE.md',
      'docs/ROADMAP.md',
      'docs/VERSIONING_STANDARD.md',
      'docs/ADR/0000-template.md',
      'plans/template.md',
      'prompts/restart.md',
      'SECURITY.md',
      '.env.example',
      '.gitignore',
      'CONTRIBUTING.md',
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/ISSUE_TEMPLATE/bug_report.md',
      '.github/ISSUE_TEMPLATE/feature_request.md',
      '.repogenesis/manifest.json',
    ];

    expect(requiredFiles.length).toBe(17);

    for (const file of requiredFiles) {
      const fullPath = path.join(base, file);
      expect(fs.existsSync(fullPath), `Missing: ${file}`).toBe(true);
      expect(fs.readFileSync(fullPath, 'utf-8').length, `Empty: ${file}`).toBeGreaterThan(0);
    }
  });
});

describe('E2E — multi-repo', () => {
  const SLUG = 'e2e-multi-test';

  it('should exit 0 and generate files', () => {
    const result = run('test_brief_multi.json', 'multi');
    expect(result.exitCode, `CLI failed.\nstdout: ${result.stdout}\nstderr: ${result.stderr}`).toBe(0);
  });

  it('should create workspace-level files', () => {
    run('test_brief_multi.json', 'multi');
    const base = path.join(TMP_OUTPUT, 'multi', SLUG);

    for (const file of ['GLOBAL_CONTEXT.md', 'REQUIREMENTS.md', 'SECURITY.md', 'VERSIONING_STANDARD.md', '.gitignore', '.repogenesis/manifest.json']) {
      expect(fs.existsSync(path.join(base, file)), `Missing workspace file: ${file}`).toBe(true);
    }
  });

  it('should create per-repo claude.md for all repos', () => {
    run('test_brief_multi.json', 'multi');
    const base = path.join(TMP_OUTPUT, 'multi', SLUG);

    for (const repo of ['web-app', 'api-server', 'infra']) {
      const claudePath = path.join(base, repo, 'claude.md');
      expect(fs.existsSync(claudePath), `Missing: ${repo}/claude.md`).toBe(true);
      expect(fs.readFileSync(claudePath, 'utf-8')).toContain(repo);
    }
  });

  it('should include repos list in GLOBAL_CONTEXT.md', () => {
    run('test_brief_multi.json', 'multi');
    const gc = fs.readFileSync(
      path.join(TMP_OUTPUT, 'multi', SLUG, 'GLOBAL_CONTEXT.md'), 'utf-8',
    );
    expect(gc).toContain('web-app');
    expect(gc).toContain('api-server');
    expect(gc).toContain('infra');
  });

  it('should include dependency info in GLOBAL_CONTEXT.md', () => {
    run('test_brief_multi.json', 'multi');
    const gc = fs.readFileSync(
      path.join(TMP_OUTPUT, 'multi', SLUG, 'GLOBAL_CONTEXT.md'), 'utf-8',
    );
    expect(gc).toContain('depends on');
    expect(gc).toContain('web-app');
  });

  it('should reflect has_credentials in .gitignore (certificate exclusion)', () => {
    run('test_brief_multi.json', 'multi');
    const gitignore = fs.readFileSync(
      path.join(TMP_OUTPUT, 'multi', SLUG, '.gitignore'), 'utf-8',
    );
    expect(gitignore).toContain('.pem');
  });

  it('should reflect has_ip_sensitive in .gitignore (confidential exclusion)', () => {
    run('test_brief_multi.json', 'multi');
    const gitignore = fs.readFileSync(
      path.join(TMP_OUTPUT, 'multi', SLUG, '.gitignore'), 'utf-8',
    );
    expect(gitignore).toContain('confidential');
  });

  it('should generate GitHub convention files at workspace root for multi-repo', () => {
    run('test_brief_multi.json', 'multi');
    const base = path.join(TMP_OUTPUT, 'multi', SLUG);

    const githubFiles = [
      'CONTRIBUTING.md',
      '.github/PULL_REQUEST_TEMPLATE.md',
      '.github/ISSUE_TEMPLATE/bug_report.md',
      '.github/ISSUE_TEMPLATE/feature_request.md',
    ];
    for (const file of githubFiles) {
      expect(fs.existsSync(path.join(base, file)), `Missing: ${file}`).toBe(true);
    }

    const contributing = fs.readFileSync(path.join(base, 'CONTRIBUTING.md'), 'utf-8');
    expect(contributing).toContain('E2E Multi Test');
  });
});
