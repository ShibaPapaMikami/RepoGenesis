import test from 'node:test';
import assert from 'node:assert/strict';
import { canRecoverCookieSession } from '../src/utils/authRecovery.ts';

test('can recover cookie_session when 401 and email exists', () => {
  assert.equal(canRecoverCookieSession(401, 'user@example.com'), true);
});

test('does not recover cookie_session without email', () => {
  assert.equal(canRecoverCookieSession(401, ''), false);
  assert.equal(canRecoverCookieSession(401, null), false);
});

test('does not recover non-401 errors', () => {
  assert.equal(canRecoverCookieSession(504, 'user@example.com'), false);
});
