import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { skillRegistryItemSchema } from '../src/skillRegistrySchema';

const REGISTRY_ROOT = path.resolve(__dirname, '../../skills/registry');

describe('skill registry fixtures', () => {
  it('parses curated repo-readiness-review metadata', () => {
    const file = path.join(REGISTRY_ROOT, 'curated/repo-readiness-review/skill.json');
    const raw = fs.readFileSync(file, 'utf-8');
    const parsed = skillRegistryItemSchema.parse(JSON.parse(raw));

    expect(parsed.id).toBe('repo-readiness-review');
    expect(parsed.providers).toEqual(['codex', 'claude_code', 'gemini_cli']);
  });
});
