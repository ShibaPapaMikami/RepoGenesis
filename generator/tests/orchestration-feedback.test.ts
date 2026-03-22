import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { handleFeedbackApiRequest } from '../src/orchestration/feedback';
import { getFeedbackRecord, getSupportDataStorePath, resetSupportDataStoreForTests } from '../src/orchestration/feedbackStore';

let tmpDir = '';

describe('orchestration feedback api', () => {
  afterEach(() => {
    resetSupportDataStoreForTests();
    if (tmpDir) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
      tmpDir = '';
    }
    delete process.env.FEEDBACK_REQUIRE_AUTH;
    delete process.env.SUPPORT_DATA_DB_PATH;
  });

  it('accepts anonymous feedback when FEEDBACK_REQUIRE_AUTH is false', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    process.env.FEEDBACK_REQUIRE_AUTH = 'false';
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-feedback-'));
    process.env.SUPPORT_DATA_DB_PATH = path.join(tmpDir, 'support-data.sqlite');
    const res = await handleFeedbackApiRequest(undefined, undefined, 'bug', {
      title: '匿名バグ報告',
      description: '匿名でも保存できることを確認するためのテストです。',
    });
    expect(res.status).toBe(200);
  });

  it('returns 400 when payload is invalid', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-feedback-'));
    process.env.SUPPORT_DATA_DB_PATH = path.join(tmpDir, 'support-data.sqlite');
    const res = await handleFeedbackApiRequest('Bearer dev-token', undefined, 'bug', {
      title: 'x',
      description: 'short',
    });
    expect(res.status).toBe(400);
  });

  it('stores bug report in the shared sqlite support store', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-feedback-'));
    process.env.SUPPORT_DATA_DB_PATH = path.join(tmpDir, 'support-data.sqlite');
    const res = await handleFeedbackApiRequest('Bearer dev-token', undefined, 'bug', {
      title: 'Cannot generate zip',
      description: 'ZIP generation failed with 403 and request id.',
      email: 'tester@gugenka.jp',
      metadata: { ui: 'app', at: 'test' },
    });
    expect(res.status).toBe(200);
    if (res.status === 200) {
      expect(res.body.storedPath).toContain('support-data.sqlite#feedback:');
      expect(fs.existsSync(getSupportDataStorePath())).toBe(true);
      const stored = getFeedbackRecord(res.body.feedbackId);
      expect(stored?.type).toBe('bug');
      expect(stored?.title).toBe('Cannot generate zip');
    }
  });
});
