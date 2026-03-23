import type { IncomingMessage, ServerResponse } from 'http';
import { requireLocalAdminMode } from '../_lib/localAdmin.js';
import { getSessionEmailFromCookies } from '../_lib/session.js';

type Req = IncomingMessage & {
  method?: string;
  headers: IncomingMessage['headers'];
};

type Res = ServerResponse & {
  json: (body: unknown) => void;
  status: (code: number) => Res;
};

function parseCookieHeader(cookieHeader: string | undefined): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!cookieHeader) return cookies;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const name = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (name && value) cookies.set(name, value);
  }
  return cookies;
}

export default async function handler(req: Req, res: Res): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const localAdminGate = requireLocalAdminMode(req.headers);
  if (!localAdminGate.ok) {
    res.status(localAdminGate.status).json({ error: localAdminGate.error });
    return;
  }

  try {
    const parsed = parseCookieHeader(typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined);
    const email = await getSessionEmailFromCookies({
      get(name: string) {
        const value = parsed.get(name);
        return value ? { value } : undefined;
      },
    });

    res.status(200).json({
      ok: true,
      authenticated: Boolean(email),
      email: email ?? null,
    });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to inspect session' });
  }
}
