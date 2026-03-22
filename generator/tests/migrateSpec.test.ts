import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { migrateSpec } from '../src/migrateSpec';

const VALID_SPEC = {
  specVersion: '1.0',
  project: {
    name: 'Migration Test',
    slug: 'migration-test',
    description: 'Project spec migration test fixture for RepoGenesis',
    owner: 'Tester',
    created_at: '2026-03-22T00:00:00.000Z',
  },
  tech: {
    domains: ['web'],
    primary_language: 'typescript',
    frameworks: ['React'],
    ai_tools: ['codex'],
    ai_tool: 'other' as const,
    ai_tool_detail: 'Codex',
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
    repo_type: 'single' as const,
    repos: [],
  },
  workflow: {
    phases_count: 3,
  },
  planning: {
    tech_decisions: [],
    external_dependencies: [],
  },
};

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-migrate-spec-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeJson(filename: string, value: unknown): string {
  const filePath = path.join(tmpDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2), 'utf-8');
  return filePath;
}

describe('migrateSpec', () => {
  it('migrates legacy projectBrief input to ProjectSpec', () => {
    const { specVersion: _specVersion, ...legacyBrief } = VALID_SPEC;
    const inputPath = writeJson('legacy.json', legacyBrief);
    const outputPath = path.join(tmpDir, 'project_spec.json');

    const result = migrateSpec({ inputPath, outputPath });

    expect(result.success).toBe(true);
    expect(result.source).toBe('legacyBrief');
    expect(result.specVersion).toBe('1.0');

    const written = fs.readFileSync(outputPath, 'utf-8');
    expect(written.startsWith('{\n  "specVersion": "1.0",\n')).toBe(true);

    const parsed = JSON.parse(written);
    expect(parsed).toEqual(VALID_SPEC);
  });

  it('rewrites an existing ProjectSpec without changing semantics', () => {
    const inputPath = writeJson('project_spec.json', VALID_SPEC);
    const outputPath = path.join(tmpDir, 'normalized.json');

    const result = migrateSpec({ inputPath, outputPath });

    expect(result.success).toBe(true);
    expect(result.source).toBe('projectSpec');
    expect(result.specVersion).toBe('1.0');
    expect(JSON.parse(fs.readFileSync(outputPath, 'utf-8'))).toEqual(VALID_SPEC);
  });

  it('fails when specVersion is unsupported', () => {
    const inputPath = writeJson('unsupported.json', {
      ...VALID_SPEC,
      specVersion: '2.0',
    });
    const outputPath = path.join(tmpDir, 'normalized.json');

    const result = migrateSpec({ inputPath, outputPath });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported specVersion');
  });

  it('requires --force when output file already exists', () => {
    const inputPath = writeJson('project_spec.json', VALID_SPEC);
    const outputPath = writeJson('existing.json', { existing: true });

    const first = migrateSpec({ inputPath, outputPath });
    expect(first.success).toBe(false);
    expect(first.error).toContain('Use --force to overwrite.');

    const second = migrateSpec({ inputPath, outputPath, force: true });
    expect(second.success).toBe(true);
    expect(JSON.parse(fs.readFileSync(outputPath, 'utf-8'))).toEqual(VALID_SPEC);
  });
});
