import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatSkillProviderNames,
  formatSkillProviderSupportSummary,
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

test('skill catalog should format provider names and support summary in Japanese', () => {
  const ciSkill = SKILL_CATALOG.find((skill) => skill.id === 'gh-fix-ci');
  assert.ok(ciSkill);
  assert.equal(formatSkillProviderNames(ciSkill), 'Codex / Claude Code / Gemini CLI');
  assert.equal(
    formatSkillProviderSupportSummary(ciSkill),
    'Codexは公式、Claude CodeはRepoGenesis整備、Gemini CLIはRepoGenesis整備',
  );
});
