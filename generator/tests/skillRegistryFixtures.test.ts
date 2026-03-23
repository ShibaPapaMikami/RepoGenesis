import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { skillRegistryItemSchema } from '../src/skillRegistrySchema';

const REGISTRY_ROOT = path.resolve(__dirname, '../../skills/registry');

describe('skill registry fixtures', () => {
  it('parses curated frontend-design metadata', () => {
    const file = path.join(REGISTRY_ROOT, 'curated/frontend-design/skill.json');
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = skillRegistryItemSchema.parse(JSON.parse(raw));

    expect(parsed.id).toBe('frontend-design');
    expect(parsed.sourceUrl).toBe('https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md');
    expect(parsed.providers).toEqual(['codex', 'claude_code', 'gemini_cli']);
  });

  it('parses curated repo-readiness-review metadata', () => {
    const file = path.join(REGISTRY_ROOT, 'curated/repo-readiness-review/skill.json');
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = skillRegistryItemSchema.parse(JSON.parse(raw));

    expect(parsed.id).toBe('repo-readiness-review');
    expect(parsed.providers).toEqual(['codex', 'claude_code', 'gemini_cli']);
    expect(parsed.providerSupport).toEqual([
      { provider: 'codex', supportType: 'curated' },
      { provider: 'claude_code', supportType: 'curated' },
      { provider: 'gemini_cli', supportType: 'curated' },
    ]);
  });

  it('parses official OpenAI skill metadata with mixed provider support', () => {
    const file = path.join(REGISTRY_ROOT, 'official/gh-fix-ci/skill.json');
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = skillRegistryItemSchema.parse(JSON.parse(raw));

    expect(parsed.id).toBe('gh-fix-ci');
    expect(parsed.sourceType).toBe('official');
    expect(parsed.providerSupport).toEqual([
      { provider: 'codex', supportType: 'official' },
      { provider: 'claude_code', supportType: 'curated' },
      { provider: 'gemini_cli', supportType: 'curated' },
    ]);
  });
});
