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

const REQUIRED_ROLE = 'repogenesis:generate';

function getAuthProvider(): string {
  return process.env.AUTH_PROVIDER ?? 'mock';
}

function getSessionAudience(): string {
  return process.env.SESSION_AUDIENCE ?? 'repogenesis';
}

function getAllowedEmails(): Set<string> | null {
  const raw = process.env.AUTH_ALLOWED_EMAILS;
  if (!raw) return null;
  const parsed = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0);
  return parsed.length > 0 ? new Set(parsed) : null;
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
        roles: [REQUIRED_ROLE],
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
  return context.roles.includes(REQUIRED_ROLE);
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

    const allowlist = getAllowedEmails();
    const roles = !allowlist || allowlist.has(email.toLowerCase()) ? [REQUIRED_ROLE] : [];
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

    const allowlist = getAllowedEmails();
    const roles = !allowlist || allowlist.has(email.toLowerCase()) ? [REQUIRED_ROLE] : [];
    return {
      ok: true,
      status: 200,
      context: { userId: email.toLowerCase(), roles },
    };
  } catch {
    return { ok: false, status: 401, error: 'Token verification failed' };
  }
}
