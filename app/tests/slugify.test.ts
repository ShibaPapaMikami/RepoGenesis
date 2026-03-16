import test from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../src/utils/slugify.ts';

test('slugify should keep ascii names stable', () => {
  assert.equal(slugify('RepoGenesis Test Project'), 'repogenesis-test-project');
});

test('slugify should infer useful tokens from japanese project names', () => {
  assert.equal(slugify('AI議事録整理ツール'), 'ai-minutes-tool');
  assert.equal(slugify('契約書レビュー依頼管理システム'), 'contract-review-request-management-system');
});
