import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { listSelectableSkillRegistryItems, loadSkillRegistry } from '../src/skillRegistryLoader';

const REGISTRY_ROOT = path.resolve(__dirname, '../../skills/registry');

describe('skill registry loader', () => {
  it('loads multiple registry entries from the filesystem in id order', () => {
    const items = loadSkillRegistry(REGISTRY_ROOT);
    expect(items.map((item) => item.id)).toEqual([
      'frontend-design',
      'gh-fix-ci',
      'playwright',
      'render-deploy',
      'repo-readiness-review',
      'vercel-deploy',
    ]);
  });

  it('lists stable entries by default', () => {
    const items = listSelectableSkillRegistryItems(REGISTRY_ROOT);
    expect(new Set(items.map((item) => item.status))).toEqual(new Set(['stable']));
  });
});
