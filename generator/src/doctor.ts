import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import { projectSkillsManifestSchema } from './skillsManifestSchema';
import { DEFAULT_RUNBOOK_PATHS } from './runbookBundle';
import { getInstalledSkillStatuses } from './skillStatus';

const WRAPPER_FILES = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md'] as const;

const repogenesisManifestSchema = z.object({
  specVersion: z.string().min(1),
  generatorVersion: z.string().min(1),
  generatedAt: z.string().min(1),
  source: z.enum(['projectSpec', 'legacyBrief']),
  projectSlug: z.string().min(1),
  repoType: z.enum(['single', 'multi']),
  fileCount: z.number().int().min(1),
  selectedSkills: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    version: z.string().min(1),
    sourceType: z.enum(['official', 'curated', 'internal']),
    providers: z.array(z.enum(['codex', 'claude_code', 'gemini_cli', 'tool_agnostic'])),
  })).default([]),
});

const singleRepoRequiredFiles = [
  'PROJECT.md',
  'docs/ACTIVE_CONTEXT.md',
  'docs/AI_TOOLING.md',
  'docs/TECH_DECISIONS.md',
  'docs/EXTERNAL_DEPENDENCIES.md',
  'docs/REQUIREMENTS.md',
  'docs/ARCHITECTURE.md',
  'docs/ROADMAP.md',
  'docs/VERSIONING_STANDARD.md',
  'docs/ADR/0000-template.md',
  ...DEFAULT_RUNBOOK_PATHS,
  'plans/template.md',
  'prompts/restart.md',
  'SECURITY.md',
  '.env.example',
  '.gitignore',
  'skills/README.md',
  'repogenesis.skills.json',
  '.repogenesis/manifest.json',
] as const;

const workspaceRequiredFiles = [
  'PROJECT.md',
  'GLOBAL_CONTEXT.md',
  'REQUIREMENTS.md',
  'SECURITY.md',
  'VERSIONING_STANDARD.md',
  'docs/AI_TOOLING.md',
  'docs/TECH_DECISIONS.md',
  'docs/EXTERNAL_DEPENDENCIES.md',
  ...DEFAULT_RUNBOOK_PATHS,
  '.gitignore',
  'skills/README.md',
  'repogenesis.skills.json',
  '.repogenesis/manifest.json',
] as const;

const repoRequiredFiles = [
  'PROJECT.md',
  'docs/ACTIVE_CONTEXT.md',
  'docs/ARCHITECTURE.md',
  'docs/ROADMAP.md',
  'docs/VERSIONING_STANDARD.md',
  'docs/ADR/0000-template.md',
  'plans/template.md',
  'prompts/restart.md',
  '.env.example',
  '.gitignore',
] as const;

interface ParsedAdoptedDecision {
  topic: string;
  choice: string;
  rationale: string;
}

interface ParsedAdoptedDependency {
  name: string;
  category: string;
  purpose: string;
  envVars: string[];
}

export interface DoctorOptions {
  projectRoot: string;
  registryRoot?: string;
}

export interface DoctorResult {
  success: boolean;
  projectRoot: string;
  errors: string[];
  warnings: string[];
  checkedPaths: string[];
}

function addCheckedPath(result: DoctorResult, relativePath: string): void {
  if (!result.checkedPaths.includes(relativePath)) {
    result.checkedPaths.push(relativePath);
  }
}

function readFileIfExists(projectRoot: string, relativePath: string, result: DoctorResult): string | null {
  addCheckedPath(result, relativePath);
  const fullPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    result.errors.push(`Missing required file: ${relativePath}`);
    return null;
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function readExistingFile(projectRoot: string, relativePath: string, result: DoctorResult): string | null {
  addCheckedPath(result, relativePath);
  const fullPath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

function collectFileCount(projectRoot: string): number {
  let count = 0;
  const stack = [projectRoot];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      count += 1;
    }
  }

  return count;
}

function parseExpectedWrappers(content: string | null): string[] {
  if (!content) {
    return [];
  }

  const wrappers: string[] = [];
  for (const wrapper of WRAPPER_FILES) {
    if (content.includes(`\`${wrapper}\``) || content.includes(wrapper)) {
      wrappers.push(wrapper);
    }
  }
  return wrappers;
}

