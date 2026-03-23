import { afterEach, describe, expect, it } from 'vitest';
import {
  isCorsOriginAllowed,
  isRequestBodyTooLarge,
  resolveCorsOrigin,
} from '../src/orchestration/server';

describe('orchestration server hardening', () => {
  afterEach(() => {
    delete process.env.CORS_ALLOW_ORIGIN;
    delete process.env.MAX_REQUEST_BODY_BYTES;
  });

  it('rejects disallowed origins', () => {
    process.env.CORS_ALLOW_ORIGIN = 'https://allowed.example';

    expect(isCorsOriginAllowed('https://allowed.example')).toBe(true);
    expect(resolveCorsOrigin('https://allowed.example')).toBe('https://allowed.example');
    expect(isCorsOriginAllowed('https://evil.example')).toBe(false);
    expect(resolveCorsOrigin('https://evil.example')).toBeNull();
  });

  it('flags oversized request bodies from content-length', () => {
    process.env.MAX_REQUEST_BODY_BYTES = '64';

    expect(isRequestBodyTooLarge('128')).toBe(true);
    expect(isRequestBodyTooLarge('64')).toBe(false);
    expect(isRequestBodyTooLarge(undefined)).toBe(false);
  });
});
