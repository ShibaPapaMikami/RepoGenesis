import type { ProjectBrief } from '../schema';
import { buildToolWrapperExampleClause, formatAiTools, getToolWrapperFiles } from '../aiTools';
import { getAdoptedDependencyBulletLines, getAdoptedTechBulletLines } from '../planning';
import { formatDomains, formatOwner, formatProjectDescription } from '../templateDisplay';

interface RepoEntry {
  name: string;
  type: string;
  description: string;
  owner: string;
  depends_on: string[];
}

interface GenerateProjectMdOptions {
  scope?: 'single' | 'workspace' | 'repo';
  repo?: RepoEntry;
}

function buildSecurityRules(brief: ProjectBrief): string {
  const { security } = brief;

  let rules = `### 2. Security
- Never output real API keys, tokens, or credentials.
- Never store secrets in markdown or JSON.
- Always use placeholders: \`YOUR_API_KEY_HERE\`, \`YOUR_SECRET_HERE\`.
- Never echo back credentials if user pastes them.
- Never suggest committing .env or secret files.
- .env must always be in .gitignore.`;

  if (security.has_payment_data) {
    rules += `\n- NEVER include payment data, card numbers, or financial credentials in code, comments, or documentation.
- All payment-related logic must reference PCI DSS compliance requirements.`;
  }

  if (security.has_ip_sensitive) {
    rules += `\n- NEVER include client-confidential information, proprietary algorithms, or NDA-protected content in code comments or documentation.
- All references to client projects must use codenames or anonymized identifiers.`;
  }

  return rules;
}

function buildToolFiles(brief: ProjectBrief): string[] {
  return ['PROJECT.md', ...getToolWrapperFiles(brief.tech)];
}

function buildSingleStructure(brief: ProjectBrief): string {
  const toolLines = buildToolFiles(brief).map((file) => `├── ${file}`).join('\n');
  return `\`\`\`
${brief.project.slug}/
${toolLines}
├── docs/
│   ├── ACTIVE_CONTEXT.md
│   ├── TECH_DECISIONS.md
│   ├── EXTERNAL_DEPENDENCIES.md
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── VERSIONING_STANDARD.md
│   ├── ADR/
│   │   └── 0000-template.md
├── plans/
│   └── template.md
├── prompts/
│   └── restart.md
├── SECURITY.md
├── .env.example
└── .gitignore
\`\`\``;
}

function buildWorkspaceStructure(brief: ProjectBrief): string {
  const toolLines = buildToolFiles(brief).map((file) => `├── ${file}`).join('\n');
  const repoLines = brief.structure.repos.map((repo) => `├── ${repo.name}/`).join('\n');

  return `\`\`\`
${brief.project.slug}/
${toolLines}
├── GLOBAL_CONTEXT.md
├── REQUIREMENTS.md
├── SECURITY.md
├── VERSIONING_STANDARD.md
├── docs/
│   ├── TECH_DECISIONS.md
│   ├── EXTERNAL_DEPENDENCIES.md
│   └── runbooks/
│       ├── README.md
│       └── skill-install.md
├── prompts/
│   └── restart.md
├── .gitignore
${repoLines}
\`\`\``;
}

function buildRepoStructure(brief: ProjectBrief, repo: RepoEntry): string {
  const toolLines = buildToolFiles(brief).map((file) => `├── ${file}`).join('\n');
  return `\`\`\`
${repo.name}/
${toolLines}
├── docs/
│   ├── ACTIVE_CONTEXT.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── VERSIONING_STANDARD.md
│   └── ADR/
│       └── 0000-template.md
├── plans/
│   └── template.md
├── prompts/
│   └── restart.md
├── .env.example
└── .gitignore
\`\`\``;
}

function buildAdoptedPlanningSection(brief: ProjectBrief): string {
  const adoptedDecisions = getAdoptedTechBulletLines(brief);
  const adoptedDependencies = getAdoptedDependencyBulletLines(brief);

  if (adoptedDecisions.length === 0 && adoptedDependencies.length === 0) {
    return '';
  }

  const sections: string[] = [];
  if (adoptedDecisions.length > 0) {
    sections.push(`- Adopted Decisions:\n${adoptedDecisions.map((line) => `  ${line}`).join('\n')}`);
  }
  if (adoptedDependencies.length > 0) {
    sections.push(`- Adopted External Dependencies:\n${adoptedDependencies.map((line) => `  ${line}`).join('\n')}`);
  }

  return `${sections.join('\n')}\n`;
}

