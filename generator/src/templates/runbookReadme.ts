import type { ProjectBrief } from '../schema';

export function generateRunbookReadme(brief: ProjectBrief): string {
  return `# Runbooks

## Purpose
Store operational procedures for ${brief.project.name}.

## What belongs here
- deploy / rollback steps
- incident response procedures
- credential rotation procedures
- on-call troubleshooting notes
- routine maintenance checklists

## Suggested files
- deploy.md
- rollback.md
- incident-response.md
- credential-rotation.md
`;
}
