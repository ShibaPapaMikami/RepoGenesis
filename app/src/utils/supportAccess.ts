import { readRuntimeEnv } from './runtimeEnv.ts';

function readCsvSet(key: string): Set<string> {
  const raw = readRuntimeEnv(key);
  if (!raw) return new Set<string>();
  return new Set(
    raw
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter((value) => value.length > 0),
  );
}

export function canViewSupportPanel(sessionEmail: string | null): boolean {
  if (!sessionEmail) return false;

  const normalizedEmail = sessionEmail.trim().toLowerCase();
  if (!normalizedEmail.includes('@')) return false;

  const allowedEmails = readCsvSet('VITE_SUPPORT_ALLOWED_EMAILS');
  if (allowedEmails.has(normalizedEmail)) return true;

  const [, domain = ''] = normalizedEmail.split('@');
  const allowedDomains = readCsvSet('VITE_SUPPORT_ALLOWED_DOMAINS');
  return allowedDomains.has(domain);
}
