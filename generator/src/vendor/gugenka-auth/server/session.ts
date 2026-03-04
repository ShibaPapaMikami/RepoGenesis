/**
 * vendored from gugenka-auth server/session.ts
 * - trimmed to Node runtime
 * - implemented without external deps (crypto only)
 */

import { createHmac, randomUUID, timingSafeEqual } from 'crypto';

// ─── 定数 ───

const ISSUER = 'gugenka-auth';

const COOKIE_CANDIDATES = [
  '__session',
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
] as const;

// ─── 型 ───

export interface CookiesLike {
  get(name: string): { value: string } | undefined | null;
}

export interface SignOptions {
  audience: string;
  maxAgeSeconds?: number;
}

export interface VerifyOptions {
  audience: string;
}

// ─── 内部ユーティリティ ───

function getSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET environment variable is not set');
  }
  return secret;
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

// ─── 公開 API ───

/**
 * email を含むセッション JWT を発行する。
 *
 * payload: { email, iss:"gugenka-auth", aud, iat, exp(60m), jti }
 */
export async function signSessionJwt(
  email: string,
  options: SignOptions,
): Promise<string> {
  const age = options.maxAgeSeconds ?? 3600;
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    email: email.toLowerCase(),
    iat: now,
    exp: now + age,
    iss: ISSUER,
    aud: options.audience,
    jti: randomUUID(),
  };
  const encodedHeader = toBase64Url(JSON.stringify(header));
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const sig = signHs256(signingInput, getSecret());
  return `${signingInput}.${sig}`;
}

/**
 * cookies-like オブジェクトからセッション JWT を取得し、
 * HS256 / iss / aud / exp を検証して email を返す。
 *
 * 検証失敗・cookie 未発見時は null。
 */
export async function getSessionEmailFromCookies(
  cookiesLike: CookiesLike,
  options: VerifyOptions,
): Promise<string | null> {
  let token: string | null = null;

  for (const name of COOKIE_CANDIDATES) {
    const cookie = cookiesLike.get(name);
    if (cookie?.value) {
      token = cookie.value;
      break;
    }
  }

  if (!token) return null;

  try {
    const parts = token.split('.');
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
    type JwtPayload = {
      email?: unknown;
      iss?: unknown;
      aud?: unknown;
      exp?: unknown;
    };

    const header = parseJsonSafe<JwtHeader>(fromBase64Url(encodedHeader));
    if (!header || header.alg !== 'HS256') return null;

    const payload = parseJsonSafe<JwtPayload>(fromBase64Url(encodedPayload));
    if (!payload) return null;
    if (payload.iss !== ISSUER) return null;
    if (payload.aud !== options.audience) return null;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;

    return typeof payload.email === 'string' ? payload.email.toLowerCase() : null;
  } catch {
    return null;
  }
}

export { COOKIE_CANDIDATES };
