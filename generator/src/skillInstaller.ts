import * as fs from 'fs';
import * as path from 'path';
import { createEmptySkillsManifest, type ProjectSkillsManifest, type SkillProvider } from './skillsManifest';
import { projectSkillsManifestSchema } from './skillsManifestSchema';
import { loadSkillRegistry } from './skillRegistryLoader';
import {
  applySkillInstallPlanToManifest,
  applySkillRemovalToManifest,
  planSkillInstall,
  planSkillRemoval,
} from './skillInstallerPlan';
import type { ProjectBrief } from './schema';
import { assertSafeIdentifier, resolvePathWithin } from './utils/pathSafety';

const MANIFEST_FILE = 'repogenesis.skills.json';

export interface InstallSkillOptions {
  projectRoot: string;
  registryRoot: string;
  skillId: string;
  selectedProviders?: SkillProvider[];
  installedBy?: string;
  installedAt?: string;
}

export interface InstallSkillResult {
  skillId: string;
  copiedFiles: string[];
  manifestPath: string;
  warnings: string[];
}

export interface RemoveSkillOptions {
  projectRoot: string;
  skillId: string;
}

export interface UpdateSkillOptions {
  projectRoot: string;
  registryRoot: string;
  skillId: string;
  selectedProviders?: SkillProvider[];
  installedBy?: string;
  installedAt?: string;
}

export interface UpdateAllSkillsOptions {
  projectRoot: string;
  registryRoot: string;
  installedBy?: string;
  installedAt?: string;
}

export interface RemoveSkillResult {
  skillId: string;
  removedFiles: string[];
  manifestPath: string;
  warnings: string[];
}

export interface UpdateSkillResult {
  skillId: string;
  previousVersion: string;
  nextVersion: string;
  copiedFiles: string[];
  removedFiles: string[];
  manifestPath: string;
  warnings: string[];
}

export interface UpdateAllSkillsResult {
  updated: UpdateSkillResult[];
  skipped: Array<{
    skillId: string;
    reason: string;
  }>;
}

function manifestPath(projectRoot: string): string {
  return path.join(projectRoot, MANIFEST_FILE);
}

function buildInstallerProject(selectedProviders?: SkillProvider[]): ProjectBrief {
  const ai_tools = Array.from(new Set([
    ...(selectedProviders?.includes('codex') ? ['codex' as const] : []),
    ...(selectedProviders?.includes('claude_code') ? ['claude_code' as const] : []),
    ...(selectedProviders?.includes('gemini_cli') ? ['gemini_cli' as const] : []),
  ]));

  return {
    project: {
      name: 'installer-target',
      slug: 'installer-target',
      description: 'installer target',
      owner: 'installer',
      created_at: new Date().toISOString(),
    },
    tech: {
      domains: ['web'],
      primary_language: 'typescript',
      frameworks: [],
      ai_tools,
      ai_tool: ai_tools.includes('claude_code') ? 'claude_cli' : 'other',
      ai_tool_detail: '',
    },
    security: {
      level: 'low',
      has_api_keys: false,
      has_user_data: false,
      has_payment_data: false,
      has_ip_sensitive: false,
      has_credentials: false,
    },
    structure: {
      repo_type: 'single',
      repos: [],
    },
    workflow: {
      phases_count: 3,
    },
    planning: {
      tech_decisions: [],
      external_dependencies: [],
    },
  };
}

export function loadProjectSkillsManifest(projectRoot: string): ProjectSkillsManifest {
  const filePath = manifestPath(projectRoot);
  if (!fs.existsSync(filePath)) {
    return createEmptySkillsManifest();
  }

  const raw = fs.readFileSync(filePath, 'utf-8');
  return projectSkillsManifestSchema.parse(JSON.parse(raw));
}

