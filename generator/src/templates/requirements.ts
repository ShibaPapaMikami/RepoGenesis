import type { ProjectBrief } from '../schema';
import { formatAiTools } from '../aiTools';
import { formatDomains, formatOwner, formatProjectDescription } from '../templateDisplay';

export function generateRequirements(brief: ProjectBrief): string {
  const { project, tech, security, structure } = brief;

  const frameworkLine = tech.frameworks.length > 0
    ? `- Frameworks: ${tech.frameworks.join(', ')}\n`
    : '';
  const requirementLines = [
    `### R1: Deliver the primary workflow`,
    `- Description: ${project.name} must support the first useful user outcome described in the overview: ${formatProjectDescription(project.description)}.`,
    `- Acceptance Criteria:`,
    `  - [ ] A user can complete the first end-to-end workflow for ${project.name}.`,
    `  - [ ] The main inputs and outputs for that workflow are explicitly handled in code or documented in the repository.`,
    `  - [ ] The first workflow is small enough to deliver within the current planning horizon without broadening scope unnecessarily.`,
    ``,
    `### R2: Keep the project operable and traceable from day one`,
    `- Description: ${project.name} must remain easy to start, safe to configure, and easy to inspect while the product scope is still evolving.`,
    `- Acceptance Criteria:`,
    `  - [ ] Local setup expectations and required environment placeholders are documented.`,
    `  - [ ] Security expectations for level \`${security.level}\` are reflected in implementation and deployment decisions.`,
    `  - [ ] Release version and commit identity can be surfaced by the running service, API, or CLI when applicable.`,
  ];

  if (structure.repo_type === 'multi') {
    const repoNames = structure.repos.map((repo) => repo.name).join(', ');
    requirementLines.push(
      '',
      '### R3: Keep repository boundaries explicit',
      `- Description: The workspace must keep responsibilities clear across the initial repositories: ${repoNames}.`,
      '- Acceptance Criteria:',
      '  - [ ] Each repository has a clearly named responsibility and owner.',
      '  - [ ] Cross-repository dependencies are documented before implementation work starts.',
      '  - [ ] Shared decisions stay in workspace-level docs and do not drift into repo-local copies.',
    );
  }

  const knownTbdLines = [
    project.owner.trim() ? null : '- Project owner is still TBD.',
    tech.domains.length > 0 ? null : '- Technical domain is still TBD.',
    tech.frameworks.length > 0 ? null : '- Framework choice is still TBD.',
  ].filter(Boolean) as string[];

  return `# REQUIREMENTS.md — Functional Requirements

## Purpose
Define what ${project.name} must do. This is the single source of truth for functional requirements.

## Project Overview
- **Name**: ${project.name}
- **Slug**: ${project.slug}
- **Description**: ${formatProjectDescription(project.description)}
- **Owner**: ${formatOwner(project.owner)}

## Technical Context
- Domains: ${formatDomains(tech.domains)}
- Primary Language: ${tech.primary_language}
${frameworkLine}- AI Tools: ${formatAiTools(tech)}

## Core Requirements
${requirementLines.join('\n')}

## Non-Requirements
- Anything outside the first workflow or current roadmap phase remains out of scope until explicitly added.
- New integrations, automation, or scaling work should be introduced only after the initial workflow is stable.

## Known TBDs
${knownTbdLines.length > 0 ? knownTbdLines.join('\n') : '- No major TBDs were detected at generation time.'}

## Operational Standards

### Version Traceability
- Running services must expose release version and commit SHA.
- APIs should expose deploy identity through health/version surfaces or logs.
- CLI tools should support version output.
`;
}
