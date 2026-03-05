import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

const ISSUER = 'gugenka-auth';
const COOKIE_NAME = '__session';
const DEFAULT_AUDIENCE = 'repogenesis';
const DEFAULT_ALLOWED_DOMAIN = 'gugenka.co.jp';

type CookiesLike = {
  get(name: string): { value: string } | undefined | null;
};

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured on Vercel');
  }
  return secret;
}

function getAudience(): string {
  return process.env.SESSION_AUDIENCE ?? DEFAULT_AUDIENCE;
}

function toBase64Url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input, 'utf-8');
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(input: string): Buffer {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${pad}`, 'base64');
}

function signHs256(data: string, secret: string): string {
  return toBase64Url(createHmac('sha256', secret).update(data).digest());
}

function parseJsonSafe<T>(input: Buffer): T | null {
  try {
    return JSON.parse(input.toString('utf-8')) as T;
  } catch {
    return null;
  }
}

function getAllowedEmails(): Set<string> | null {
  const raw = process.env.AUTH_ALLOWED_EMAILS;
  if (!raw) return null;
  const values = raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return values.length > 0 ? new Set(values) : null;
}

function getAllowedDomains(): string[] {
  const raw = process.env.AUTH_ALLOWED_DOMAINS;
  if (!raw) return [DEFAULT_ALLOWED_DOMAIN];
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return false;

  const allowlist = getAllowedEmails();
  if (allowlist && allowlist.has(normalized)) return true;

  const domain = normalized.split('@')[1] ?? '';
  return getAllowedDomains().includes(domain);
}

export async function signSessionJwt(email: string, maxAgeSeconds = 3600): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    email: email.toLowerCase(),
    iat: now,
    exp: now + maxAgeSeconds,
    iss: ISSUER,
    aud: getAudience(),
    jti: randomUUID(),
  };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = signHs256(signingInput, getSecret());
  return `${signingInput}.${signature}`;
}

export async function getSessionEmailFromCookies(cookiesLike: CookiesLike): Promise<string | null> {
  const cookie = cookiesLike.get(COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const parts = cookie.value.split('.');
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const expectedSig = signHs256(signingInput, getSecret());
    const expected = Buffer.from(expectedSig, 'utf-8');
    const provided = Buffer.from(encodedSignature, 'utf-8');
    if (expected.length !== provided.length) return null;
    if (!timingSafeEqual(expected, provided)) return null;

    type JwtHeader = { alg?: string };
    type JwtPayload = { email?: unknown; iss?: unknown; aud?: unknown; exp?: unknown };

    const header = parseJsonSafe<JwtHeader>(fromBase64Url(encodedHeader));
    const payload = parseJsonSafe<JwtPayload>(fromBase64Url(encodedPayload));
    if (!header || !payload) return null;
    if (header.alg !== 'HS256') return null;
    if (payload.iss !== ISSUER) return null;
    if (payload.aud !== getAudience()) return null;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;

    return typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
  } catch {
    return null;
  }
}

export function buildSessionCookie(token: string, maxAgeSeconds = 3600): string {
  return [
    `${COOKIE_NAME}=${token}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ].join('; ');
}

export function buildExpiredSessionCookie(): string {
  return [
    `${COOKIE_NAME}=`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Lax',
    'Max-Age=0',
  ].join('; ');
}
