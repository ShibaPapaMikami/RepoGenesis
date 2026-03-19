import type { ProjectBrief } from '../schema';

const PHASE_TITLES = [
  'Project Setup & Foundation',
  'Primary Workflow Delivery',
  'Integration & Hardening',
  'Review, QA & Release',
  'Expansion & Automation',
  'Stabilization & Documentation',
  'Release Preparation',
  'Post-Launch Iteration',
  'Scale & Governance',
  'Long-Term Maintenance',
] as const;

export function generateRoadmap(brief: ProjectBrief): string {
  const { project, workflow } = brief;

  const phases: string[] = [];
  for (let i = 0; i < workflow.phases_count; i++) {
    const phaseNum = i;
    const title = PHASE_TITLES[i] ?? `Iteration ${phaseNum}`;
    const status = workflow.phases_count === 1
      ? 'In Progress'
      : i === 0
        ? 'Complete'
        : i === 1
          ? 'In Progress'
          : 'Not Started';
    const goals = i === 0
      ? [
          'Create the starter repository structure and baseline docs.',
          'Lock project rules, security handling, and version traceability conventions.',
        ]
      : i === 1
        ? [
            'Turn the generated starter into a concrete execution plan.',
            'Define the first end-to-end workflow and the smallest useful release scope.',
          ]
        : [
            'Define concrete goals for this phase before implementation starts.',
          ];
    const deliverables = i === 0
      ? [
          'Starter repository committed and readable by the team.',
          'Current docs aligned enough for Phase 1 planning.',
        ]
      : i === 1
        ? [
            'Filled requirements, architecture, and implementation plan for the first workflow.',
          ]
        : [
            'Phase deliverables clarified before work begins.',
          ];
    phases.push(`### Phase ${phaseNum}: ${title}
- **Status**: ${status}
- **Goals**:
${goals.map((goal) => `  - [ ] ${goal}`).join('\n')}
- **Deliverables**:
${deliverables.map((item) => `  - [ ] ${item}`).join('\n')}
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
