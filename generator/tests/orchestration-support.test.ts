import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { appendAuditRecord } from '../src/orchestration/audit';
import { persistFeedback, resetSupportDataStoreForTests } from '../src/orchestration/feedbackStore';
import {
  handleSupportAuditListRequest,
  handleSupportFeedbackListRequest,
} from '../src/orchestration/support';

let tmpDir = '';

describe('orchestration support api', () => {
  afterEach(() => {
    resetSupportDataStoreForTests();
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = '';
    }
    delete process.env.AUTH_PROVIDER;
    delete process.env.SUPPORT_DATA_DB_PATH;
  });

  it('lists feedback records for authorized users', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-support-api-'));
    process.env.SUPPORT_DATA_DB_PATH = path.join(tmpDir, 'support-data.sqlite');

    persistFeedback({
      feedbackId: 'bug-1',
      requestId: 'fb-1',
      createdAt: '2026-03-21T00:00:00.000Z',
      type: 'bug',
      userId: 'dev-user',
      title: 'Broken ZIP',
      description: 'ZIP generation failed during a smoke check.',
    });

    const result = await handleSupportFeedbackListRequest('Bearer dev-token', undefined, 'http://localhost/api/v1/support/feedback?type=bug&limit=5');

    expect(result.status).toBe(200);
    if (result.status === 200) {
      expect(result.body.items).toHaveLength(1);
      expect(result.body.items[0]?.feedbackId).toBe('bug-1');
      expect(result.body.storePath).toContain('support-data.sqlite');
    }
  });

  it('lists audit records for authorized users', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-support-api-'));
    process.env.SUPPORT_DATA_DB_PATH = path.join(tmpDir, 'support-data.sqlite');

    appendAuditRecord({
      requestId: 'srv-1',
      userId: 'dev-user',
      timestamp: '2026-03-21T00:00:00.000Z',
      result: 'success',
      specVersion: '1.0',
      repoType: 'single',
      fileCount: 29,
      projectSlug: 'support-demo',
      artifactFilename: 'support-demo.zip',
      authProvider: 'mock',
      authMode: 'bearer',
      selectedSkillIds: ['repo-readiness-review'],
    });

    const result = await handleSupportAuditListRequest('Bearer dev-token', undefined, 'http://localhost/api/v1/support/audit?limit=5');

    expect(result.status).toBe(200);
    if (result.status === 200) {
      expect(result.body.items).toHaveLength(1);
      expect(result.body.items[0]?.requestId).toBe('srv-1');
      expect(result.body.items[0]?.projectSlug).toBe('support-demo');
      expect(result.body.items[0]?.selectedSkillIds).toEqual(['repo-readiness-review']);
    }
  });

  it('rejects unauthorized support reads', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    const result = await handleSupportFeedbackListRequest(undefined, undefined, 'http://localhost/api/v1/support/feedback');
    expect(result.status).toBe(401);
  });

  it('allows support-only readers for support endpoints', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-support-api-'));
    process.env.SUPPORT_DATA_DB_PATH = path.join(tmpDir, 'support-data.sqlite');

    persistFeedback({
      feedbackId: 'request-1',
      requestId: 'fb-2',
      createdAt: '2026-03-22T00:00:00.000Z',
      type: 'request',
      userId: 'support-user',
      title: 'Add export filter',
      description: 'Need a narrower export option.',
    });

    const result = await handleSupportFeedbackListRequest('Bearer support-token', undefined, 'http://localhost/api/v1/support/feedback?limit=5');
    expect(result.status).toBe(200);
    if (result.status === 200) {
      expect(result.body.items[0]?.feedbackId).toBe('request-1');
    }
  });
});
