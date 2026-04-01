import assert from 'node:assert/strict';
import test from 'node:test';
import {
  formatSkillProviderNames,
  formatSkillProviderSupportSummary,
  getAutoSelectedSkillIds,
  getRecommendedSkills,
  SKILL_CATALOG,
} from '../src/data/skillCatalog.ts';

test('skill catalog should return multiple recommended skills', () => {
  const skills = getRecommendedSkills(['codex', 'claude_code']);

  assert.deepEqual(skills.map((skill) => skill.id), [
    'repo-readiness-review',
    'frontend-design',
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

test('skill catalog should narrow recommendations when project signals are present', () => {
  const skills = getRecommendedSkills({
    aiTools: ['codex'],
    domains: ['web', 'ai'],
    frameworks: ['Next.js', 'FastAPI'],
    repoType: 'multi',
    planningHints: ['browser UI', 'Vercel', 'Render API'],
  });

  assert.deepEqual(skills.map((skill) => skill.id), [
    'repo-readiness-review',
    'frontend-design',
    'gh-fix-ci',
    'playwright',
    'vercel-deploy',
    'render-deploy',
  ]);
});

test('skill catalog should auto-select only first-stage skills', () => {
  const selected = getAutoSelectedSkillIds({
    aiTools: ['codex'],
    domains: ['web'],
    frameworks: ['Next.js'],
    repoType: 'single',
    planningHints: ['frontend UI'],
  });

  assert.deepEqual(selected, ['repo-readiness-review']);
});
