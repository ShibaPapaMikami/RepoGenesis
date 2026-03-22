import type { IncomingMessage, ServerResponse } from 'http';
import { requireLocalAdminMode } from '../../_lib/localAdmin.ts';

type VercelRequest = IncomingMessage & {
  method?: string;
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

function pickQueryValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

const UPSTREAM_TIMEOUT_MS = 20_000;

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const localAdminGate = requireLocalAdminMode(req.headers);
  if (!localAdminGate.ok) {
    res.status(localAdminGate.status).json({ error: localAdminGate.error });
    return;
  }

  let upstreamUrl: string;
  try {
    const params = new URLSearchParams();
    const type = pickQueryValue(req.query?.type);
    const limit = pickQueryValue(req.query?.limit);
    if (type) params.set('type', type);
    if (limit) params.set('limit', limit);
    const suffix = params.size > 0 ? `?${params.toString()}` : '';
    upstreamUrl = `${getUpstreamBase()}/api/v1/support/feedback${suffix}`;
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Misconfigured upstream' });
    return;
  }

  const headers: Record<string, string> = {};
  const auth = pickHeader(req.headers.authorization);
  const cookie = pickHeader(req.headers.cookie);
  if (auth) headers.Authorization = auth;
  if (cookie) headers.Cookie = cookie;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    res.status(isTimeout ? 504 : 502).json({
      error: isTimeout ? 'Upstream request timed out' : 'Upstream request failed',
    });
    return;
  }

  const text = await upstreamRes.text();
  const contentType = upstreamRes.headers.get('content-type') ?? 'application/json; charset=utf-8';
  res.status(upstreamRes.status).setHeader('Content-Type', contentType).send(text);
}
