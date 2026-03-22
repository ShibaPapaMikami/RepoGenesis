import test from 'node:test';
import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'http';
import authSessionHandler from '../api/auth/session.ts';
import supportFeedbackHandler from '../api/orchestration/support/feedback.ts';

type MockReq = IncomingMessage & {
  method?: string;
  headers: Record<string, string | undefined>;
  body?: unknown;
  query?: Record<string, string | undefined>;
};

type MockRes = ServerResponse & {
  statusCode: number;
  body: unknown;
  headersOut: Record<string, string>;
  json: (body: unknown) => MockRes;
  send: (body: unknown) => MockRes;
  status: (code: number) => MockRes;
  setHeader: (name: string, value: string) => MockRes;
  end: () => void;
};

function createMockRes(): MockRes {
  return {
    statusCode: 200,
    body: undefined,
    headersOut: {},
    json(body: unknown) {
      this.body = body;
      return this;
    },
    send(body: unknown) {
      this.body = body;
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    setHeader(name: string, value: string) {
      this.headersOut[name.toLowerCase()] = value;
      return this;
    },
    end() {
      return undefined;
    },
  } as MockRes;
}

test('auth session route requires explicit local admin mode on loopback hosts', async () => {
  const previous = process.env.LOCAL_ADMIN_MODE;
  delete process.env.LOCAL_ADMIN_MODE;

  const req = {
    method: 'POST',
    headers: { host: 'localhost:3000' },
    body: { email: 'dev@gugenka.jp' },
  } as MockReq;
  const res = createMockRes();

  await authSessionHandler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    error: 'LOCAL_ADMIN_MODE=enabled is required for local auth/support debug paths',
  });

  if (previous === undefined) {
    delete process.env.LOCAL_ADMIN_MODE;
  } else {
    process.env.LOCAL_ADMIN_MODE = previous;
  }
});

test('support proxy route requires explicit local admin mode on loopback hosts', async () => {
  const previous = process.env.LOCAL_ADMIN_MODE;
  delete process.env.LOCAL_ADMIN_MODE;

  const req = {
    method: 'GET',
    headers: { host: '127.0.0.1:3000' },
    query: { limit: '1' },
  } as MockReq;
  const res = createMockRes();

  await supportFeedbackHandler(req, res);

  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, {
    error: 'LOCAL_ADMIN_MODE=enabled is required for local auth/support debug paths',
  });

  if (previous === undefined) {
    delete process.env.LOCAL_ADMIN_MODE;
  } else {
    process.env.LOCAL_ADMIN_MODE = previous;
  }
});

test('support proxy route still proceeds past the local admin gate when enabled', async () => {
  const previousAdmin = process.env.LOCAL_ADMIN_MODE;
  const previousUpstream = process.env.ORCHESTRATION_API_URL;
  process.env.LOCAL_ADMIN_MODE = 'enabled';
  delete process.env.ORCHESTRATION_API_URL;

  const req = {
    method: 'GET',
    headers: { host: 'localhost:3000' },
    query: { limit: '1' },
  } as MockReq;
  const res = createMockRes();

  await supportFeedbackHandler(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, {
    error: 'ORCHESTRATION_API_URL is not configured',
  });

  if (previousAdmin === undefined) {
    delete process.env.LOCAL_ADMIN_MODE;
  } else {
    process.env.LOCAL_ADMIN_MODE = previousAdmin;
  }
  if (previousUpstream === undefined) {
    delete process.env.ORCHESTRATION_API_URL;
  } else {
    process.env.ORCHESTRATION_API_URL = previousUpstream;
  }
});