function validateWrappers(projectRoot: string, baseDir: string, aiToolingMd: string | null, result: DoctorResult): void {
  const expected = new Set(parseExpectedWrappers(aiToolingMd));

  for (const wrapper of expected) {
    const relativePath = baseDir ? `${baseDir}/${wrapper}` : wrapper;
    addCheckedPath(result, relativePath);
    if (!fs.existsSync(path.join(projectRoot, relativePath))) {
      result.errors.push(`Missing expected tool wrapper: ${relativePath}`);
    }
  }

  for (const wrapper of WRAPPER_FILES) {
    const relativePath = baseDir ? `${baseDir}/${wrapper}` : wrapper;
    if (!fs.existsSync(path.join(projectRoot, relativePath))) {
      continue;
    }
    addCheckedPath(result, relativePath);
    if (!expected.has(wrapper)) {
      result.warnings.push(`Unexpected tool wrapper present: ${relativePath}`);
    }
  }
}

function validateRequiredFiles(
  projectRoot: string,
  baseDir: string,
  requiredFiles: readonly string[],
  result: DoctorResult,
): void {
  for (const relativePath of requiredFiles) {
    const fullRelativePath = baseDir ? `${baseDir}/${relativePath}` : relativePath;
    addCheckedPath(result, fullRelativePath);
    if (!fs.existsSync(path.join(projectRoot, fullRelativePath))) {
      result.errors.push(`Missing required file: ${fullRelativePath}`);
    }
  }
}

function validateSkillsManifest(projectRoot: string, result: DoctorResult): void {
  const manifestRaw = readFileIfExists(projectRoot, 'repogenesis.skills.json', result);
  if (!manifestRaw) {
    return;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(manifestRaw);
  } catch {
    result.errors.push('Invalid JSON: repogenesis.skills.json');
    return;
  }

  const manifestResult = projectSkillsManifestSchema.safeParse(parsed);
  if (!manifestResult.success) {
    result.errors.push('Invalid skills manifest: repogenesis.skills.json');
    return;
  }

  for (const installed of manifestResult.data.installed) {
    for (const artifact of installed.artifacts) {
      addCheckedPath(result, artifact.path);
      if (!fs.existsSync(path.join(projectRoot, artifact.path))) {
        result.errors.push(`Missing installed skill artifact: ${artifact.path}`);
      }
    }
  }
}

function validateSkillRegistryDrift(projectRoot: string, registryRoot: string, result: DoctorResult): void {
  addCheckedPath(result, 'repogenesis.skills.json');
  const statuses = getInstalledSkillStatuses({
    projectRoot,
    registryRoot,
  });

  if (statuses.length === 0) {
    return;
  }

  addCheckedPath(result, registryRoot);
  for (const status of statuses) {
    if (status.status === 'update_available' && status.registryVersion) {
      result.warnings.push(
        `Installed skill has update available: ${status.id} (${status.installedVersion} -> ${status.registryVersion})`,
      );
    }
    if (status.status === 'missing_from_registry') {
      result.warnings.push(`Installed skill is missing from registry: ${status.id}`);
    }
  }
}

function discoverRepoDirectories(projectRoot: string): string[] {
  return fs.readdirSync(projectRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((dirName) => {
      const projectMd = path.join(projectRoot, dirName, 'PROJECT.md');
      const activeContext = path.join(projectRoot, dirName, 'docs/ACTIVE_CONTEXT.md');
      return fs.existsSync(projectMd) && fs.existsSync(activeContext);
    })
    .sort();
}

function extractMarkdownSection(content: string, heading: string): string | null {
  const lines = content.split('\n');
  const startIndex = lines.findIndex((line) => line.trim() === `## ${heading}`);
  if (startIndex === -1) {
    return null;
  }

  let endIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    if (lines[index].startsWith('## ')) {
      endIndex = index;
      break;
    }
  }

  return lines.slice(startIndex + 1, endIndex).join('\n').trim();
}

function parseEnvVars(rawValue: string): string[] {
  if (rawValue === 'None') {
    return [];
  }
  return rawValue.split(',').map((item) => item.trim()).filter(Boolean);
}

