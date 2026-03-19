import type { ProjectBrief, ProjectSpec, SpecVersion } from './schema';
import { hasAiTool } from './aiTools';
import { generateProjectMd } from './templates/projectMd';
import { generateClaudeMd } from './templates/claudeMd';
import { generateGeminiMd } from './templates/geminiMd';
import { generateActiveContext } from './templates/activeContext';
import { generateTechDecisions } from './templates/techDecisions';
import { generateExternalDependencies } from './templates/externalDependencies';
import { generateRequirements } from './templates/requirements';
import { generateArchitecture } from './templates/architecture';
import { generateRoadmap } from './templates/roadmap';
import { generateAdrTemplate } from './templates/adrTemplate';
import { generatePlansTemplate } from './templates/plansTemplate';
import { generateRestart } from './templates/restart';
import { generateSecurity } from './templates/security';
import { generateEnvExample } from './templates/envExample';
import { generateGitignore } from './templates/gitignore';
import { generateGlobalContext } from './templates/globalContext';
import { generateContributing } from './templates/contributing';
import { generatePrTemplate } from './templates/prTemplate';
import { generateIssueBugReport } from './templates/issueBugReport';
import { generateIssueFeatureRequest } from './templates/issueFeatureRequest';
import { generateVersioningStandard } from './templates/versioningStandard';
import { createEmptySkillsManifest } from './skillsManifest';
import { generateRunbookReadme } from './templates/runbookReadme';
import { generateSkillInstallRunbook } from './templates/skillInstallRunbook';
import { generateSkillsReadme } from './templates/skillsReadme';
import type { ProjectSkillsManifest, SkillProvider } from './skillsManifest';
import { generateInstallSelectedSkillsScript } from './templates/installSelectedSkillsScript';
import { formatOwner } from './templateDisplay';

type RepoEntry = ProjectBrief['structure']['repos'][number];
const DEFAULT_SPEC_VERSION: SpecVersion = '1.0';

export interface GenerateFromSpecOptions {
  specVersion?: SpecVersion;
  generatorVersion?: string;
  generatedAt?: string;
  source?: 'projectSpec' | 'legacyBrief';
  selectedSkills?: SelectedSkillRecommendation[];
  selectedSkillsBundled?: boolean;
  selectedSkillsManifest?: ProjectSkillsManifest;
  selectedSkillFiles?: Array<[string, string]>;
}

interface RepoGenesisManifest {
  specVersion: SpecVersion;
  generatorVersion: string;
  generatedAt: string;
  source: 'projectSpec' | 'legacyBrief';
  projectSlug: string;
  repoType: ProjectBrief['structure']['repo_type'];
  fileCount: number;
  selectedSkills: SelectedSkillRecommendation[];
}

export interface SelectedSkillRecommendation {
  id: string;
  name: string;
  version: string;
  sourceType: 'official' | 'curated' | 'internal';
  providers: SkillProvider[];
}

function resolveSpecVersion(input: ProjectBrief | ProjectSpec, options?: GenerateFromSpecOptions): SpecVersion {
  if ('specVersion' in input) {
    return input.specVersion;
  }
  return options?.specVersion ?? DEFAULT_SPEC_VERSION;
}

function normalizeBrief(input: ProjectBrief | ProjectSpec): ProjectBrief {
  if ('specVersion' in input) {
    const { specVersion: _specVersion, ...brief } = input;
    return brief;
  }
  return input;
}

function buildManifest(
  brief: ProjectBrief,
  fileCount: number,
  options: GenerateFromSpecOptions | undefined,
  specVersion: SpecVersion,
  source: 'projectSpec' | 'legacyBrief',
): RepoGenesisManifest {
  return {
    specVersion,
    generatorVersion: options?.generatorVersion ?? 'dev',
    generatedAt: options?.generatedAt ?? new Date().toISOString(),
    source: options?.source ?? source,
    projectSlug: brief.project.slug,
    repoType: brief.structure.repo_type,
    fileCount,
    selectedSkills: options?.selectedSkills ?? [],
  };
}

function buildToolWrapperEntries(
  brief: ProjectBrief,
  options: { prefix?: string; scope: 'single' | 'workspace' | 'repo'; repo?: RepoEntry },
): Array<[string, string]> {
  const prefix = options.prefix ?? '';
  const entries: Array<[string, string]> = [];

  if (hasAiTool(brief.tech, 'claude_code')) {
    entries.push([`${prefix}CLAUDE.md`, generateClaudeMd(brief, options)]);
  }
  if (hasAiTool(brief.tech, 'gemini_cli')) {
    entries.push([`${prefix}GEMINI.md`, generateGeminiMd(brief, options)]);
  }

  return entries;
}

