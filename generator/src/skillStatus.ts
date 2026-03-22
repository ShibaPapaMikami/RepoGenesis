import * as fs from 'fs';
import { loadProjectSkillsManifest } from './skillInstaller';
import { loadSkillRegistry } from './skillRegistryLoader';
import type { SkillProvider } from './skillsManifest';
import type { SkillRegistryItem } from './skillRegistry';

export type InstalledSkillRegistryStatus = 'up_to_date' | 'update_available' | 'missing_from_registry';

export interface InstalledSkillStatus {
  id: string;
  installedVersion: string;
  registryVersion?: string;
  registryStatus?: SkillRegistryItem['status'];
  status: InstalledSkillRegistryStatus;
  installedProviders: SkillProvider[];
  registryProviders: SkillProvider[];
  missingArtifactPaths: string[];
}

export function getInstalledSkillStatuses(options: {
  projectRoot: string;
  registryRoot: string;
}): InstalledSkillStatus[] {
  const manifest = loadProjectSkillsManifest(options.projectRoot);
  const registry = new Map(loadSkillRegistry(options.registryRoot).map((item) => [item.id, item]));

  return manifest.installed.map((installed) => {
    const registryItem = registry.get(installed.id);
    const missingArtifactPaths = installed.artifacts
      .filter((artifact) => !fs.existsSync(`${options.projectRoot}/${artifact.path}`))
      .map((artifact) => artifact.path);

    return {
      id: installed.id,
      installedVersion: installed.version,
      registryVersion: registryItem?.version,
      registryStatus: registryItem?.status,
      status: !registryItem
        ? 'missing_from_registry'
        : registryItem.version === installed.version
          ? 'up_to_date'
          : 'update_available',
      installedProviders: [...new Set(installed.artifacts.map((artifact) => artifact.provider))],
      registryProviders: registryItem ? [...registryItem.providers] : [],
      missingArtifactPaths,
    };
  });
}
