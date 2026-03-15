import type { ProjectBrief } from '../schema';
import { formatDomains, formatOwner } from '../templateDisplay';

export function generateArchitecture(brief: ProjectBrief): string {
  const { project, tech, structure } = brief;

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

  return `# ARCHITECTURE.md — System Architecture

## Project
${project.name} — ${project.description}

## Tech Stack
- Domains: ${formatDomains(tech.domains)}
- Primary Language: ${tech.primary_language}
${frameworkLine}
${structureSection}

## Architecture Overview
[Describe the high-level architecture here]

## Key Components
[List and describe key system components]

## Data Flow
[Describe how data flows through the system]

## Infrastructure
[Describe deployment and infrastructure details]
`;
}
