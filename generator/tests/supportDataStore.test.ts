import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  appendAuditRecord,
  getSupportDataStorePath,
  getSupportDataStoreStatus,
  listAuditRecords,
  resetSupportDataStoreForTests,
} from '../src/orchestration/supportDataStore';

let tmpDir = '';

describe('supportDataStore', () => {
  afterEach(() => {
    resetSupportDataStoreForTests();
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = '';
    }
    delete process.env.SUPPORT_DATA_DB_PATH;
  });

  it('stores generation audit records in sqlite for later listing', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-support-'));
    process.env.SUPPORT_DATA_DB_PATH = path.join(tmpDir, 'support-data.sqlite');

    appendAuditRecord({
      requestId: 'srv-123',
      userId: 'user-1',
      timestamp: '2026-03-21T00:00:00.000Z',
      result: 'success',
      specVersion: '1.0',
      repoType: 'single',
      fileCount: 29,
      projectSlug: 'audit-demo',
      artifactFilename: 'audit-demo.zip',
      authProvider: 'mock',
      authMode: 'bearer',
      selectedSkillIds: ['repo-readiness-review'],
    });

    expect(fs.existsSync(getSupportDataStorePath())).toBe(true);
    expect(listAuditRecords()).toEqual([
      {
        requestId: 'srv-123',
        userId: 'user-1',
        timestamp: '2026-03-21T00:00:00.000Z',
        result: 'success',
        specVersion: '1.0',
        repoType: 'single',
        fileCount: 29,
        projectSlug: 'audit-demo',
        artifactFilename: 'audit-demo.zip',
        authProvider: 'mock',
        authMode: 'bearer',
        selectedSkillIds: ['repo-readiness-review'],
      },
    ]);
  });

  it('reports default-path status when SUPPORT_DATA_DB_PATH is unset', () => {
    const status = getSupportDataStoreStatus();
    expect(status.usingDefaultPath).toBe(true);
    expect(status.configuredPath).toBeNull();
    expect(status.absolutePath).toContain(path.join('data', 'support-data.sqlite'));
  });
});
