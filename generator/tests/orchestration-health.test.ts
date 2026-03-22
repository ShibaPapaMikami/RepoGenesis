import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { buildHealthPayload } from '../src/orchestration/health';
import { appendAuditRecord, resetSupportDataStoreForTests } from '../src/orchestration/supportDataStore';

let tmpDir = '';

describe('orchestration health payload', () => {
  afterEach(() => {
    resetSupportDataStoreForTests();
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = '';
    }
    delete process.env.SUPPORT_DATA_DB_PATH;
  });

  it('reports configured support store details without requiring prior writes', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-health-'));
    process.env.SUPPORT_DATA_DB_PATH = path.join(tmpDir, 'support-data.sqlite');

    const payload = buildHealthPayload();
    expect(payload.ok).toBe(true);
    expect(payload.supportData.configuredPath).toContain('support-data.sqlite');
    expect(payload.supportData.usingDefaultPath).toBe(false);
    expect(payload.supportData.exists).toBe(false);
  });

  it('reports support store existence after a write', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-health-'));
    process.env.SUPPORT_DATA_DB_PATH = path.join(tmpDir, 'support-data.sqlite');

    appendAuditRecord({
      requestId: 'srv-1',
      userId: 'dev-user',
      timestamp: '2026-03-21T00:00:00.000Z',
      result: 'success',
      specVersion: '1.0',
      repoType: 'single',
      fileCount: 29,
    });

    const payload = buildHealthPayload();
    expect(payload.supportData.exists).toBe(true);
    expect(payload.supportData.absolutePath).toContain('support-data.sqlite');
  });
});
