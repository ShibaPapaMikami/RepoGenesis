import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatProviderSupportLabel,
  getRecommendedSkills,
  SKILL_CATALOG,
} from '../src/data/skillCatalog.ts';

test('skill catalog should return multiple recommended skills', () => {
  const skills = getRecommendedSkills(['codex', 'claude_code']);

  assert.deepEqual(skills.map((skill) => skill.id), [
    'repo-readiness-review',
    'gh-fix-ci',
    'playwright',
    'vercel-deploy',
    'render-deploy',
  ]);
});

test('skill catalog should format provider support labels in Japanese', () => {
  const ciSkill = SKILL_CATALOG.find((skill) => skill.id === 'gh-fix-ci');
  assert.ok(ciSkill);
  assert.deepEqual(ciSkill.providerSupport.map((entry) => formatProviderSupportLabel(entry)), [
    'Codex: 公式',
    'Claude Code: RepoGenesis対応',
    'Gemini CLI: RepoGenesis対応',
  ]);
});
