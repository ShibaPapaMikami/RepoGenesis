import { afterEach, describe, it, expect } from 'vitest';
import { handleGenerateApiDownloadRequest, handleGenerateApiRequest } from '../src/orchestration/api';

const VALID_SPEC = {
  specVersion: '1.0',
  project: {
    name: 'Orchestration Test',
    slug: 'orchestration-test',
    description: 'Valid project spec for orchestration API test',
    owner: 'Tester',
    created_at: '2026-03-03T00:00:00.000Z',
  },
  tech: {
    domains: ['web'],
    primary_language: 'typescript',
    frameworks: ['React'],
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

const AI_FIRST_SPEC = {
  ...VALID_SPEC,
  project: {
    ...VALID_SPEC.project,
    owner: '',
  },
  tech: {
    ...VALID_SPEC.tech,
    domains: [],
  },
  security: {
    ...VALID_SPEC.security,
    level: 'medium',
    has_api_keys: false,
    has_user_data: false,
    has_ip_sensitive: true,
  },
};

describe('orchestration api', () => {
  afterEach(() => {
    delete process.env.GENERATE_REQUIRE_AUTH;
  });

  it('returns 401 without authorization header', async () => {
    const res = await handleGenerateApiRequest(undefined, undefined, { spec: VALID_SPEC });
    expect(res.status).toBe(401);
  });

  it('allows generation without auth when GENERATE_REQUIRE_AUTH=false', async () => {
    process.env.GENERATE_REQUIRE_AUTH = 'false';
    const res = await handleGenerateApiRequest(undefined, undefined, { spec: VALID_SPEC });
    expect(res.status).toBe(200);
  });

  it('returns 403 when token has no required role', async () => {
    const res = await handleGenerateApiRequest('Bearer forbidden-token', undefined, { spec: VALID_SPEC });
    expect(res.status).toBe(403);
  });

  it('returns 400 for unsupported output format', async () => {
    const res = await handleGenerateApiRequest('Bearer dev-token', undefined, {
      spec: VALID_SPEC,
      output: { format: 'zipx' },
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid spec', async () => {
    const res = await handleGenerateApiRequest('Bearer dev-token', undefined, {
      spec: { specVersion: '2.0' },
    });
    expect(res.status).toBe(400);
  });

  it('returns 200 with generation metadata for valid request', async () => {
    const res = await handleGenerateApiRequest('Bearer dev-token', undefined, {
      spec: VALID_SPEC,
      output: { format: 'zip' },
      meta: { requestId: 'req-123' },
    });
    expect(res.status).toBe(200);
    if (res.status === 200) {
      expect(res.body.requestId).toBe('req-123');
      expect(res.body.specVersion).toBe('1.0');
      expect(res.body.repoType).toBe('single');
      expect(res.body.fileCount).toBe(24);
      expect(res.body.artifact.filename).toBe('orchestration-test.zip');
      expect(res.body.artifact.contentType).toBe('application/zip');
    }
  });

  it('returns 200 with zip buffer for valid download request', async () => {
    const res = await handleGenerateApiDownloadRequest('Bearer dev-token', undefined, {
      spec: VALID_SPEC,
      output: { format: 'zip' },
      meta: { requestId: 'req-zip' },
    });
    expect(res.status).toBe(200);
    if (res.status === 200) {
      expect(res.body.requestId).toBe('req-zip');
      expect(res.body.artifact.filename).toBe('orchestration-test.zip');
      expect(res.body.zipBuffer.length).toBeGreaterThan(0);
      expect(res.body.zipBuffer.readUInt32LE(0)).toBe(0x04034b50);
    }
  });

  it('bundles selected skill artifacts into the remote zip output', async () => {
    const res = await handleGenerateApiDownloadRequest('Bearer dev-token', undefined, {
      spec: VALID_SPEC,
      output: { format: 'zip' },
      meta: {
        requestId: 'req-skill-bundle',
        selectedSkills: [
          {
            id: 'repo-readiness-review',
            name: 'Repo Readiness Review',
            version: '0.1.0',
            sourceType: 'curated',
            providers: ['claude_code'],
          },
        ],
      },
    });

    expect(res.status).toBe(200);
    if (res.status === 200) {
      expect(res.body.fileCount).toBeGreaterThan(24);
      expect(res.body.zipBuffer.toString('utf8')).toContain('.claude/skills/repo-readiness-review/SKILL.md');
      expect(res.body.zipBuffer.toString('utf8')).not.toContain('scripts/install-selected-skills.sh');
    }
  });

  it('accepts ai-first specs with empty owner and domains when security level is consistent', async () => {
    const res = await handleGenerateApiRequest('Bearer dev-token', undefined, {
      spec: AI_FIRST_SPEC,
      output: { format: 'zip' },
      meta: { requestId: 'req-ai-first' },
    });
    expect(res.status).toBe(200);
  });
});
