import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { doctor } from '../src/doctor';
import { generate } from '../src/generator';

const FIXTURES = path.join(__dirname, 'fixtures');

function loadFixture(name: string): object {
  return JSON.parse(fs.readFileSync(path.join(FIXTURES, name), 'utf-8'));
}

describe('doctor', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-doctor-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function generateFixture(name: string) {
    const inputPath = path.join(tmpDir, `${name}.json`);
    fs.writeFileSync(inputPath, JSON.stringify(loadFixture(name)), 'utf-8');
    const result = generate({ inputPath, outputPath: tmpDir, force: true });
    expect(result.success).toBe(true);
    return result.outputDir;
  }

  it('passes for generated single-repo Codex projects', () => {
    const outputDir = generateFixture('test_brief_codex.json');
    const result = doctor({ projectRoot: outputDir });

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('passes for generated multi-repo projects', () => {
    const outputDir = generateFixture('test_brief_multi.json');
    const result = doctor({ projectRoot: outputDir });

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('passes for planning-aware single-repo projects when summaries and env vars stay aligned', () => {
    const outputDir = generateFixture('test_brief_planning.json');
    const result = doctor({ projectRoot: outputDir });

    expect(result.success).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('fails when an expected tool wrapper is missing', () => {
    const outputDir = generateFixture('test_brief_codex.json');
    fs.rmSync(path.join(outputDir, 'AGENTS.md'));

    const result = doctor({ projectRoot: outputDir });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Missing expected tool wrapper: AGENTS.md');
  });

  it('fails when the skills manifest points at a missing artifact', () => {
    const outputDir = generateFixture('test_brief_codex.json');
    fs.writeFileSync(path.join(outputDir, 'repogenesis.skills.json'), `${JSON.stringify({
      version: 1,
      source: 'repogenesis',
      installed: [
        {
          id: 'repo-readiness-review',
          version: '0.1.0',
          installedAt: '2026-03-20T00:00:00.000Z',
          artifacts: [
            {
              provider: 'codex',
              artifactKind: 'skill',
              path: '.codex/skills/repo-readiness-review/SKILL.md',
            },
          ],
        },
      ],
    }, null, 2)}\n`);

    const result = doctor({ projectRoot: outputDir });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('Missing installed skill artifact: .codex/skills/repo-readiness-review/SKILL.md');
  });

  it('fails when .env.example drops an adopted dependency env var', () => {
    const outputDir = generateFixture('test_brief_planning.json');
    const envPath = path.join(outputDir, '.env.example');
    fs.writeFileSync(envPath, fs.readFileSync(envPath, 'utf-8').replace('OPENAI_API_KEY=YOUR_OPENAI_API_KEY_HERE\n', ''));

    const result = doctor({ projectRoot: outputDir });

    expect(result.success).toBe(false);
    expect(result.errors).toContain('.env.example is missing adopted dependency env var: OPENAI_API_KEY');
  });

  it('fails when PROJECT.md loses an adopted planning summary', () => {
    const outputDir = generateFixture('test_brief_planning.json');
    const projectPath = path.join(outputDir, 'PROJECT.md');
    fs.writeFileSync(
      projectPath,
      fs.readFileSync(projectPath, 'utf-8').replace('- AI API: OpenAI API — Contract summaries are generated through the hosted API.\n', ''),
    );

    const result = doctor({ projectRoot: outputDir });

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      'PROJECT.md is missing adopted planning summary: - AI API: OpenAI API — Contract summaries are generated through the hosted API.',
    );
  });
});
