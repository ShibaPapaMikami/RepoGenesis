import test from 'node:test';
import assert from 'node:assert/strict';

type FetchResponseLike = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

const originalFetch = global.fetch;

function mockFetch(impl: typeof fetch) {
  global.fetch = impl;
}

test.afterEach(() => {
  global.fetch = originalFetch;
});

test('fetchSupportSnapshot reads feedback and audit through the support proxy', async () => {
  const calls: string[] = [];
  mockFetch((async (input: string | URL | Request) => {
    const url = String(input);
    calls.push(url);
    if (url.includes('/feedback')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          items: [{ feedbackId: 'fb-1', requestId: 'srv-1', createdAt: '2026-03-21T00:00:00.000Z', type: 'bug', userId: 'dev-user', title: 'Broken ZIP', description: 'Failed during smoke test' }],
          storePath: '/srv/repogenesis/support-data.sqlite',
        }),
      } as FetchResponseLike as Response;
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        items: [{ requestId: 'srv-1', timestamp: '2026-03-21T00:00:00.000Z', userId: 'dev-user', result: 'success', repoType: 'single', fileCount: 29, specVersion: '1.0' }],
        storePath: '/srv/repogenesis/support-data.sqlite',
      }),
    } as FetchResponseLike as Response;
  }) as typeof fetch);

  const previousApi = process.env.VITE_ORCHESTRATION_API_URL;
  process.env.VITE_ORCHESTRATION_API_URL = '/api/orchestration';

  const { fetchSupportSnapshot } = await import('../src/utils/support.ts');
  const result = await fetchSupportSnapshot({ feedbackType: 'bug', feedbackLimit: 5, auditLimit: 3 });

  assert.equal(calls[0], '/api/orchestration/support/feedback?type=bug&limit=5');
  assert.equal(calls[1], '/api/orchestration/support/audit?limit=3');
  assert.equal(result.feedbackItems[0]?.feedbackId, 'fb-1');
  assert.equal(result.auditItems[0]?.requestId, 'srv-1');

  if (previousApi === undefined) {
    delete process.env.VITE_ORCHESTRATION_API_URL;
  } else {
    process.env.VITE_ORCHESTRATION_API_URL = previousApi;
  }
});

test('fetchSupportSnapshot surfaces upstream errors', async () => {
  mockFetch((async () => ({
    ok: false,
    status: 401,
    json: async () => ({ error: 'Unauthorized' }),
  }) as FetchResponseLike as Response) as typeof fetch);

  const previousApi = process.env.VITE_ORCHESTRATION_API_URL;
  process.env.VITE_ORCHESTRATION_API_URL = '/api/orchestration';

  const { fetchSupportSnapshot } = await import('../src/utils/support.ts');
  await assert.rejects(
    () => fetchSupportSnapshot(),
    /運用ログの読み込みに失敗しました \(401\): Unauthorized/,
  );

  if (previousApi === undefined) {
    delete process.env.VITE_ORCHESTRATION_API_URL;
  } else {
    process.env.VITE_ORCHESTRATION_API_URL = previousApi;
  }
});

test('canViewSupportPanel only allows configured support viewers', async () => {
  const previousEmails = process.env.VITE_SUPPORT_ALLOWED_EMAILS;
  const previousDomains = process.env.VITE_SUPPORT_ALLOWED_DOMAINS;
  process.env.VITE_SUPPORT_ALLOWED_EMAILS = 'owner@gugenka.jp, dev@example.com';
  process.env.VITE_SUPPORT_ALLOWED_DOMAINS = 'support.gugenka.jp, ops.example.com';

  const { canViewSupportPanel } = await import('../src/utils/supportAccess.ts');

  assert.equal(canViewSupportPanel('owner@gugenka.jp'), true);
  assert.equal(canViewSupportPanel('user@ops.example.com'), true);
  assert.equal(canViewSupportPanel('member@gugenka.jp'), false);
  assert.equal(canViewSupportPanel(null), false);

  if (previousEmails === undefined) {
    delete process.env.VITE_SUPPORT_ALLOWED_EMAILS;
  } else {
    process.env.VITE_SUPPORT_ALLOWED_EMAILS = previousEmails;
  }

  if (previousDomains === undefined) {
    delete process.env.VITE_SUPPORT_ALLOWED_DOMAINS;
  } else {
    process.env.VITE_SUPPORT_ALLOWED_DOMAINS = previousDomains;
  }
});
