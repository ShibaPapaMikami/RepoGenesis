import type { IncomingHttpHeaders } from 'http';

function pickHeader(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

function normalizeHostCandidate(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return new URL(trimmed).hostname.toLowerCase();
    } catch {
      return undefined;
    }
  }

  return trimmed
    .replace(/^\[/, '')
    .replace(/\]$/, '')
    .split(':')[0]
    ?.toLowerCase();
}

function isLoopbackHost(host: string | undefined): boolean {
  if (!host) return false;
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

export function isLocalAdminModeEnabled(): boolean {
  const raw = process.env.LOCAL_ADMIN_MODE?.trim().toLowerCase();
  return raw === 'enabled' || raw === 'true' || raw === '1';
}

export function isLoopbackRequest(headers: IncomingHttpHeaders): boolean {
  const candidates = [
    pickHeader(headers['x-forwarded-host']),
    pickHeader(headers.host),
    pickHeader(headers.origin),
    pickHeader(headers.referer),
  ]
    .map((value) => (value ? normalizeHostCandidate(value) : undefined))
    .filter((value): value is string => Boolean(value));

  return candidates.some((value) => isLoopbackHost(value));
}

export function requireLocalAdminMode(headers: IncomingHttpHeaders): { ok: true } | {
  ok: false;
  status: number;
  error: string;
} {
  if (!isLoopbackRequest(headers)) {
    return { ok: true };
  }

  if (isLocalAdminModeEnabled()) {
    return { ok: true };
  }

  return {
    ok: false,
    status: 403,
    error: 'LOCAL_ADMIN_MODE=enabled is required for local auth/support debug paths',
  };
}