function parseAdoptedTechDecisions(content: string): ParsedAdoptedDecision[] {
  const section = extractMarkdownSection(content, 'Adopted Decisions');
  if (!section || section.startsWith('No adopted technology decisions')) {
    return [];
  }

  const decisions: ParsedAdoptedDecision[] = [];
  let current: ParsedAdoptedDecision | null = null;

  for (const line of section.split('\n')) {
    if (line.startsWith('### ')) {
      if (current && current.topic && current.choice) {
        decisions.push(current);
      }
      current = {
        topic: line.slice(4).trim(),
        choice: '',
        rationale: '',
      };
      continue;
    }

    if (!current) {
      continue;
    }

    if (line.startsWith('- **Choice**: ')) {
      current.choice = line.slice('- **Choice**: '.length).trim();
      continue;
    }

    if (line.startsWith('- **Rationale**: ')) {
      current.rationale = line.slice('- **Rationale**: '.length).trim();
    }
  }

  if (current && current.topic && current.choice) {
    decisions.push(current);
  }

  return decisions;
}

function parseAdoptedExternalDependencies(content: string): ParsedAdoptedDependency[] {
  const section = extractMarkdownSection(content, 'Adopted Dependencies');
  if (!section || section.startsWith('No adopted external dependencies')) {
    return [];
  }

  const dependencies: ParsedAdoptedDependency[] = [];
  let current: ParsedAdoptedDependency | null = null;

  for (const line of section.split('\n')) {
    if (line.startsWith('### ')) {
      if (current && current.name && current.category) {
        dependencies.push(current);
      }
      current = {
        name: line.slice(4).trim(),
        category: '',
        purpose: '',
        envVars: [],
      };
      continue;
    }

    if (!current) {
      continue;
    }

    if (line.startsWith('- **Category**: ')) {
      current.category = line.slice('- **Category**: '.length).trim();
      continue;
    }

    if (line.startsWith('- **Purpose**: ')) {
      current.purpose = line.slice('- **Purpose**: '.length).trim();
      continue;
    }

    if (line.startsWith('- **Env Vars**: ')) {
      current.envVars = parseEnvVars(line.slice('- **Env Vars**: '.length).trim());
    }
  }

  if (current && current.name && current.category) {
    dependencies.push(current);
  }

  return dependencies;
}

function buildExpectedTechDecisionSummary(decision: ParsedAdoptedDecision): string {
  const rationale = decision.rationale && decision.rationale !== 'TBD'
    ? ` — ${decision.rationale}`
    : '';
  return `- ${decision.topic}: ${decision.choice}${rationale}`;
}

function buildExpectedDependencySummary(dependency: ParsedAdoptedDependency): string {
  const purpose = dependency.purpose && dependency.purpose !== 'TBD'
    ? ` — ${dependency.purpose}`
    : '';
  const envNote = dependency.envVars.length > 0
    ? ` / env: ${dependency.envVars.join(', ')}`
    : '';
  return `- ${dependency.name} (${dependency.category})${purpose}${envNote}`;
}

function validatePlanningSummaries(
  sourceLabel: string,
  content: string,
  expectedSummaries: string[],
  result: DoctorResult,
): void {
  for (const summary of expectedSummaries) {
    if (!content.includes(summary)) {
      result.errors.push(`${sourceLabel} is missing adopted planning summary: ${summary}`);
    }
  }
}

function validateEnvExampleSemantics(
  projectRoot: string,
  envExamplePath: string,
  adoptedEnvVars: string[],
  result: DoctorResult,
): void {
  const envExample = readExistingFile(projectRoot, envExamplePath, result);
  if (!envExample || adoptedEnvVars.length === 0) {
    return;
  }

  for (const envVar of adoptedEnvVars) {
    if (!envExample.includes(`${envVar}=`)) {
      result.errors.push(`${envExamplePath} is missing adopted dependency env var: ${envVar}`);
    }
  }

  if (/^API_KEY=/m.test(envExample) || /^API_SECRET=/m.test(envExample)) {
    result.errors.push(`${envExamplePath} still contains generic API key placeholders despite adopted dependency env vars.`);
  }
}

