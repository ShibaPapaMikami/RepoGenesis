import type { ProjectBrief } from '../schema';
import { formatDependencyCategory, formatPlanningStatus, getDependenciesByStatus } from '../planning';

function renderDependencySection(
  brief: ProjectBrief,
  status: 'adopted' | 'candidate' | 'open' | 'rejected',
  title: string,
  emptyText: string,
): string {
  const items = getDependenciesByStatus(brief, status);
  if (items.length === 0) return `## ${title}\n${emptyText}`;

  return `## ${title}
${items.map((item) => `### ${item.name}
- **Category**: ${formatDependencyCategory(item.category)}
- **Status**: ${formatPlanningStatus(item.status)}
- **Purpose**: ${item.purpose || 'TBD'}
- **Owner**: ${item.owner || 'TBD'}
- **Source**: ${item.source || 'TBD'}
- **License / Terms**: ${item.license || 'TBD'}
- **Env Vars**: ${item.env_vars.length > 0 ? item.env_vars.join(', ') : 'None'}
- **Data Outbound**: ${item.data_outbound ? 'Yes' : 'No'}
- **Notes**: ${item.notes || 'None'}
`).join('\n')}`;
}

export function generateExternalDependencies(brief: ProjectBrief): string {
  return `# EXTERNAL_DEPENDENCIES.md — External Dependencies

## Purpose
Track external APIs, services, OSS, GitHub repositories, and packages used by the project.

## Status Guide
- **Adopted**: required from the start.
- **Candidate**: likely to be used, but not locked.
- **Open**: unresolved.
- **Rejected**: evaluated and not selected for now.

${renderDependencySection(brief, 'adopted', 'Adopted Dependencies', 'No adopted external dependencies were captured at generation time.')}

${renderDependencySection(brief, 'candidate', 'Candidate Dependencies', 'No candidate external dependencies were captured at generation time.')}

${renderDependencySection(brief, 'open', 'Open Dependencies', 'No open external dependencies were captured at generation time.')}

${renderDependencySection(brief, 'rejected', 'Rejected Dependencies', 'No rejected external dependencies were captured at generation time.')}
`;
}
