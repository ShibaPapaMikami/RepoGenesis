import type { InstalledSkill, ProjectSkillsManifest, SkillProvider } from './skillsManifest';
import type { ProjectBrief } from './schema';
import type { SkillRegistryItem } from './skillRegistry';

export interface PlannedArtifactInstall {
  provider: SkillProvider;
  artifactKind: 'skill' | 'command' | 'context' | 'extension' | 'doc';
  sourcePath: string;
  targetPath: string;
}

export interface SkillInstallPlan {
  skillId: string;
  version: string;
  sourceType: 'official' | 'curated' | 'internal';
  providers: SkillProvider[];
  artifacts: PlannedArtifactInstall[];
  warnings: string[];
}

export interface SkillRemovalPlan {
  skillId: string;
  found: boolean;
  removedArtifacts: Array<{
    provider: SkillProvider;
    artifactKind: 'skill' | 'command' | 'context' | 'extension' | 'doc';
    path: string;
  }>;
  warnings: string[];
}

function defaultProvidersFromProject(project: ProjectBrief): SkillProvider[] {
  const providers: SkillProvider[] = ['tool_agnostic'];
  if (project.tech.ai_tools.includes('claude_code')) {
    providers.push('claude_code');
  }
  if (project.tech.ai_tools.includes('gemini_cli')) {
    providers.push('gemini_cli');
  }
  return providers;
}

function targetPathForArtifact(provider: SkillProvider, sourcePath: string): string {
  const relativePath = sourcePath.replace(/^[^/]+\//, '');
  switch (provider) {
    case 'codex':
      return `skills/installed/${relativePath}`;
    case 'claude_code':
      return `.claude/skills/${relativePath}`;
    case 'gemini_cli':
      return `.gemini/${relativePath}`;
    case 'tool_agnostic':
      return `skills/installed/${relativePath}`;
  }
}

export function planSkillInstall(options: {
  project: ProjectBrief;
  registryItem: SkillRegistryItem;
  manifest: ProjectSkillsManifest;
  selectedProviders?: SkillProvider[];
}): SkillInstallPlan {
  const requestedProviders = options.selectedProviders?.length
    ? options.selectedProviders
    : defaultProvidersFromProject(options.project);
  const providerSet = new Set(requestedProviders);
  const warnings: string[] = [];

  if (options.registryItem.reviewRequired) {
    warnings.push('reviewRequired=true のため、install 前に明示確認が必要です。');
  }

  const alreadyInstalled = options.manifest.installed.find((item) => item.id === options.registryItem.id);
  if (alreadyInstalled) {
    warnings.push(`skill ${options.registryItem.id} は manifest に既に存在します。update と競合しないか確認してください。`);
  }

  const artifacts = options.registryItem.artifacts
    .filter((artifact) => providerSet.has(artifact.provider))
    .map((artifact) => ({
      provider: artifact.provider,
      artifactKind: artifact.artifactKind,
      sourcePath: artifact.entryPath,
      targetPath: targetPathForArtifact(artifact.provider, artifact.entryPath),
    }));

  if (artifacts.length === 0) {
    warnings.push('選択された provider に一致する artifact がありません。');
  }

  return {
    skillId: options.registryItem.id,
    version: options.registryItem.version,
    sourceType: options.registryItem.sourceType,
    providers: [...new Set(artifacts.map((artifact) => artifact.provider))],
    artifacts,
    warnings,
  };
}

export function applySkillInstallPlanToManifest(options: {
  manifest: ProjectSkillsManifest;
  plan: SkillInstallPlan;
  installedAt: string;
  installedBy?: string;
  notes?: string;
}): ProjectSkillsManifest {
  const nextInstalled = options.manifest.installed.filter((item) => item.id !== options.plan.skillId);
  const nextEntry: InstalledSkill = {
    id: options.plan.skillId,
    version: options.plan.version,
    installedAt: options.installedAt,
    installedBy: options.installedBy,
    sourceType: options.plan.sourceType,
    artifacts: options.plan.artifacts.map((artifact) => ({
      provider: artifact.provider,
      artifactKind: artifact.artifactKind,
      path: artifact.targetPath,
    })),
    notes: options.notes,
  };

  return {
    ...options.manifest,
    installed: [...nextInstalled, nextEntry].sort((left, right) => left.id.localeCompare(right.id)),
  };
}

export function planSkillRemoval(options: {
  manifest: ProjectSkillsManifest;
  skillId: string;
}): SkillRemovalPlan {
  const current = options.manifest.installed.find((item) => item.id === options.skillId);
  if (!current) {
    return {
      skillId: options.skillId,
      found: false,
      removedArtifacts: [],
      warnings: ['manifest に対象 skill が見つかりません。'],
    };
  }

  return {
    skillId: options.skillId,
    found: true,
    removedArtifacts: current.artifacts.map((artifact) => ({
      provider: artifact.provider,
      artifactKind: artifact.artifactKind,
      path: artifact.path,
    })),
    warnings: [],
  };
}

export function applySkillRemovalToManifest(options: {
  manifest: ProjectSkillsManifest;
  skillId: string;
}): ProjectSkillsManifest {
  return {
    ...options.manifest,
    installed: options.manifest.installed.filter((item) => item.id !== options.skillId),
  };
}
