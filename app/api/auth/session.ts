import type { IncomingMessage, ServerResponse } from 'http';
import { buildSessionCookie, isAllowedEmail, signSessionJwt } from '../_lib/session';

type Req = IncomingMessage & {
  method?: string;
  body?: string | { email?: string };
};

function readEmail(body: Req['body']): string {
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body) as { email?: string };
      return typeof parsed.email === 'string' ? parsed.email.trim().toLowerCase() : '';
    } catch {
      return '';
    }
  }
  return typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
}

export default async function handler(req: Req, res: ServerResponse & { json: (body: unknown) => void; status: (code: number) => typeof res; setHeader: (name: string, value: string) => void; }): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const email = readEmail(req.body);
  if (!email) {
    res.status(400).json({ error: 'email is required' });
    return;
  }
  if (!isAllowedEmail(email)) {
    res.status(403).json({ error: 'email is not allowed' });
    return;
  }

  try {
    const token = await signSessionJwt(email);
    res.setHeader('Set-Cookie', buildSessionCookie(token));
    res.status(200).json({ ok: true, email });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'session setup failed' });
  }
}
