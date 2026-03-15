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

export interface RemoveSkillResult {
  skillId: string;
  removedFiles: string[];
  manifestPath: string;
  warnings: string[];
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
  const curatedPath = path.join(registryRoot, 'curated', skillId);
  const officialPath = path.join(registryRoot, 'official', skillId);
  const internalPath = path.join(registryRoot, 'internal', skillId);
  for (const candidate of [curatedPath, officialPath, internalPath]) {
    if (fs.existsSync(path.join(candidate, 'skill.json'))) {
      return candidate;
    }
  }
  throw new Error(`Skill registry entry directory not found for: ${skillId}`);
}

export function installSkill(options: InstallSkillOptions): InstallSkillResult {
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
    const fromPath = path.join(itemRoot, artifact.sourcePath);
    const toPath = path.join(options.projectRoot, artifact.targetPath);
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
  const manifest = loadProjectSkillsManifest(options.projectRoot);
  const removal = planSkillRemoval({
    manifest,
    skillId: options.skillId,
  });

  const removedFiles: string[] = [];
  for (const artifact of removal.removedArtifacts) {
    const artifactPath = path.join(options.projectRoot, artifact.path);
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
