import * as fs from 'fs';
import * as path from 'path';
import { applySkillInstallPlanToManifest, planSkillInstall, type SkillInstallPlan } from './skillInstallerPlan';
import { loadSkillRegistry } from './skillRegistryLoader';
import { createEmptySkillsManifest, type ProjectSkillsManifest } from './skillsManifest';
import type { ProjectBrief } from './schema';
import type { SelectedSkillRecommendation } from './generateFromSpec';
import { assertSafeIdentifier, assertSafeRelativePath, resolvePathWithin } from './utils/pathSafety';

export interface BundledSelectedSkillResult {
  files: Array<[string, string]>;
  manifest: ProjectSkillsManifest;
  warnings: string[];
}

export function resolveDefaultSkillRegistryRoot(): string {
  return path.resolve(__dirname, '..', '..', 'skills', 'registry');
}

function registryItemRoot(registryRoot: string, skillId: string): string {
  const safeSkillId = assertSafeIdentifier(skillId, 'skillId');
  const curatedPath = path.join(registryRoot, 'curated', safeSkillId);
  const officialPath = path.join(registryRoot, 'official', safeSkillId);
  const internalPath = path.join(registryRoot, 'internal', safeSkillId);

  for (const candidate of [curatedPath, officialPath, internalPath]) {
    if (fs.existsSync(path.join(candidate, 'skill.json'))) {
      return candidate;
    }
  }

  throw new Error(`Skill registry entry directory not found for: ${skillId}`);
}

function normalizePlanWithExistingArtifacts(
  registryRoot: string,
  skillId: string,
  plan: SkillInstallPlan,
): SkillInstallPlan {
  const itemRoot = registryItemRoot(registryRoot, skillId);
  const artifacts = plan.artifacts.filter((artifact) => {
    try {
      return fs.existsSync(resolvePathWithin(
        itemRoot,
        artifact.sourcePath,
        `registry artifact source (${artifact.sourcePath})`,
      ));
    } catch {
      return false;
    }
  });

  return {
    ...plan,
    providers: [...new Set(artifacts.map((artifact) => artifact.provider))],
    artifacts,
  };
}

export function bundleSelectedSkillsFromRegistry(options: {
  project: ProjectBrief;
  selectedSkills: SelectedSkillRecommendation[];
  registryRoot?: string;
  installedAt?: string;
  installedBy?: string;
}): BundledSelectedSkillResult {
  const registryRoot = options.registryRoot ?? resolveDefaultSkillRegistryRoot();
  const registryItems = loadSkillRegistry(registryRoot);
  const warnings: string[] = [];
  const files = new Map<string, string>();
  let manifest = createEmptySkillsManifest();

  for (const selectedSkill of options.selectedSkills) {
    assertSafeIdentifier(selectedSkill.id, 'selected skill id');
    const registryItem = registryItems.find((item) => item.id === selectedSkill.id);
    if (!registryItem) {
      warnings.push(`selected skill ${selectedSkill.id} が registry に見つかりません。`);
      continue;
    }

    if (registryItem.version !== selectedSkill.version) {
      warnings.push(
        `selected skill ${selectedSkill.id} の version が UI (${selectedSkill.version}) と registry (${registryItem.version}) で一致しません。`,
      );
    }

    const rawPlan = planSkillInstall({
      project: options.project,
      registryItem,
      manifest,
    });
    const plan = normalizePlanWithExistingArtifacts(registryRoot, selectedSkill.id, rawPlan);
    warnings.push(...plan.warnings);

    if (plan.artifacts.length === 0) {
      warnings.push(`selected skill ${selectedSkill.id} にコピー可能な artifact がありません。`);
      continue;
    }

    const itemRoot = registryItemRoot(registryRoot, selectedSkill.id);
    for (const artifact of plan.artifacts) {
      const sourcePath = resolvePathWithin(
        itemRoot,
        artifact.sourcePath,
        `registry artifact source (${artifact.sourcePath})`,
      );
      const targetPath = assertSafeRelativePath(artifact.targetPath, `bundled artifact target (${artifact.targetPath})`);
      const content = fs.readFileSync(sourcePath, 'utf-8');
      files.set(targetPath, content);
    }

    manifest = applySkillInstallPlanToManifest({
      manifest,
      plan,
      installedAt: options.installedAt ?? new Date().toISOString(),
      installedBy: options.installedBy ?? 'repogenesis',
      notes: 'Bundled at generation time by RepoGenesis.',
    });
  }

  return {
    files: [...files.entries()],
    manifest,
    warnings,
  };
}