function repoActiveContext(brief: ProjectBrief, repo: RepoEntry): string {
  const now = new Date().toISOString().split('T')[0];
  const deps = repo.depends_on.length > 0
    ? `- Depends on: ${repo.depends_on.join(', ')}`
    : '- No dependencies';
  const toolFiles = [
    '`PROJECT.md`',
    hasAiTool(brief.tech, 'claude_code') ? '`CLAUDE.md`' : null,
    hasAiTool(brief.tech, 'gemini_cli') ? '`GEMINI.md`' : null,
  ].filter(Boolean).join('\n- ');

  return `# ACTIVE_CONTEXT.md — ${repo.name}

## Last Updated
${now}

## Current Phase
Phase 0 — Repository Initialization

## What Has Been Done
- Repository structure generated by RepoGenesis.
- Common constitution created in PROJECT.md.
- Tool-specific wrapper files created when enabled.
${deps}

## What Is Being Done Now
- Ready for Phase 1 planning.

## What Is Blocked
- Nothing currently blocked.

## Files That Exist
- ${toolFiles}
- \`docs/ACTIVE_CONTEXT.md\` (this file)
- \`docs/ARCHITECTURE.md\`
- \`docs/ROADMAP.md\`
- \`docs/VERSIONING_STANDARD.md\`
- \`../docs/TECH_DECISIONS.md\`
- \`../docs/EXTERNAL_DEPENDENCIES.md\`
- \`docs/ADR/0000-template.md\`
- \`plans/template.md\`
- \`prompts/restart.md\`

## Next Step
Begin Phase 1 planning for ${repo.name}.
`;
}

function repoArchitecture(brief: ProjectBrief, repo: RepoEntry): string {
  const deps = repo.depends_on.length > 0
    ? `\n### Dependencies\n${repo.depends_on.map((d) => `- ${d}`).join('\n')}`
    : '';

  return `# ARCHITECTURE.md — ${repo.name}

## Repository
- **Name**: ${repo.name}
- **Type**: ${repo.type}
- **Description**: ${repo.description}
- **Owner**: ${formatOwner(repo.owner)}

## Part of
${brief.project.name} (workspace: ${brief.project.slug})
${deps}

## Architecture Overview
[Describe the architecture for this ${repo.type} repository]

## Key Components
[List and describe key components]

## Data Flow
[Describe data flow within this repository and with dependencies]
`;
}

function buildSingleRepo(brief: ProjectBrief, options?: GenerateFromSpecOptions): Map<string, string> {
  const files = new Map<string, string>();
  const selectedSkills = options?.selectedSkills ?? [];
  const selectedSkillsBundled = options?.selectedSkillsBundled ?? false;
  const selectedSkillsManifest = options?.selectedSkillsManifest ?? createEmptySkillsManifest();
  const selectedSkillFiles = options?.selectedSkillFiles ?? [];

  const entries: [string, string][] = [
    ['PROJECT.md', generateProjectMd(brief, { scope: 'single' })],
    ...buildToolWrapperEntries(brief, { scope: 'single' }),
    ['docs/ACTIVE_CONTEXT.md', generateActiveContext(brief)],
    ['docs/TECH_DECISIONS.md', generateTechDecisions(brief)],
    ['docs/EXTERNAL_DEPENDENCIES.md', generateExternalDependencies(brief)],
    ['docs/REQUIREMENTS.md', generateRequirements(brief)],
    ['docs/ARCHITECTURE.md', generateArchitecture(brief)],
    ['docs/ROADMAP.md', generateRoadmap(brief)],
    ['docs/VERSIONING_STANDARD.md', generateVersioningStandard(brief)],
    ['docs/ADR/0000-template.md', generateAdrTemplate(brief)],
    ['docs/runbooks/README.md', generateRunbookReadme(brief)],
    ['docs/runbooks/skill-install.md', generateSkillInstallRunbook(brief, selectedSkills, { bundledAtGeneration: selectedSkillsBundled })],
    ['plans/template.md', generatePlansTemplate(brief)],
    ['prompts/restart.md', generateRestart(brief)],
    ['SECURITY.md', generateSecurity(brief)],
    ['.env.example', generateEnvExample(brief)],
    ['.gitignore', generateGitignore(brief)],
    ['skills/README.md', generateSkillsReadme(brief, selectedSkills, { bundledAtGeneration: selectedSkillsBundled })],
    ['repogenesis.skills.json', `${JSON.stringify(selectedSkillsManifest, null, 2)}\n`],
    ['CONTRIBUTING.md', generateContributing(brief)],
    ['.github/PULL_REQUEST_TEMPLATE.md', generatePrTemplate(brief)],
    ['.github/ISSUE_TEMPLATE/bug_report.md', generateIssueBugReport(brief)],
    ['.github/ISSUE_TEMPLATE/feature_request.md', generateIssueFeatureRequest(brief)],
  ];

  for (const [path, content] of entries) {
    files.set(path, content);
  }

  if (selectedSkills.length > 0 && !selectedSkillsBundled) {
    files.set('scripts/install-selected-skills.sh', generateInstallSelectedSkillsScript(brief, selectedSkills));
  }

  for (const [relativePath, content] of selectedSkillFiles) {
    files.set(relativePath, content);
  }

  return files;
}

