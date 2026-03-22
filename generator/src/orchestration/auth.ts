import { getSessionEmailFromCookies } from '../vendor/gugenka-auth/server/session';

export interface AuthContext {
  userId: string;
  roles: string[];
}

export interface AuthResult {
  ok: boolean;
  status: 200 | 401 | 403;
  context?: AuthContext;
  error?: string;
}

const GENERATE_ROLE = 'repogenesis:generate';
const SUPPORT_READ_ROLE = 'repogenesis:support_read';
const DEFAULT_ALLOWED_DOMAIN = 'gugenka.jp';

function getAuthProvider(): string {
  return process.env.AUTH_PROVIDER ?? 'mock';
}

function getSessionAudience(): string {
  return process.env.SESSION_AUDIENCE ?? 'repogenesis';
}

function parseConfiguredSet(rawValue: string | undefined): Set<string> | null {
  const raw = rawValue;
  if (!raw) return null;
  const parsed = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
  return parsed.length > 0 ? new Set(parsed) : null;
}

function getAllowedEmails(): Set<string> | null {
  return parseConfiguredSet(process.env.AUTH_ALLOWED_EMAILS);
}

function getAllowedDomains(): Set<string> | null {
  return parseConfiguredSet(process.env.AUTH_ALLOWED_DOMAINS);
}

function getSupportAllowedEmails(): Set<string> | null {
  return parseConfiguredSet(process.env.SUPPORT_ALLOWED_EMAILS);
}

function getSupportAllowedDomains(): Set<string> | null {
  return parseConfiguredSet(process.env.SUPPORT_ALLOWED_DOMAINS);
}

function hasAllowedAccess(
  email: string,
  allowedEmails: Set<string> | null,
  allowedDomains: Set<string> | null,
): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return false;
  if (allowedEmails && allowedEmails.has(normalized)) {
    return true;
  }

  if (allowedDomains) {
    const domain = normalized.split('@')[1] ?? '';
    return allowedDomains.has(domain);
  }

  if (allowedEmails) {
    return false;
  }

  const domain = normalized.split('@')[1] ?? '';
  return domain === DEFAULT_ALLOWED_DOMAIN;
}

function hasAllowedGenerateAccess(email: string): boolean {
  return hasAllowedAccess(email, getAllowedEmails(), getAllowedDomains());
}

function hasAllowedSupportReadAccess(email: string): boolean {
  const supportEmails = getSupportAllowedEmails();
  const supportDomains = getSupportAllowedDomains();
  if (!supportEmails && !supportDomains) {
    return hasAllowedGenerateAccess(email);
  }
  return hasAllowedAccess(email, supportEmails, supportDomains);
}

function parseCookieHeader(cookieHeader: string | undefined): Map<string, string> {
  const map = new Map<string, string>();
  if (!cookieHeader) return map;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx <= 0) continue;
    const name = pair.slice(0, idx).trim();
    const value = pair.slice(idx + 1).trim();
    if (!name || !value) continue;
    map.set(name, value);
  }
  return map;
}

/**
 * OAuth 境界:
 * - mock provider: dev-token / forbidden-token
 * - gugenka provider: vendored gugenka-auth session verifier
 */
export function authorizeBearerToken(authorizationHeader: string | undefined): AuthResult {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing or invalid Authorization header' };
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();
  if (token.length === 0) {
    return { ok: false, status: 401, error: 'Missing bearer token' };
  }

  if (getAuthProvider() === 'gugenka') {
    return { ok: false, status: 401, error: 'Use authorizeBearerTokenAsync() for gugenka provider' };
  }

  // Mock provider (default)
  if (token === 'dev-token') {
    return {
      ok: true,
      status: 200,
      context: {
        userId: 'dev-user',
        roles: [GENERATE_ROLE, SUPPORT_READ_ROLE],
      },
    };
  }

  if (token === 'support-token') {
    return {
      ok: true,
      status: 200,
      context: {
        userId: 'support-user',
        roles: [SUPPORT_READ_ROLE],
      },
    };
  }

  if (token === 'forbidden-token') {
    return {
      ok: true,
      status: 200,
      context: {
        userId: 'forbidden-user',
        roles: [],
      },
    };
  }

  return { ok: false, status: 401, error: 'Invalid token' };
}

export function hasGeneratePermission(context: AuthContext): boolean {
  return context.roles.includes(GENERATE_ROLE);
}

export function hasSupportReadPermission(context: AuthContext): boolean {
  return context.roles.includes(SUPPORT_READ_ROLE) || context.roles.includes(GENERATE_ROLE);
}

export async function authorizeBearerTokenAsync(
  authorizationHeader: string | undefined,
): Promise<AuthResult> {
  if (getAuthProvider() !== 'gugenka') {
    return authorizeBearerToken(authorizationHeader);
  }

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing or invalid Authorization header' };
  }
  const token = authorizationHeader.slice('Bearer '.length).trim();
  if (token.length === 0) {
    return { ok: false, status: 401, error: 'Missing bearer token' };
  }

  try {
    const email = await getSessionEmailFromCookies(
      {
        get(name: string) {
          if (name === '__session') return { value: token };
          return undefined;
        },
      },
      { audience: getSessionAudience() },
    );
    if (!email) return { ok: false, status: 401, error: 'Token verification failed' };

    const roles = [
      ...(hasAllowedGenerateAccess(email) ? [GENERATE_ROLE] : []),
      ...(hasAllowedSupportReadAccess(email) ? [SUPPORT_READ_ROLE] : []),
    ];
    const context: AuthContext = { userId: email.toLowerCase(), roles };
    return { ok: true, status: 200, context };
  } catch {
    return { ok: false, status: 401, error: 'Token verification failed' };
  }
}

export async function authorizeRequestAsync(
  authorizationHeader: string | undefined,
  cookieHeader: string | undefined,
): Promise<AuthResult> {
  if (getAuthProvider() !== 'gugenka') {
    return authorizeBearerToken(authorizationHeader);
  }

  const bearer = authorizationHeader?.startsWith('Bearer ')
    ? authorizationHeader.slice('Bearer '.length).trim()
    : '';

  const cookies = parseCookieHeader(cookieHeader);
  const tokenFromCookie = cookies.get('__session')
    ?? cookies.get('next-auth.session-token')
    ?? cookies.get('__Secure-next-auth.session-token')
    ?? '';
  const token = bearer || tokenFromCookie;

  if (!token) {
    return { ok: false, status: 401, error: 'Missing bearer token or session cookie' };
  }

  try {
    const email = await getSessionEmailFromCookies(
      {
        get(name: string) {
          if (name === '__session') return { value: token };
          return undefined;
        },
      },
      { audience: getSessionAudience() },
    );
    if (!email) return { ok: false, status: 401, error: 'Token verification failed' };

    const roles = [
      ...(hasAllowedGenerateAccess(email) ? [GENERATE_ROLE] : []),
      ...(hasAllowedSupportReadAccess(email) ? [SUPPORT_READ_ROLE] : []),
    ];
    return {
      ok: true,
      status: 200,
      context: { userId: email.toLowerCase(), roles },
    };
  } catch {
    return { ok: false, status: 401, error: 'Token verification failed' };
  }
}