export function saveProjectSkillsManifest(projectRoot: string, manifest: ProjectSkillsManifest): string {
  const filePath = manifestPath(projectRoot);
  fs.mkdirSync(projectRoot, { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf-8');
  return filePath;
}

function findRegistryItem(registryRoot: string, skillId: string) {
  return loadSkillRegistry(registryRoot).find((item) => item.id === skillId);
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

export function installSkill(options: InstallSkillOptions): InstallSkillResult {
  assertSafeIdentifier(options.skillId, 'skillId');
  const registryItem = findRegistryItem(options.registryRoot, options.skillId);
  if (!registryItem) {
    throw new Error(`Skill not found in registry: ${options.skillId}`);
  }

  const manifest = loadProjectSkillsManifest(options.projectRoot);
  const plan = planSkillInstall({
    project: buildInstallerProject(options.selectedProviders),
    registryItem,
    manifest,
    selectedProviders: options.selectedProviders,
  });

  const copiedFiles: string[] = [];
  const itemRoot = registryItemRoot(options.registryRoot, options.skillId);
  for (const artifact of plan.artifacts) {
    const fromPath = resolvePathWithin(itemRoot, artifact.sourcePath, `registry artifact source (${artifact.sourcePath})`);
    const toPath = resolvePathWithin(options.projectRoot, artifact.targetPath, `project artifact target (${artifact.targetPath})`);
    fs.mkdirSync(path.dirname(toPath), { recursive: true });
    fs.copyFileSync(fromPath, toPath);
    copiedFiles.push(artifact.targetPath);
  }

  const nextManifest = applySkillInstallPlanToManifest({
    manifest,
    plan,
    installedAt: options.installedAt ?? new Date().toISOString(),
    installedBy: options.installedBy,
  });
  const savedManifestPath = saveProjectSkillsManifest(options.projectRoot, nextManifest);

  return {
    skillId: options.skillId,
    copiedFiles,
    manifestPath: savedManifestPath,
    warnings: plan.warnings,
  };
}

export function removeSkill(options: RemoveSkillOptions): RemoveSkillResult {
  assertSafeIdentifier(options.skillId, 'skillId');
  const manifest = loadProjectSkillsManifest(options.projectRoot);
  const removal = planSkillRemoval({
    manifest,
    skillId: options.skillId,
  });

  const removedFiles: string[] = [];
  for (const artifact of removal.removedArtifacts) {
    const artifactPath = resolvePathWithin(options.projectRoot, artifact.path, `installed artifact path (${artifact.path})`);
    if (fs.existsSync(artifactPath)) {
      fs.rmSync(artifactPath, { force: true });
      removedFiles.push(artifact.path);
    }
  }

  const nextManifest = applySkillRemovalToManifest({
    manifest,
    skillId: options.skillId,
  });
  const savedManifestPath = saveProjectSkillsManifest(options.projectRoot, nextManifest);

  return {
    skillId: options.skillId,
    removedFiles,
    manifestPath: savedManifestPath,
    warnings: removal.warnings,
  };
}

export function updateSkill(options: UpdateSkillOptions): UpdateSkillResult {
  assertSafeIdentifier(options.skillId, 'skillId');
  const registryItem = findRegistryItem(options.registryRoot, options.skillId);
  if (!registryItem) {
    throw new Error(`Skill not found in registry: ${options.skillId}`);
  }

  const manifest = loadProjectSkillsManifest(options.projectRoot);
  const current = manifest.installed.find((item) => item.id === options.skillId);
  if (!current) {
    throw new Error(`Skill is not installed in project: ${options.skillId}`);
  }

  const selectedProviders = options.selectedProviders?.length
    ? options.selectedProviders
    : [...new Set(current.artifacts.map((artifact) => artifact.provider))];

  const plan = planSkillInstall({
    project: buildInstallerProject(selectedProviders),
    registryItem,
    manifest,
    selectedProviders,
  });

  const warnings = plan.warnings.filter((warning) => !warning.includes('manifest に既に存在します'));
  if (current.version === registryItem.version) {
    warnings.push(`skill ${options.skillId} はすでに最新 version (${registryItem.version}) です。artifact を再同期します。`);
  }

  const removedFiles: string[] = [];
  for (const artifact of current.artifacts) {
    const artifactPath = resolvePathWithin(options.projectRoot, artifact.path, `installed artifact path (${artifact.path})`);
    if (fs.existsSync(artifactPath)) {
      fs.rmSync(artifactPath, { force: true });
      removedFiles.push(artifact.path);
    } else {
      warnings.push(`更新前 artifact が見つかりません: ${artifact.path}`);
    }
  }

  const copiedFiles: string[] = [];
  const itemRoot = registryItemRoot(options.registryRoot, options.skillId);
  for (const artifact of plan.artifacts) {
    const fromPath = resolvePathWithin(itemRoot, artifact.sourcePath, `registry artifact source (${artifact.sourcePath})`);
    const toPath = resolvePathWithin(options.projectRoot, artifact.targetPath, `project artifact target (${artifact.targetPath})`);
    fs.mkdirSync(path.dirname(toPath), { recursive: true });
    fs.copyFileSync(fromPath, toPath);
    copiedFiles.push(artifact.targetPath);
  }

  const nextManifest = applySkillInstallPlanToManifest({
    manifest,
    plan,
    installedAt: options.installedAt ?? new Date().toISOString(),
    installedBy: options.installedBy,
  });
  const savedManifestPath = saveProjectSkillsManifest(options.projectRoot, nextManifest);

  return {
    skillId: options.skillId,
    previousVersion: current.version,
    nextVersion: registryItem.version,
    copiedFiles,
    removedFiles,
    manifestPath: savedManifestPath,
    warnings,
  };
}

export function updateAllSkills(options: UpdateAllSkillsOptions): UpdateAllSkillsResult {
  const manifest = loadProjectSkillsManifest(options.projectRoot);
  const updated: UpdateSkillResult[] = [];
  const skipped: Array<{
    skillId: string;
    reason: string;
  }> = [];

  if (manifest.installed.length === 0) {
    return {
      updated,
      skipped,
    };
  }

  const registry = new Map(loadSkillRegistry(options.registryRoot).map((item) => [item.id, item]));

  for (const installedSkill of manifest.installed) {
    const registryItem = registry.get(installedSkill.id);
    if (!registryItem) {
      skipped.push({
        skillId: installedSkill.id,
        reason: 'registry entry is missing',
      });
      continue;
    }

    const missingArtifacts = installedSkill.artifacts.filter(
      (artifact) => {
        try {
          return !fs.existsSync(resolvePathWithin(
            options.projectRoot,
            artifact.path,
            `installed artifact path (${artifact.path})`,
          ));
        } catch {
          return true;
        }
      },
    );

    if (installedSkill.version === registryItem.version && missingArtifacts.length === 0) {
      skipped.push({
        skillId: installedSkill.id,
        reason: 'already up to date',
      });
      continue;
    }

    updated.push(updateSkill({
      projectRoot: options.projectRoot,
      registryRoot: options.registryRoot,
      skillId: installedSkill.id,
      selectedProviders: [...new Set(installedSkill.artifacts.map((artifact) => artifact.provider))],
      installedBy: options.installedBy,
      installedAt: options.installedAt,
    }));
  }

  return {
    updated,
    skipped,
  };
}
