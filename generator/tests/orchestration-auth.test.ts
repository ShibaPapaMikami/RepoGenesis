import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import { authorizeBearerTokenAsync, authorizeRequestAsync, hasGeneratePermission } from '../src/orchestration/auth';
import { signSessionJwt } from '../src/vendor/gugenka-auth/server/session';

describe('orchestration auth adapter', () => {
  let originalProvider: string | undefined;
  let originalSecret: string | undefined;
  let originalAudience: string | undefined;
  let originalAllowed: string | undefined;
  let originalAllowedDomains: string | undefined;

  beforeEach(() => {
    originalProvider = process.env.AUTH_PROVIDER;
    originalSecret = process.env.NEXTAUTH_SECRET;
    originalAudience = process.env.SESSION_AUDIENCE;
    originalAllowed = process.env.AUTH_ALLOWED_EMAILS;
    originalAllowedDomains = process.env.AUTH_ALLOWED_DOMAINS;
  });

  afterEach(() => {
    if (originalProvider === undefined) {
      delete process.env.AUTH_PROVIDER;
    } else {
      process.env.AUTH_PROVIDER = originalProvider;
    }

    if (originalSecret === undefined) delete process.env.NEXTAUTH_SECRET;
    else process.env.NEXTAUTH_SECRET = originalSecret;

    if (originalAudience === undefined) delete process.env.SESSION_AUDIENCE;
    else process.env.SESSION_AUDIENCE = originalAudience;

    if (originalAllowed === undefined) delete process.env.AUTH_ALLOWED_EMAILS;
    else process.env.AUTH_ALLOWED_EMAILS = originalAllowed;

    if (originalAllowedDomains === undefined) delete process.env.AUTH_ALLOWED_DOMAINS;
    else process.env.AUTH_ALLOWED_DOMAINS = originalAllowedDomains;
  });

  it('authorizes dev-token in mock mode', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    const result = await authorizeBearerTokenAsync('Bearer dev-token');
    expect(result.ok).toBe(true);
    if (result.ok && result.context) {
      expect(result.context.userId).toBe('dev-user');
      expect(hasGeneratePermission(result.context)).toBe(true);
    }
  });

  it('returns forbidden permission in mock mode', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    const result = await authorizeBearerTokenAsync('Bearer forbidden-token');
    expect(result.ok).toBe(true);
    if (result.ok && result.context) {
      expect(hasGeneratePermission(result.context)).toBe(false);
    }
  });

  it('returns 401 when gugenka provider is selected without required session env', async () => {
    process.env.AUTH_PROVIDER = 'gugenka';
    delete process.env.NEXTAUTH_SECRET;
    const result = await authorizeBearerTokenAsync('Bearer any-token');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(401);
  });

  it('authorizes signed session token in gugenka mode', async () => {
    process.env.AUTH_PROVIDER = 'gugenka';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.SESSION_AUDIENCE = 'repogenesis-test';

    const token = await signSessionJwt('dev@gugenka.jp', {
      audience: 'repogenesis-test',
    });
    const result = await authorizeBearerTokenAsync(`Bearer ${token}`);
    expect(result.ok).toBe(true);
    if (result.ok && result.context) {
      expect(result.context.userId).toBe('dev@gugenka.jp');
      expect(hasGeneratePermission(result.context)).toBe(true);
    }
  });

  it('authorizes cookie session token in gugenka mode', async () => {
    process.env.AUTH_PROVIDER = 'gugenka';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.SESSION_AUDIENCE = 'repogenesis-test';

    const token = await signSessionJwt('cookie@gugenka.jp', {
      audience: 'repogenesis-test',
    });
    const result = await authorizeRequestAsync(undefined, `__session=${token}`);
    expect(result.ok).toBe(true);
    if (result.ok && result.context) {
      expect(result.context.userId).toBe('cookie@gugenka.jp');
      expect(hasGeneratePermission(result.context)).toBe(true);
    }
  });

  it('denies non-allowlisted email in gugenka mode', async () => {
    process.env.AUTH_PROVIDER = 'gugenka';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.SESSION_AUDIENCE = 'repogenesis-test';
    process.env.AUTH_ALLOWED_EMAILS = 'allowed@gugenka.example';

    const token = await signSessionJwt('blocked@gugenka.example', {
      audience: 'repogenesis-test',
    });
    const result = await authorizeRequestAsync(undefined, `__session=${token}`);
    expect(result.ok).toBe(true);
    if (result.ok && result.context) {
      expect(hasGeneratePermission(result.context)).toBe(false);
    }
  });

  it('allows matching allowed domain in gugenka mode', async () => {
    process.env.AUTH_PROVIDER = 'gugenka';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.SESSION_AUDIENCE = 'repogenesis-test';
    process.env.AUTH_ALLOWED_DOMAINS = 'gugenka.jp';

    const token = await signSessionJwt('member@gugenka.jp', {
      audience: 'repogenesis-test',
    });
    const result = await authorizeRequestAsync(undefined, `__session=${token}`);
    expect(result.ok).toBe(true);
    if (result.ok && result.context) {
      expect(hasGeneratePermission(result.context)).toBe(true);
    }
  });

  it('denies non-matching domain when allowed domains are configured', async () => {
    process.env.AUTH_PROVIDER = 'gugenka';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.SESSION_AUDIENCE = 'repogenesis-test';
    process.env.AUTH_ALLOWED_DOMAINS = 'gugenka.jp';

    const token = await signSessionJwt('member@external.example', {
      audience: 'repogenesis-test',
    });
    const result = await authorizeRequestAsync(undefined, `__session=${token}`);
    expect(result.ok).toBe(true);
    if (result.ok && result.context) {
      expect(hasGeneratePermission(result.context)).toBe(false);
    }
  });

  it('allows explicit email even when domain does not match', async () => {
    process.env.AUTH_PROVIDER = 'gugenka';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.SESSION_AUDIENCE = 'repogenesis-test';
    process.env.AUTH_ALLOWED_DOMAINS = 'gugenka.jp';
    process.env.AUTH_ALLOWED_EMAILS = 'partner@external.example';

    const token = await signSessionJwt('partner@external.example', {
      audience: 'repogenesis-test',
    });
    const result = await authorizeRequestAsync(undefined, `__session=${token}`);
    expect(result.ok).toBe(true);
    if (result.ok && result.context) {
      expect(hasGeneratePermission(result.context)).toBe(true);
    }
  });
});
