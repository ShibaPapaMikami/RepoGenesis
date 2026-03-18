import test from 'node:test';
import assert from 'node:assert/strict';
import { canRecoverCookieSession } from '../src/utils/authRecovery.ts';

test('can recover cookie_session when 401 and email exists', () => {
  assert.equal(canRecoverCookieSession(401, 'cookie_session', 'user@example.com'), true);
});

test('does not recover cookie_session without email', () => {
  assert.equal(canRecoverCookieSession(401, 'cookie_session', ''), false);
  assert.equal(canRecoverCookieSession(401, 'cookie_session', null), false);
});

test('does not recover non-cookie or non-401 errors', () => {
  assert.equal(canRecoverCookieSession(504, 'cookie_session', 'user@example.com'), false);
  assert.equal(canRecoverCookieSession(401, 'manual_bearer', 'user@example.com'), false);
});
