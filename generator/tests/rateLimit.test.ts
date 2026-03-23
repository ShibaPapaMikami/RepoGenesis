import { afterEach, describe, expect, it } from 'vitest';
import {
  consumeRateLimit,
  getRateLimitBucketCountForTests,
  rateLimitHeaders,
  resetRateLimitStateForTests,
} from '../src/orchestration/rateLimit';

describe('orchestration rate limit', () => {
  afterEach(() => {
    resetRateLimitStateForTests();
    delete process.env.GENERATE_RATE_LIMIT_MAX;
    delete process.env.GENERATE_RATE_LIMIT_WINDOW_MS;
    delete process.env.FEEDBACK_RATE_LIMIT_MAX;
    delete process.env.FEEDBACK_RATE_LIMIT_WINDOW_MS;
    delete process.env.SUPPORT_READ_RATE_LIMIT_MAX;
    delete process.env.SUPPORT_READ_RATE_LIMIT_WINDOW_MS;
  });

  it('limits repeated generate requests for the same bearer token', () => {
    process.env.GENERATE_RATE_LIMIT_MAX = '2';
    process.env.GENERATE_RATE_LIMIT_WINDOW_MS = '60000';

    const first = consumeRateLimit({
      route: 'generate',
      authorizationHeader: 'Bearer dev-token',
      cookieHeader: undefined,
      forwardedForHeader: undefined,
      remoteAddress: '127.0.0.1',
      now: 1_000,
    });
    const second = consumeRateLimit({
      route: 'generate',
      authorizationHeader: 'Bearer dev-token',
      cookieHeader: undefined,
      forwardedForHeader: undefined,
      remoteAddress: '127.0.0.1',
      now: 2_000,
    });
    const third = consumeRateLimit({
      route: 'generate',
      authorizationHeader: 'Bearer dev-token',
      cookieHeader: undefined,
      forwardedForHeader: undefined,
      remoteAddress: '127.0.0.1',
      now: 3_000,
    });

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

  it('uses forwarded ip when auth tokens are absent', () => {
    process.env.FEEDBACK_RATE_LIMIT_MAX = '1';

    const first = consumeRateLimit({
      route: 'feedback',
      authorizationHeader: undefined,
      cookieHeader: undefined,
      forwardedForHeader: '203.0.113.10, 10.0.0.1',
      remoteAddress: '10.0.0.2',
      now: 1_000,
    });
    const second = consumeRateLimit({
      route: 'feedback',
      authorizationHeader: undefined,
      cookieHeader: undefined,
      forwardedForHeader: '203.0.113.10, 10.0.0.1',
      remoteAddress: '10.0.0.3',
      now: 2_000,
    });

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(false);
    expect(first.identifier).toBe(second.identifier);
  });

  it('tracks session-cookie traffic separately from bearer traffic', () => {
    process.env.SUPPORT_READ_RATE_LIMIT_MAX = '1';

    const bearer = consumeRateLimit({
      route: 'support_read',
      authorizationHeader: 'Bearer dev-token',
      cookieHeader: undefined,
      forwardedForHeader: undefined,
      remoteAddress: '127.0.0.1',
      now: 1_000,
    });
    const cookie = consumeRateLimit({
      route: 'support_read',
      authorizationHeader: undefined,
      cookieHeader: '__session=session-token',
      forwardedForHeader: undefined,
      remoteAddress: '127.0.0.1',
      now: 1_500,
    });

    expect(bearer.allowed).toBe(true);
    expect(cookie.allowed).toBe(true);
    expect(bearer.identifier).not.toBe(cookie.identifier);
  });

  it('resets a bucket after the configured window elapses', () => {
    process.env.GENERATE_RATE_LIMIT_MAX = '1';
    process.env.GENERATE_RATE_LIMIT_WINDOW_MS = '1000';

    const first = consumeRateLimit({
      route: 'generate',
      authorizationHeader: 'Bearer dev-token',
      cookieHeader: undefined,
      forwardedForHeader: undefined,
      remoteAddress: '127.0.0.1',
      now: 1_000,
    });
    const blocked = consumeRateLimit({
      route: 'generate',
      authorizationHeader: 'Bearer dev-token',
      cookieHeader: undefined,
      forwardedForHeader: undefined,
      remoteAddress: '127.0.0.1',
      now: 1_100,
    });
    const reset = consumeRateLimit({
      route: 'generate',
      authorizationHeader: 'Bearer dev-token',
      cookieHeader: undefined,
      forwardedForHeader: undefined,
      remoteAddress: '127.0.0.1',
      now: 2_100,
    });

    expect(first.allowed).toBe(true);
    expect(blocked.allowed).toBe(false);
    expect(reset.allowed).toBe(true);
  });

  it('returns rate limit headers including retry-after when blocked', () => {
    const headers = rateLimitHeaders({
      route: 'generate',
      allowed: false,
      limit: 30,
      remaining: 0,
      resetAt: Date.UTC(2026, 2, 22, 3, 0, 0),
      retryAfterSeconds: 12,
      identifier: 'test',
    });

    expect(headers['X-RateLimit-Limit']).toBe('30');
    expect(headers['X-RateLimit-Remaining']).toBe('0');
    expect(headers['Retry-After']).toBe('12');
  });

  it('sweeps expired buckets before adding new traffic', () => {
    process.env.GENERATE_RATE_LIMIT_WINDOW_MS = '1000';

    consumeRateLimit({
      route: 'generate',
      authorizationHeader: 'Bearer stale-token',
      cookieHeader: undefined,
      forwardedForHeader: undefined,
      remoteAddress: '127.0.0.1',
      now: 1_000,
    });
    expect(getRateLimitBucketCountForTests()).toBe(1);

    consumeRateLimit({
      route: 'feedback',
      authorizationHeader: 'Bearer fresh-token',
      cookieHeader: undefined,
      forwardedForHeader: undefined,
      remoteAddress: '127.0.0.1',
      now: 62_000,
    });

    expect(getRateLimitBucketCountForTests()).toBe(1);
  });
});
