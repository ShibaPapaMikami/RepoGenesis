import type { ProjectBrief } from '../schema';
import { getAdoptedDependencyBulletLines, getAdoptedTechBulletLines } from '../planning';
import { formatDomains, formatOwner } from '../templateDisplay';

export function generateArchitecture(brief: ProjectBrief): string {
  const { project, tech, structure } = brief;
  const adoptedDecisions = getAdoptedTechBulletLines(brief);
  const adoptedDependencies = getAdoptedDependencyBulletLines(brief);

  const frameworkLine = tech.frameworks.length > 0
    ? `- Frameworks: ${tech.frameworks.join(', ')}\n`
    : '';

  let structureSection: string;
  if (structure.repo_type === 'single') {
    structureSection = `## Repository Structure
Single repository: \`${project.slug}\``;
  } else {
    const repoLines = structure.repos.map((r) => {
      const deps = r.depends_on.length > 0 ? ` (depends on: ${r.depends_on.join(', ')})` : '';
      return `- **${r.name}** (${r.type}): ${r.description}${deps} — Owner: ${formatOwner(r.owner)}`;
    }).join('\n');

    structureSection = `## Repository Structure
Multi-repository workspace: \`${project.slug}\`

### Repositories
${repoLines}`;
  }

  const overview = structure.repo_type === 'single'
    ? `${project.name} starts as a single-repository project focused on the first usable workflow. The architecture should keep product logic, planning docs, security rules, and release traceability close together until the system proves it needs further separation.`
    : `${project.name} starts as a multi-repository workspace so each major responsibility can evolve with a clear boundary. Workspace-level docs define shared rules, while repository-level docs define local architecture and execution details.`;

  const keyComponents = structure.repo_type === 'single'
    ? [
        `- **Core product workflow**: the main implementation for ${project.name}, built in \`${tech.primary_language}\` and expanded from the generated starter repository.`,
        `- **Documentation and planning layer**: \`PROJECT.md\`, \`docs/REQUIREMENTS.md\`, \`docs/ACTIVE_CONTEXT.md\`, and \`docs/ROADMAP.md\` hold current truth and execution context.`,
        `- **Security and configuration layer**: \`SECURITY.md\` and \`.env.example\` define setup boundaries and secret-handling expectations.`,
        `- **Version traceability layer**: \`docs/VERSIONING_STANDARD.md\` and \`.repogenesis/manifest.json\` define how release and commit identity should be exposed.`,
      ].join('\n')
    : [
        '- **Workspace governance layer**: `PROJECT.md`, `GLOBAL_CONTEXT.md`, `REQUIREMENTS.md`, and `SECURITY.md` define shared rules.',
        ...structure.repos.map((repo) => `- **${repo.name}**: ${repo.description} — Owner: ${formatOwner(repo.owner)}.`),
        '- **Version traceability layer**: workspace and repository outputs should expose release and commit identity consistently.',
      ].join('\n');

  const dataFlow = structure.repo_type === 'single'
    ? [
        `1. A user or operator starts the primary workflow described for ${project.name}.`,
        `2. The application validates and transforms inputs using the core ${tech.primary_language} codebase.`,
        '3. Domain-specific processing runs inside the same repository with shared docs and security rules nearby.',
        '4. Outputs are returned to the user, persisted by the application, or documented for the next phase of work.',
      ].join('\n')
    : [
        `1. Inputs enter through one or more workspace repositories for ${project.name}.`,
        '2. Each repository handles its own bounded responsibility and uses declared dependencies for cross-repo interactions.',
        '3. Shared decisions and architectural changes are reflected back into workspace-level docs.',
        '4. Outputs are coordinated across repositories while keeping ownership and release boundaries explicit.',
      ].join('\n');

  const infrastructure = structure.repo_type === 'single'
    ? [
        `- Start from one deployable repository: \`${project.slug}\`.`,
        `- Use security level \`${brief.security.level}\` as the minimum operational baseline.`,
        '- Keep environment-specific values outside the repository and use placeholders in `.env.example`.',
        '- Add hosting or runtime topology only after Phase 1 planning clarifies the deployment target.',
      ].join('\n')
    : [
        `- Start from the workspace \`${project.slug}\` and deploy repositories independently as needed.`,
        `- Use security level \`${brief.security.level}\` as the minimum shared baseline across repositories.`,
        '- Keep shared secrets and deployment conventions documented at the workspace layer before repo-level divergence.',
        '- Document repository-specific hosting targets only when the delivery plan requires them.',
      ].join('\n');

  return `# ARCHITECTURE.md — System Architecture

## Project
${project.name} — ${project.description}

## Tech Stack
- Domains: ${formatDomains(tech.domains)}
- Primary Language: ${tech.primary_language}
${frameworkLine}
${structureSection}

## Adopted Technology Decisions
${adoptedDecisions.length > 0 ? adoptedDecisions.join('\n') : '- No adopted technology decisions were captured at generation time.'}

## Adopted External Dependencies
${adoptedDependencies.length > 0 ? adoptedDependencies.join('\n') : '- No adopted external dependencies were captured at generation time.'}

## Architecture Overview
${overview}

## Key Components
${keyComponents}

## Data Flow
${dataFlow}

## Infrastructure
${infrastructure}
`;
}
