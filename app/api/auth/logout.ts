import type { IncomingMessage, ServerResponse } from 'http';
import { requireLocalAdminMode } from '../_lib/localAdmin.ts';
import { buildExpiredSessionCookie } from '../_lib/session.ts';

type Res = ServerResponse & {
  json: (body: unknown) => void;
  status: (code: number) => Res;
  setHeader: (name: string, value: string) => void;
};

export default async function handler(req: IncomingMessage & { method?: string }, res: Res): Promise<void> {
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const localAdminGate = requireLocalAdminMode(req.headers);
  if (!localAdminGate.ok) {
    res.status(localAdminGate.status).json({ error: localAdminGate.error });
    return;
  }

  res.setHeader('Set-Cookie', buildExpiredSessionCookie());
  res.status(200).json({ ok: true });
}
