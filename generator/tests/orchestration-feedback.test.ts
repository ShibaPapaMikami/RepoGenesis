import * as fs from 'fs';
import * as path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { handleFeedbackApiRequest } from '../src/orchestration/feedback';

const feedbackBaseDir = path.resolve(process.cwd(), 'logs', 'feedback');

describe('orchestration feedback api', () => {
  afterEach(() => {
    fs.rmSync(feedbackBaseDir, { recursive: true, force: true });
    delete process.env.FEEDBACK_REQUIRE_AUTH;
  });

  it('accepts anonymous feedback when FEEDBACK_REQUIRE_AUTH is false', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    process.env.FEEDBACK_REQUIRE_AUTH = 'false';
    const res = await handleFeedbackApiRequest(undefined, undefined, 'bug', {
      title: '匿名バグ報告',
      description: '匿名でも保存できることを確認するためのテストです。',
    });
    expect(res.status).toBe(200);
  });

  it('returns 400 when payload is invalid', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    const res = await handleFeedbackApiRequest('Bearer dev-token', undefined, 'bug', {
      title: 'x',
      description: 'short',
    });
    expect(res.status).toBe(400);
  });

  it('stores bug report json under logs/feedback/bugs', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    const res = await handleFeedbackApiRequest('Bearer dev-token', undefined, 'bug', {
      title: 'Cannot generate zip',
      description: 'ZIP generation failed with 403 and request id.',
      email: 'tester@gugenka.jp',
      metadata: { ui: 'app', at: 'test' },
    });
    expect(res.status).toBe(200);
    if (res.status === 200) {
      const filePath = path.resolve(process.cwd(), res.body.storedPath);
      expect(fs.existsSync(filePath)).toBe(true);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const json = JSON.parse(raw) as { type: string; title: string };
      expect(json.type).toBe('bug');
      expect(json.title).toBe('Cannot generate zip');
    }
  });
});
