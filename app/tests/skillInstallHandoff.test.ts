import test from 'node:test';
import assert from 'node:assert/strict';
import { formatAiToolNames, formatAiToolWrapperFiles } from '../src/constants/enums.ts';
import { buildSkillInstallHandoffText } from '../src/utils/skillInstallHandoff.ts';
import type { SkillCatalogItem } from '../src/data/skillCatalog.ts';

const REVIEW_SKILL: SkillCatalogItem = {
  id: 'repo-readiness-review',
  name: 'Repo Readiness Review',
  description: 'Review the generated repository for missing gaps.',
  whenToUse: 'When reviewing a newly generated repository.',
  owner: 'repogenesis',
  version: '0.1.0',
  sourceType: 'curated',
  sourceLabel: 'RepoGenesis整備',
  riskLevel: 'low',
  selectionStage: 'first',
  providers: ['codex', 'gemini_cli'],
  providerSupport: [
    { provider: 'codex', supportType: 'curated' },
    { provider: 'gemini_cli', supportType: 'curated' },
  ],
  tags: ['review'],
};

test('ai tool helpers return selected tool names and wrapper files in stable order', () => {
  assert.equal(formatAiToolNames(['gemini_cli', 'codex']), 'Codex / Gemini CLI');
  assert.equal(formatAiToolWrapperFiles(['gemini_cli', 'codex']), 'AGENTS.md / GEMINI.md');
});

test('buildSkillInstallHandoffText includes wrapper guidance before install commands', () => {
  const text = buildSkillInstallHandoffText('demo-project', ['codex', 'gemini_cli'], [REVIEW_SKILL]);

  assert.equal(text.includes('# Open the generated project with Codex / Gemini CLI'), true);
  assert.equal(text.includes('# Thin wrapper files: AGENTS.md / GEMINI.md'), true);
  assert.equal(text.includes('node dist/index.js skills add --project "/path/to/unzipped/demo-project"'), true);
});