function buildMultiRepo(brief: ProjectBrief, options?: GenerateFromSpecOptions): Map<string, string> {
  const files = new Map<string, string>();
  const selectedSkills = options?.selectedSkills ?? [];
  const selectedSkillsBundled = options?.selectedSkillsBundled ?? false;
  const selectedSkillsManifest = options?.selectedSkillsManifest ?? createEmptySkillsManifest();
  const selectedSkillFiles = options?.selectedSkillFiles ?? [];

  const workspaceEntries: [string, string][] = [
    ['PROJECT.md', generateProjectMd(brief, { scope: 'workspace' })],
    ...buildToolWrapperEntries(brief, { scope: 'workspace' }),
    ['GLOBAL_CONTEXT.md', generateGlobalContext(brief)],
    ['docs/TECH_DECISIONS.md', generateTechDecisions(brief)],
    ['docs/EXTERNAL_DEPENDENCIES.md', generateExternalDependencies(brief)],
    ['REQUIREMENTS.md', generateRequirements(brief)],
    ['SECURITY.md', generateSecurity(brief)],
    ['VERSIONING_STANDARD.md', generateVersioningStandard(brief)],
    ['docs/runbooks/README.md', generateRunbookReadme(brief)],
    ['docs/runbooks/skill-install.md', generateSkillInstallRunbook(brief, selectedSkills, { bundledAtGeneration: selectedSkillsBundled })],
    ['.gitignore', generateGitignore(brief)],
    ['skills/README.md', generateSkillsReadme(brief, selectedSkills, { bundledAtGeneration: selectedSkillsBundled })],
    ['repogenesis.skills.json', `${JSON.stringify(selectedSkillsManifest, null, 2)}\n`],
    ['CONTRIBUTING.md', generateContributing(brief)],
    ['.github/PULL_REQUEST_TEMPLATE.md', generatePrTemplate(brief)],
    ['.github/ISSUE_TEMPLATE/bug_report.md', generateIssueBugReport(brief)],
    ['.github/ISSUE_TEMPLATE/feature_request.md', generateIssueFeatureRequest(brief)],
  ];

  for (const [path, content] of workspaceEntries) {
    files.set(path, content);
  }

  if (selectedSkills.length > 0 && !selectedSkillsBundled) {
    files.set('scripts/install-selected-skills.sh', generateInstallSelectedSkillsScript(brief, selectedSkills));
  }

  for (const [relativePath, content] of selectedSkillFiles) {
    files.set(relativePath, content);
  }

  for (const repo of brief.structure.repos) {
    const repoEntries: [string, string][] = [
      [`${repo.name}/PROJECT.md`, generateProjectMd(brief, { scope: 'repo', repo })],
      ...buildToolWrapperEntries(brief, { prefix: `${repo.name}/`, scope: 'repo', repo }),
      [`${repo.name}/docs/ACTIVE_CONTEXT.md`, repoActiveContext(brief, repo)],
      [`${repo.name}/docs/ARCHITECTURE.md`, repoArchitecture(brief, repo)],
      [`${repo.name}/docs/ROADMAP.md`, generateRoadmap(brief)],
      [`${repo.name}/docs/VERSIONING_STANDARD.md`, generateVersioningStandard(brief)],
      [`${repo.name}/docs/ADR/0000-template.md`, generateAdrTemplate(brief)],
      [`${repo.name}/plans/template.md`, generatePlansTemplate(brief)],
      [`${repo.name}/prompts/restart.md`, generateRestart(brief)],
      [`${repo.name}/.env.example`, generateEnvExample(brief)],
      [`${repo.name}/.gitignore`, generateGitignore(brief)],
    ];

    for (const [path, content] of repoEntries) {
      files.set(path, content);
    }
  }

  return files;
}

/**
 * 純粋関数: ProjectBrief からファイルマップを生成する。
 * Node I/O (fs, path) を一切使用しない。
 * CLI・Web どちらからでも呼び出し可能。
 */
export function generateFromSpec(
  input: ProjectBrief | ProjectSpec,
  options?: GenerateFromSpecOptions,
): Map<string, string> {
  const source = 'specVersion' in input ? 'projectSpec' : 'legacyBrief';
  const specVersion = resolveSpecVersion(input, options);
  const brief = normalizeBrief(input);

  const files = brief.structure.repo_type === 'multi'
    ? buildMultiRepo(brief, options)
    : buildSingleRepo(brief, options);

  const manifest = buildManifest(brief, files.size + 1, options, specVersion, source);
  files.set('.repogenesis/manifest.json', `${JSON.stringify(manifest, null, 2)}\n`);
  return files;
}
