import type { ProjectBrief } from '../schema';

export function generateRoadmap(brief: ProjectBrief): string {
  const { project, workflow } = brief;

  const phases: string[] = [];
  for (let i = 0; i < workflow.phases_count; i++) {
    const phaseNum = i;
    let title: string;
    if (i === 0) {
      title = 'Project Setup & Foundation';
    } else if (i === workflow.phases_count - 1) {
      title = 'Polish, Testing & Release';
    } else {
      title = `Phase ${phaseNum} — [Define scope]`;
    }

    const status = i === 0 ? 'In Progress' : 'Not Started';
    phases.push(`### Phase ${phaseNum}: ${title}
- **Status**: ${status}
- **Goals**:
  - [ ] [Define goals for this phase]
- **Deliverables**:
  - [ ] [Define deliverables]
`);
  }

  return `# ROADMAP.md — Phase Plan

## Project
${project.name}

## Phase Overview
Total phases: ${workflow.phases_count}

${phases.join('\n')}
## Completion Criteria
- [ ] All phases completed
- [ ] All deliverables met
- [ ] Documentation up to date
`;
}