function validatePlanningDocs(
  projectRoot: string,
  options: {
    repoType: 'single' | 'multi';
    repoDirectories: string[];
  },
  result: DoctorResult,
): void {
  const techDecisions = readExistingFile(projectRoot, 'docs/TECH_DECISIONS.md', result);
  const externalDependencies = readExistingFile(projectRoot, 'docs/EXTERNAL_DEPENDENCIES.md', result);
  const projectMd = readExistingFile(projectRoot, 'PROJECT.md', result);

  if (!techDecisions || !externalDependencies || !projectMd) {
    return;
  }

  const expectedDecisionSummaries = parseAdoptedTechDecisions(techDecisions)
    .map((item) => buildExpectedTechDecisionSummary(item));
  const expectedDependencySummaries = parseAdoptedExternalDependencies(externalDependencies)
    .map((item) => buildExpectedDependencySummary(item));

  validatePlanningSummaries('PROJECT.md', projectMd, expectedDecisionSummaries, result);
  validatePlanningSummaries('PROJECT.md', projectMd, expectedDependencySummaries, result);

  if (options.repoType === 'single') {
    const architecture = readExistingFile(projectRoot, 'docs/ARCHITECTURE.md', result);
    if (architecture) {
      validatePlanningSummaries('docs/ARCHITECTURE.md', architecture, expectedDecisionSummaries, result);
      validatePlanningSummaries('docs/ARCHITECTURE.md', architecture, expectedDependencySummaries, result);
    }
  }

  const adoptedEnvVars = Array.from(new Set(
    parseAdoptedExternalDependencies(externalDependencies).flatMap((item) => item.envVars),
  ));

  if (options.repoType === 'single') {
    validateEnvExampleSemantics(projectRoot, '.env.example', adoptedEnvVars, result);
    return;
  }

  for (const repoDir of options.repoDirectories) {
    validateEnvExampleSemantics(projectRoot, `${repoDir}/.env.example`, adoptedEnvVars, result);
  }
}

export function doctor(options: DoctorOptions): DoctorResult {
  const projectRoot = path.resolve(options.projectRoot);
  const registryRoot = options.registryRoot ? path.resolve(options.registryRoot) : undefined;
  const result: DoctorResult = {
    success: false,
    projectRoot,
    errors: [],
    warnings: [],
    checkedPaths: [],
  };

  if (!fs.existsSync(projectRoot) || !fs.statSync(projectRoot).isDirectory()) {
    result.errors.push(`Project root does not exist: ${projectRoot}`);
    return result;
  }

  const manifestRaw = readFileIfExists(projectRoot, '.repogenesis/manifest.json', result);
  if (!manifestRaw) {
    return result;
  }

  let manifestParsed: unknown;
  try {
    manifestParsed = JSON.parse(manifestRaw);
  } catch {
    result.errors.push('Invalid JSON: .repogenesis/manifest.json');
    return result;
  }

  const manifestResult = repogenesisManifestSchema.safeParse(manifestParsed);
  if (!manifestResult.success) {
    result.errors.push('Invalid RepoGenesis manifest: .repogenesis/manifest.json');
    return result;
  }

  validateSkillsManifest(projectRoot, result);
  if (registryRoot) {
    validateSkillRegistryDrift(projectRoot, registryRoot, result);
  }
  let repoDirectories: string[] = [];

  if (manifestResult.data.repoType === 'single') {
    validateRequiredFiles(projectRoot, '', singleRepoRequiredFiles, result);
    const aiToolingMd = readExistingFile(projectRoot, 'docs/AI_TOOLING.md', result);
    if (aiToolingMd) {
      validateWrappers(projectRoot, '', aiToolingMd, result);
    }
  } else {
    validateRequiredFiles(projectRoot, '', workspaceRequiredFiles, result);
    const workspaceAiToolingMd = readExistingFile(projectRoot, 'docs/AI_TOOLING.md', result);
    if (workspaceAiToolingMd) {
      validateWrappers(projectRoot, '', workspaceAiToolingMd, result);
    }

    repoDirectories = discoverRepoDirectories(projectRoot);
    if (repoDirectories.length === 0) {
      result.errors.push('No generated repository directories were detected under the workspace root.');
    }

    for (const repoDir of repoDirectories) {
      validateRequiredFiles(projectRoot, repoDir, repoRequiredFiles, result);
      if (workspaceAiToolingMd) {
        validateWrappers(projectRoot, repoDir, workspaceAiToolingMd, result);
      }
    }
  }

  validatePlanningDocs(projectRoot, {
    repoType: manifestResult.data.repoType,
    repoDirectories,
  }, result);

  const currentFileCount = collectFileCount(projectRoot);
  if (currentFileCount !== manifestResult.data.fileCount) {
    result.warnings.push(
      `Current file count (${currentFileCount}) differs from generation-time manifest (${manifestResult.data.fileCount}).`,
    );
  }

  result.success = result.errors.length === 0;
  return result;
}
