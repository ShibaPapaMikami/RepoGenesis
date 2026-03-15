import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { listSelectableSkillRegistryItems, loadSkillRegistry } from '../src/skillRegistryLoader';

const REGISTRY_ROOT = path.resolve(__dirname, '../../skills/registry');

describe('skill registry loader', () => {
  it('loads curated registry entries from the filesystem', () => {
    const items = loadSkillRegistry(REGISTRY_ROOT);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.id).toBe('repo-readiness-review');
  });

  it('lists stable entries by default', () => {
    const items = listSelectableSkillRegistryItems(REGISTRY_ROOT);
    expect(items.map((item) => item.status)).toEqual(['stable']);
  });
});
