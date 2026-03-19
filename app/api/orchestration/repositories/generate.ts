import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

type VercelRequest = IncomingMessage & {
  method?: string;
  body?: unknown;
  headers: IncomingMessage['headers'];
};

type VercelResponse = ServerResponse & {
  json: (body: unknown) => void;
  send: (body: string | Buffer) => void;
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
};

function getUpstreamBase(): string {
  const raw = process.env.ORCHESTRATION_API_URL;
  if (!raw || raw.trim().length === 0) {
    throw new Error('ORCHESTRATION_API_URL is not configured');
  }
  return raw.replace(/\/+$/, '');
}

function pickHeader(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

// Keep the BFF timeout below the browser-side timeout so the user still gets a
// structured 504 response with requestId instead of a generic client abort.
const UPSTREAM_TIMEOUT_MS = 55_000;

function createRequestId(): string {
  return `bff-${randomUUID()}`;
}

function buildUpstreamBody(body: unknown, requestId: string): string {
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body) as Record<string, unknown>;
      const meta = parsed.meta && typeof parsed.meta === 'object' ? parsed.meta as Record<string, unknown> : {};
      return JSON.stringify({
        ...parsed,
        meta: {
          ...meta,
          requestId,
        },
      });
    } catch {
      return body;
    }
  }

  const parsed = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const meta = parsed.meta && typeof parsed.meta === 'object' ? parsed.meta as Record<string, unknown> : {};
  return JSON.stringify({
    ...parsed,
    meta: {
      ...meta,
      requestId,
    },
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  let upstreamUrl: string;
  const requestId = createRequestId();
  try {
    upstreamUrl = `${getUpstreamBase()}/api/v1/repositories/generate`;
  } catch (error) {
    res.setHeader('X-Request-Id', requestId);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Misconfigured upstream',
      requestId,
      status: 500,
      kind: 'response',
    });
    return;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Request-Id': requestId,
  };
  const auth = pickHeader(req.headers.authorization);
  const cookie = pickHeader(req.headers.cookie);
  if (auth) headers.Authorization = auth;
  if (cookie) headers.Cookie = cookie;

  const bodyText = buildUpstreamBody(req.body, requestId);

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: 'POST',
      headers,
      body: bodyText,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    res.setHeader('X-Request-Id', requestId);
    res.status(isTimeout ? 504 : 502).json({
      error: isTimeout
        ? 'Upstream request timed out'
        : 'Upstream request failed',
      requestId,
      status: isTimeout ? 504 : 502,
      kind: isTimeout ? 'timeout' : 'network',
    });
    return;
  }

  const contentType = upstreamRes.headers.get('content-type') ?? '';
  if (!upstreamRes.ok || !contentType.includes('application/zip')) {
    const text = await upstreamRes.text();
    const upstreamRequestId = upstreamRes.headers.get('x-request-id') ?? requestId;
    res.status(upstreamRes.status).setHeader('Content-Type', contentType || 'application/json; charset=utf-8');
    res.setHeader('X-Request-Id', upstreamRequestId);
    res.send(text);
    return;
  }

  const bytes = Buffer.from(await upstreamRes.arrayBuffer());
  const contentDisposition = upstreamRes.headers.get('content-disposition');
  const upstreamRequestId = upstreamRes.headers.get('x-request-id') ?? requestId;
  const specVersion = upstreamRes.headers.get('x-spec-version');
  const fileCount = upstreamRes.headers.get('x-file-count');

  if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);
  res.setHeader('X-Request-Id', upstreamRequestId);
  if (specVersion) res.setHeader('X-Spec-Version', specVersion);
  if (fileCount) res.setHeader('X-File-Count', fileCount);
  res.setHeader('Content-Type', 'application/zip');
  res.status(200).send(bytes);
}
