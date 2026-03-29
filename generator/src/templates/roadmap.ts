import type { ProjectBrief } from '../schema';
import { inferBriefSignals, inferPipelineStages, summarizeDependencyNames, summarizeOpenPlanningItems } from '../templateSignals';

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
  const signals = inferBriefSignals(brief);
  const pipelineStages = inferPipelineStages(brief);
  const adoptedDependencies = summarizeDependencyNames(brief, 'adopted');
  const openPlanningItems = summarizeOpenPlanningItems(brief);

  function buildPhaseContent(index: number): { goals: string[]; deliverables: string[] } {
    switch (index) {
      case 0:
        return {
          goals: [
            'Create the starter repository structure and baseline docs.',
            'Lock project rules, security handling, and version traceability conventions.',
          ],
          deliverables: [
            'Starter repository committed and readable by the team.',
            'Current docs aligned enough for Phase 1 planning.',
          ],
        };
      case 1: {
        const goals = [
          'Turn the generated starter into a concrete execution plan.',
          'Define the first end-to-end workflow and the smallest useful release scope.',
        ];
        if (openPlanningItems.length > 0) {
          goals.push('Resolve the highest-risk open planning items first.');
          goals.push(...openPlanningItems.map((item) => item.endsWith('.') ? item : `${item}.`));
        }
        return {
          goals,
          deliverables: [
            'Filled requirements, architecture, and implementation plan for the first workflow.',
            'Resolved-vs-deferred list for open decisions and dependencies.',
          ],
        };
      }
      case 2: {
        const goals = [
          pipelineStages.length > 0
            ? `Implement the first working pipeline: ${pipelineStages.join(' -> ')}.`
            : 'Implement the first working end-to-end workflow.',
        ];
        if (adoptedDependencies.length > 0) {
          goals.push(`Integrate adopted dependencies needed for the first workflow: ${adoptedDependencies.join(', ')}.`);
        }
        if (signals.hasCli) {
          goals.push('Lock the operator-facing command surface, arguments, and output contract for the first release.');
        }
        return {
          goals,
          deliverables: [
            'First working vertical slice of the primary workflow.',
            'Smoke checks or fixtures for the main workflow.',
          ],
        };
      }
      case 3: {
        const goals = [
          'Validate output quality, failure handling, and operator experience for the first workflow.',
        ];
        if (signals.hasTts || signals.hasAudio) {
          goals.push('Verify synthesis parameters, output format, and post-processing quality gates.');
        }
        if (signals.hasUnity) {
          goals.push('Stabilize the Unity or downstream runtime handoff boundary before expanding scope.');
        }
        return {
          goals,
          deliverables: [
            'Acceptance checks executed against the release-candidate workflow.',
            'Release and rollback expectations captured in docs or runbooks.',
          ],
        };
      }
      case 4:
        return {
          goals: [
            'Implement deferred integrations or automation items that were intentionally left out of the first release.',
            'Convert remaining candidate dependencies into adopted, rejected, or explicitly deferred outcomes.',
          ],
          deliverables: [
            'Deferred scope either shipped or intentionally rescheduled.',
            'Planning docs updated to reflect what changed after the first release candidate.',
          ],
        };
      case 5:
        return {
          goals: [
            'Stabilize documentation, observability, and supportability around the implemented workflow.',
            'Reduce drift between starter docs, live behavior, and operational expectations.',
          ],
          deliverables: [
            'Operational docs aligned with the real system.',
            'Known support, monitoring, and maintenance tasks captured.',
          ],
        };
      case 6:
        return {
          goals: [
            'Prepare the next release boundary with explicit scope, cutover checks, and rollback expectations.',
            'Confirm that versioning and traceability surfaces remain accurate after feature expansion.',
          ],
          deliverables: [
            'Release plan for the next milestone.',
            'Updated versioning and traceability checklist.',
          ],
        };
      case 7:
        return {
          goals: [
            'Collect post-launch feedback and convert it into scoped follow-up work.',
            'Tighten the workflow based on real usage rather than assumptions.',
          ],
          deliverables: [
            'Prioritized iteration backlog.',
            'Documented learnings from initial users or operators.',
          ],
        };
      case 8:
        return {
          goals: [
            'Scale governance, ownership, and operational controls without breaking the first workflow.',
            'Clarify what must become policy versus what can remain team convention.',
          ],
          deliverables: [
            'Updated governance and ownership model.',
            'Expanded operational controls where justified by real usage.',
          ],
        };
      default:
        return {
          goals: [
            `Keep ${project.name} maintainable as scope expands.`,
            'Reassess technical debt, ownership, and operational load before adding more surface area.',
          ],
          deliverables: [
            'Maintenance backlog reviewed and reprioritized.',
            'Current architecture and requirements kept aligned with reality.',
          ],
        };
    }
  }

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
    const taskMarker = status === 'Complete' ? 'x' : ' ';
    const { goals, deliverables } = buildPhaseContent(i);
    phases.push(`### Phase ${phaseNum}: ${title}
- **Status**: ${status}
- **Goals**:
${goals.map((goal) => `  - [${taskMarker}] ${goal}`).join('\n')}
- **Deliverables**:
${deliverables.map((item) => `  - [${taskMarker}] ${item}`).join('\n')}
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
