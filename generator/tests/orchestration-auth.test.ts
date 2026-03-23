import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import {
  authorizeBearerTokenAsync,
  authorizeRequestAsync,
  getAuthConfigurationError,
  hasGeneratePermission,
  hasSupportReadPermission,
} from '../src/orchestration/auth';
import { signSessionJwt } from '../src/vendor/gugenka-auth/server/session';

describe('orchestration auth adapter', () => {
  let originalProvider: string | undefined;
  let originalSecret: string | undefined;
  let originalAudience: string | undefined;
  let originalAllowed: string | undefined;
  let originalAllowedDomains: string | undefined;
  let originalSupportAllowed: string | undefined;
  let originalSupportAllowedDomains: string | undefined;
  let originalNodeEnv: string | undefined;
  let originalVercelEnv: string | undefined;
  let originalInsecureOverride: string | undefined;

  beforeEach(() => {
    originalProvider = process.env.AUTH_PROVIDER;
    originalSecret = process.env.NEXTAUTH_SECRET;
    originalAudience = process.env.SESSION_AUDIENCE;
    originalAllowed = process.env.AUTH_ALLOWED_EMAILS;
    originalAllowedDomains = process.env.AUTH_ALLOWED_DOMAINS;
    originalSupportAllowed = process.env.SUPPORT_ALLOWED_EMAILS;
    originalSupportAllowedDomains = process.env.SUPPORT_ALLOWED_DOMAINS;
    originalNodeEnv = process.env.NODE_ENV;
    originalVercelEnv = process.env.VERCEL_ENV;
    originalInsecureOverride = process.env.ALLOW_INSECURE_AUTH_IN_PRODUCTION;
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

    if (originalSupportAllowed === undefined) delete process.env.SUPPORT_ALLOWED_EMAILS;
    else process.env.SUPPORT_ALLOWED_EMAILS = originalSupportAllowed;

    if (originalSupportAllowedDomains === undefined) delete process.env.SUPPORT_ALLOWED_DOMAINS;
    else process.env.SUPPORT_ALLOWED_DOMAINS = originalSupportAllowedDomains;

    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;

    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;

    if (originalInsecureOverride === undefined) delete process.env.ALLOW_INSECURE_AUTH_IN_PRODUCTION;
    else process.env.ALLOW_INSECURE_AUTH_IN_PRODUCTION = originalInsecureOverride;
  });

  it('authorizes dev-token in mock mode', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    const result = await authorizeBearerTokenAsync('Bearer dev-token');
    expect(result.ok).toBe(true);
    if (result.ok && result.context) {
      expect(result.context.userId).toBe('dev-user');
      expect(hasGeneratePermission(result.context)).toBe(true);
      expect(hasSupportReadPermission(result.context)).toBe(true);
    }
  });

  it('returns forbidden permission in mock mode', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    const result = await authorizeBearerTokenAsync('Bearer forbidden-token');
    expect(result.ok).toBe(true);
    if (result.ok && result.context) {
      expect(hasGeneratePermission(result.context)).toBe(false);
      expect(hasSupportReadPermission(result.context)).toBe(false);
    }
  });

  it('authorizes support-token in mock mode for read-only support access', async () => {
    process.env.AUTH_PROVIDER = 'mock';
    const result = await authorizeBearerTokenAsync('Bearer support-token');
    expect(result.ok).toBe(true);
    if (result.ok && result.context) {
      expect(hasGeneratePermission(result.context)).toBe(false);
      expect(hasSupportReadPermission(result.context)).toBe(true);
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
      expect(hasSupportReadPermission(result.context)).toBe(true);
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
      expect(hasSupportReadPermission(result.context)).toBe(true);
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
      expect(hasSupportReadPermission(result.context)).toBe(false);
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
      expect(hasSupportReadPermission(result.context)).toBe(true);
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
      expect(hasSupportReadPermission(result.context)).toBe(false);
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
      expect(hasSupportReadPermission(result.context)).toBe(true);
    }
  });

  it('allows support-read role with dedicated support domain allowlist', async () => {
    process.env.AUTH_PROVIDER = 'gugenka';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.SESSION_AUDIENCE = 'repogenesis-test';
    process.env.AUTH_ALLOWED_DOMAINS = 'gugenka.jp';
    process.env.SUPPORT_ALLOWED_DOMAINS = 'support.example';

    const token = await signSessionJwt('agent@support.example', {
      audience: 'repogenesis-test',
    });
    const result = await authorizeRequestAsync(undefined, `__session=${token}`);
    expect(result.ok).toBe(true);
    if (result.ok && result.context) {
      expect(hasGeneratePermission(result.context)).toBe(false);
      expect(hasSupportReadPermission(result.context)).toBe(true);
    }
  });

  it('rejects mock auth in production without explicit override', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_PROVIDER = 'mock';

    expect(getAuthConfigurationError()).toBe('AUTH_PROVIDER=mock is not allowed in production');
    const result = await authorizeBearerTokenAsync('Bearer dev-token');
    expect(result.ok).toBe(false);
    expect(result.status).toBe(503);
    expect(result.error).toBe('AUTH_PROVIDER=mock is not allowed in production');
  });

  it('allows mock auth in production only with explicit override', async () => {
    process.env.NODE_ENV = 'production';
    process.env.AUTH_PROVIDER = 'mock';
    process.env.ALLOW_INSECURE_AUTH_IN_PRODUCTION = 'true';

    expect(getAuthConfigurationError()).toBeNull();
    const result = await authorizeBearerTokenAsync('Bearer dev-token');
    expect(result.ok).toBe(true);
  });
});
