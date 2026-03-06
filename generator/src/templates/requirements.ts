import type { ProjectBrief } from '../schema';

export function generateRequirements(brief: ProjectBrief): string {
  const { project, tech } = brief;

  const frameworkLine = tech.frameworks.length > 0
    ? `- Frameworks: ${tech.frameworks.join(', ')}\n`
    : '';

  return `# REQUIREMENTS.md — Functional Requirements

## Purpose
Define what ${project.name} must do. This is the single source of truth for functional requirements.

## Project Overview
- **Name**: ${project.name}
- **Slug**: ${project.slug}
- **Description**: ${project.description}
- **Owner**: ${project.owner}

## Technical Context
- Domains: ${tech.domains.join(', ')}
- Primary Language: ${tech.primary_language}
${frameworkLine}- AI Tool: ${tech.ai_tool}

## Core Requirements

### R1: [Define your first requirement]
- Description: ...
- Acceptance Criteria:
  - [ ] ...

### R2: [Define your second requirement]
- Description: ...
- Acceptance Criteria:
  - [ ] ...

## Non-Requirements
- [List things explicitly out of scope]

## Operational Standards

### Version Traceability
- Running services must expose release version and commit SHA.
- APIs should expose deploy identity through health/version surfaces or logs.
- CLI tools should support version output.
`;
}
