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
  try {
    upstreamUrl = `${getUpstreamBase()}/api/v1/repositories/generate`;
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
    });
  } catch {
    res.status(502).json({ error: 'Upstream request failed' });
    return;
  }

  const contentType = upstreamRes.headers.get('content-type') ?? '';
  if (!upstreamRes.ok || !contentType.includes('application/zip')) {
    const text = await upstreamRes.text();
    res.status(upstreamRes.status).setHeader('Content-Type', contentType || 'application/json; charset=utf-8');
    res.send(text);
    return;
  }

  const bytes = Buffer.from(await upstreamRes.arrayBuffer());
  const contentDisposition = upstreamRes.headers.get('content-disposition');
  const requestId = upstreamRes.headers.get('x-request-id');
  const specVersion = upstreamRes.headers.get('x-spec-version');
  const fileCount = upstreamRes.headers.get('x-file-count');

  if (contentDisposition) res.setHeader('Content-Disposition', contentDisposition);
  if (requestId) res.setHeader('X-Request-Id', requestId);
  if (specVersion) res.setHeader('X-Spec-Version', specVersion);
  if (fileCount) res.setHeader('X-File-Count', fileCount);
  res.setHeader('Content-Type', 'application/zip');
  res.status(200).send(bytes);
}
