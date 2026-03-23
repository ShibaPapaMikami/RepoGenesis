import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import {
  appendAuditRecord,
  getSupportDataStorePath,
  getSupportDataStoreStatus,
  getFeedbackRecord,
  persistFeedback,
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

  it('ignores malformed JSON blobs instead of crashing readers', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-support-'));
    process.env.SUPPORT_DATA_DB_PATH = path.join(tmpDir, 'support-data.sqlite');

    persistFeedback({
      feedbackId: 'bug-1',
      requestId: 'srv-123',
      createdAt: '2026-03-21T00:00:00.000Z',
      type: 'bug',
      userId: 'user-1',
      title: 'Broken ZIP',
      description: 'ZIP generation failed during smoke check.',
      metadata: { severity: 'high' },
    });
    appendAuditRecord({
      requestId: 'srv-456',
      userId: 'user-2',
      timestamp: '2026-03-21T00:00:00.000Z',
      result: 'success',
      selectedSkillIds: ['repo-readiness-review'],
    });

    const db = new DatabaseSync(getSupportDataStorePath());
    db.exec("UPDATE feedback_entries SET metadata_json = '{broken' WHERE feedback_id = 'bug-1'");
    db.exec("UPDATE generation_audit_entries SET selected_skill_ids_json = '{broken' WHERE request_id = 'srv-456'");
    db.close();

    expect(getFeedbackRecord('bug-1')?.metadata).toBeUndefined();
    expect(listAuditRecords()[0]?.selectedSkillIds).toBeUndefined();
  });
});
