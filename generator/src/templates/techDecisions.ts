import type { ProjectBrief } from '../schema';
import { formatPlanningStatus, getTechDecisionsByStatus } from '../planning';

function renderDecisionSection(
  brief: ProjectBrief,
  status: 'adopted' | 'candidate' | 'open' | 'rejected',
  title: string,
  emptyText: string,
): string {
  const items = getTechDecisionsByStatus(brief, status);
  if (items.length === 0) return `## ${title}\n${emptyText}`;

  return `## ${title}
${items.map((item) => `### ${item.topic}
- **Choice**: ${item.choice}
- **Status**: ${formatPlanningStatus(item.status)}
- **Rationale**: ${item.rationale || 'TBD'}
- **Decision Date**: ${item.decision_date || 'TBD'}
- **Notes**: ${item.notes || 'None'}
`).join('\n')}`;
}

export function generateTechDecisions(brief: ProjectBrief): string {
  return `# TECH_DECISIONS.md — Technology Decisions

## Purpose
Track technology choices separately from product requirements so the team can see what is adopted, what is only a candidate, and what is still open.

## Status Guide
- **Adopted**: the project starts with this choice.
- **Candidate**: likely direction, but not locked yet.
- **Open**: still unresolved and needs a decision.
- **Rejected**: explicitly not chosen for now.

${renderDecisionSection(brief, 'adopted', 'Adopted Decisions', 'No adopted technology decisions were captured at generation time.')}

${renderDecisionSection(brief, 'candidate', 'Candidate Decisions', 'No candidate technology decisions were captured at generation time.')}

${renderDecisionSection(brief, 'open', 'Open Decisions', 'No open technology decisions were captured at generation time.')}

${renderDecisionSection(brief, 'rejected', 'Rejected Decisions', 'No rejected technology decisions were captured at generation time.')}
`;
}