export function generateProjectMd(
  brief: ProjectBrief,
  options: GenerateProjectMdOptions = {},
): string {
  const scope = options.scope ?? (brief.structure.repo_type === 'multi' ? 'workspace' : 'single');
  const repo = options.repo;
  const adoptedPlanning = buildAdoptedPlanningSection(brief);

  const frameworkLine = brief.tech.frameworks.length > 0
    ? `- Frameworks: ${brief.tech.frameworks.join(', ')}\n`
    : '';

  if (scope === 'repo' && repo) {
    const deps = repo.depends_on.length > 0
      ? `- Dependencies: ${repo.depends_on.join(', ')}\n`
      : '';

    return `# ${repo.name} — Repository Constitution

## Part of
${brief.project.name} (workspace: ${brief.project.slug})

## Repository Info
- Name: ${repo.name}
- Type: ${repo.type}
- Description: ${repo.description}
- Owner: ${formatOwner(repo.owner)}
${deps}## Tech Stack
- Domains: ${formatDomains(brief.tech.domains)}
- Primary Language: ${brief.tech.primary_language}
${frameworkLine}- AI Tools: ${formatAiTools(brief.tech)}
${adoptedPlanning}

## Absolute Rules
### 1. No Guessing
- Do not infer project state, phase, or intent.
- If information is missing, ask. Do not fill in.
- Every claim must have a verifiable source (file, user statement, or tool output).

${buildSecurityRules(brief)}

### 3. File Authority
- \`docs/ACTIVE_CONTEXT.md\` is the single source of truth for this repository's current state.
- \`docs/ROADMAP.md\` tracks phase progression for this repository.
- \`docs/ARCHITECTURE.md\` defines this repository's technical boundaries.
- \`docs/VERSIONING_STANDARD.md\` defines runtime traceability rules.
- \`../docs/TECH_DECISIONS.md\` tracks workspace-level adopted, candidate, and open technical decisions.
- \`../docs/EXTERNAL_DEPENDENCIES.md\` tracks workspace-level external dependencies and their status.
- \`../GLOBAL_CONTEXT.md\` is the workspace-level source of truth for cross-repo context.

### 4. Session Protocol
- Read \`PROJECT.md\` first.
- Read the tool-specific wrapper${buildToolWrapperExampleClause(brief.tech)} if your tool uses one.
- Read \`docs/ACTIVE_CONTEXT.md\`.
- Read \`../GLOBAL_CONTEXT.md\` when changes cross repository boundaries.
- Summarize current state before taking any action.

## Repository Structure
${buildRepoStructure(brief, repo)}
`;
  }

  if (scope === 'workspace') {
    const repoList = brief.structure.repos.map((entry) => {
      const deps = entry.depends_on.length > 0 ? ` (depends on: ${entry.depends_on.join(', ')})` : '';
      return `- ${entry.name}: ${entry.description}${deps}`;
    }).join('\n');

    return `# ${brief.project.name} — Workspace Constitution

## What is this workspace?
${formatProjectDescription(brief.project.description)}

## Tech Stack
- Domains: ${formatDomains(brief.tech.domains)}
- Primary Language: ${brief.tech.primary_language}
${frameworkLine}- AI Tools: ${formatAiTools(brief.tech)}
${adoptedPlanning}

## Workspace Repositories
${repoList}

## Absolute Rules
### 1. No Guessing
- Do not infer project state, phase, or intent.
- If information is missing, ask. Do not fill in.
- Every claim must have a verifiable source (file, user statement, or tool output).

${buildSecurityRules(brief)}

### 3. File Authority
- \`GLOBAL_CONTEXT.md\` is the single source of truth for workspace-level current state.
- \`REQUIREMENTS.md\` is the single source of truth for workspace-level requirements.
- \`SECURITY.md\` defines shared security rules.
- \`docs/TECH_DECISIONS.md\` tracks adopted, candidate, and open technical decisions.
- \`docs/EXTERNAL_DEPENDENCIES.md\` tracks adopted, candidate, and open external dependencies.
- Each repository's \`PROJECT.md\` defines repository-local rules.
- Each repository's \`docs/ACTIVE_CONTEXT.md\` defines repository-local state.

### 4. Session Protocol
- Read \`PROJECT.md\` first.
- Read the tool-specific wrapper${buildToolWrapperExampleClause(brief.tech)} if your tool uses one.
- Read \`GLOBAL_CONTEXT.md\`.
- Read the target repository's \`PROJECT.md\` and \`docs/ACTIVE_CONTEXT.md\` before editing it.

## Repository Structure
${buildWorkspaceStructure(brief)}
`;
  }

  return `# ${brief.project.name} — Project Constitution

## What is this project?
${formatProjectDescription(brief.project.description)}

## Tech Stack
- Domains: ${formatDomains(brief.tech.domains)}
- Primary Language: ${brief.tech.primary_language}
${frameworkLine}- AI Tools: ${formatAiTools(brief.tech)}
${adoptedPlanning}

## Development Workflow
- Use the tool-specific wrapper that matches your environment when present.
- Keep shared project knowledge in \`PROJECT.md\` and \`docs/\`.
- Use tool-specific files only for tool behavior, not for project truth.

## Absolute Rules
### 1. No Guessing
- Do not infer project state, phase, or intent.
- If information is missing, ask. Do not fill in.
- Every claim must have a verifiable source (file, user statement, or tool output).

${buildSecurityRules(brief)}

### 3. File Authority
- \`PROJECT.md\` is the common constitution for the repository.
- \`docs/ACTIVE_CONTEXT.md\` is the single source of truth for current project state.
- \`docs/ROADMAP.md\` is the single source of truth for phase progression.
- \`docs/REQUIREMENTS.md\` is the single source of truth for what the system must do.
- \`docs/TECH_DECISIONS.md\` tracks adopted, candidate, and open technical decisions.
- \`docs/EXTERNAL_DEPENDENCIES.md\` tracks adopted, candidate, and open external dependencies.
- \`docs/VERSIONING_STANDARD.md\` defines release/version traceability rules.
- If conversation conflicts with files, files win.

### 4. Session Protocol
- Read \`PROJECT.md\` first.
- Read the tool-specific wrapper${buildToolWrapperExampleClause(brief.tech)} if your tool uses one.
- Read \`docs/ACTIVE_CONTEXT.md\` and \`docs/REQUIREMENTS.md\` before taking action.
- Summarize current state before taking any action.

## Repository Structure
${buildSingleStructure(brief)}
`;
}
