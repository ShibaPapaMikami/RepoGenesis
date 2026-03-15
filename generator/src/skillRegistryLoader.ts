import * as fs from 'fs';
import * as path from 'path';
import type { SkillRegistryItem } from './skillRegistry';
import { skillRegistryItemSchema } from './skillRegistrySchema';

function walkForSkillJson(rootDir: string, entries: string[] = []): string[] {
  const children = fs.readdirSync(rootDir, { withFileTypes: true });
  for (const child of children) {
    const fullPath = path.join(rootDir, child.name);
    if (child.isDirectory()) {
      walkForSkillJson(fullPath, entries);
      continue;
    }
    if (child.isFile() && child.name === 'skill.json') {
      entries.push(fullPath);
    }
  }
  return entries;
}

export function loadSkillRegistry(registryRoot: string): SkillRegistryItem[] {
  if (!fs.existsSync(registryRoot)) {
    return [];
  }

  const skillJsonFiles = walkForSkillJson(registryRoot).sort();
  const items = skillJsonFiles.map((filePath) => {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return skillRegistryItemSchema.parse(JSON.parse(raw));
  });

  return items.sort((left, right) => left.id.localeCompare(right.id));
}

export function listSelectableSkillRegistryItems(
  registryRoot: string,
  options?: { includeExperimental?: boolean },
): SkillRegistryItem[] {
  const includeExperimental = options?.includeExperimental ?? false;
  return loadSkillRegistry(registryRoot).filter((item) => {
    if (item.status === 'stable') {
      return true;
    }
    if (item.status === 'experimental') {
      return includeExperimental;
    }
    return false;
  });
}
