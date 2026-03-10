import type { IncomingMessage, ServerResponse } from 'http';

type VercelRequest = IncomingMessage & {
  method?: string;
  body?: unknown;
  query?: Record<string, string | string[] | undefined>;
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

const UPSTREAM_TIMEOUT_MS = 20_000;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const rawType = req.query?.type;
  const type = Array.isArray(rawType) ? rawType[0] : rawType;
  if (type !== 'bug' && type !== 'request') {
    res.status(400).json({ error: 'Invalid feedback type' });
    return;
  }

  let upstreamUrl: string;
  try {
    upstreamUrl = `${getUpstreamBase()}/api/v1/feedback/${type}`;
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Misconfigured upstream' });
    return;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const auth = pickHeader(req.headers.authorization);
  const cookie = pickHeader(req.headers.cookie);
  if (auth) headers.Authorization = auth;
  if (cookie) headers.Cookie = cookie;

  const bodyText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? {});

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
    res.status(isTimeout ? 504 : 502).json({
      error: isTimeout
        ? 'Upstream request timed out'
        : 'Upstream request failed',
    });
    return;
  }

  const text = await upstreamRes.text();
  const contentType = upstreamRes.headers.get('content-type') ?? 'application/json; charset=utf-8';
  res.status(upstreamRes.status).setHeader('Content-Type', contentType).send(text);
}
