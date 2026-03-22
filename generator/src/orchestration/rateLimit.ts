import { createHash } from 'crypto';

export type RateLimitRoute = 'generate' | 'feedback' | 'support_read';

interface RateLimitRouteConfig {
  max: number;
  windowMs: number;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

export interface RateLimitDecision {
  route: RateLimitRoute;
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
  identifier: string;
}

const DEFAULT_ROUTE_CONFIG: Record<RateLimitRoute, RateLimitRouteConfig> = {
  generate: { max: 30, windowMs: 60_000 },
  feedback: { max: 20, windowMs: 60_000 },
  support_read: { max: 60, windowMs: 60_000 },
};

const RATE_LIMIT_BUCKETS = new Map<string, RateLimitBucket>();

function getEnvNumber(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.max(0, Math.trunc(parsed));
}

function getRouteConfig(route: RateLimitRoute): RateLimitRouteConfig {
  switch (route) {
    case 'generate':
      return {
        max: getEnvNumber('GENERATE_RATE_LIMIT_MAX', DEFAULT_ROUTE_CONFIG.generate.max),
        windowMs: getEnvNumber('GENERATE_RATE_LIMIT_WINDOW_MS', DEFAULT_ROUTE_CONFIG.generate.windowMs),
      };
    case 'feedback':
      return {
        max: getEnvNumber('FEEDBACK_RATE_LIMIT_MAX', DEFAULT_ROUTE_CONFIG.feedback.max),
        windowMs: getEnvNumber('FEEDBACK_RATE_LIMIT_WINDOW_MS', DEFAULT_ROUTE_CONFIG.feedback.windowMs),
      };
    case 'support_read':
      return {
        max: getEnvNumber('SUPPORT_READ_RATE_LIMIT_MAX', DEFAULT_ROUTE_CONFIG.support_read.max),
        windowMs: getEnvNumber('SUPPORT_READ_RATE_LIMIT_WINDOW_MS', DEFAULT_ROUTE_CONFIG.support_read.windowMs),
      };
  }
}

function getSessionToken(cookieHeader: string | undefined): string | null {
  if (!cookieHeader) {
    return null;
  }
  for (const pair of cookieHeader.split(';')) {
    const [name, value] = pair.split('=', 2).map((part) => part?.trim());
    if (!name || !value) {
      continue;
    }
    if (name === '__session' || name === 'next-auth.session-token' || name === '__Secure-next-auth.session-token') {
      return value;
    }
  }
  return null;
}

function getClientAddress(forwardedForHeader: string | undefined, remoteAddress: string | undefined): string {
  if (forwardedForHeader) {
    const forwarded = forwardedForHeader.split(',').map((part) => part.trim()).find((part) => part.length > 0);
    if (forwarded) {
      return forwarded;
    }
  }
  if (remoteAddress && remoteAddress.length > 0) {
    return remoteAddress;
  }
  return 'unknown';
}

function hashIdentifier(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function resolveIdentifier(input: {
  authorizationHeader: string | undefined;
  cookieHeader: string | undefined;
  forwardedForHeader: string | undefined;
  remoteAddress: string | undefined;
}): string {
  const bearer = input.authorizationHeader?.startsWith('Bearer ')
    ? input.authorizationHeader.slice('Bearer '.length).trim()
    : '';
  if (bearer.length > 0) {
    return `bearer:${hashIdentifier(bearer)}`;
  }

  const sessionToken = getSessionToken(input.cookieHeader);
  if (sessionToken) {
    return `cookie_session:${hashIdentifier(sessionToken)}`;
  }

  return `ip:${hashIdentifier(getClientAddress(input.forwardedForHeader, input.remoteAddress))}`;
}

export function consumeRateLimit(input: {
  route: RateLimitRoute;
  authorizationHeader: string | undefined;
  cookieHeader: string | undefined;
  forwardedForHeader: string | undefined;
  remoteAddress: string | undefined;
  now?: number;
}): RateLimitDecision {
  const config = getRouteConfig(input.route);
  const now = input.now ?? Date.now();
  const identifier = resolveIdentifier(input);

  if (config.max <= 0 || config.windowMs <= 0) {
    return {
      route: input.route,
      allowed: true,
      limit: config.max,
      remaining: config.max,
      resetAt: now,
      retryAfterSeconds: 0,
      identifier,
    };
  }

  const bucketKey = `${input.route}:${identifier}`;
  const current = RATE_LIMIT_BUCKETS.get(bucketKey);
  const bucket = !current || current.resetAt <= now
    ? { count: 0, resetAt: now + config.windowMs }
    : current;

  if (bucket.count >= config.max) {
    RATE_LIMIT_BUCKETS.set(bucketKey, bucket);
    return {
      route: input.route,
      allowed: false,
      limit: config.max,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
      identifier,
    };
  }

  bucket.count += 1;
  RATE_LIMIT_BUCKETS.set(bucketKey, bucket);
  return {
    route: input.route,
    allowed: true,
    limit: config.max,
    remaining: Math.max(0, config.max - bucket.count),
    resetAt: bucket.resetAt,
    retryAfterSeconds: 0,
    identifier,
  };
}

export function rateLimitHeaders(decision: RateLimitDecision): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(decision.limit),
    'X-RateLimit-Remaining': String(decision.remaining),
    'X-RateLimit-Reset': new Date(decision.resetAt).toISOString(),
  };
  if (!decision.allowed) {
    headers['Retry-After'] = String(decision.retryAfterSeconds);
  }
  return headers;
}

export function resetRateLimitStateForTests(): void {
  RATE_LIMIT_BUCKETS.clear();
}
