import type { ProjectBrief } from '../schema';
import { getDependenciesByStatus } from '../planning';
import { hasOperatorFacingWebUi, inferBriefSignals, inferPipelineStages, summarizeCoreFeatures, summarizeDependencyNames, summarizeRuntimeBoundary } from '../templateSignals';
import { formatDomains, formatOwner, formatProjectDescription } from '../templateDisplay';

export function generateRequirements(brief: ProjectBrief): string {
  const { project, tech, security, structure } = brief;
  const planning = brief.planning ?? { tech_decisions: [], external_dependencies: [] };
  const signals = inferBriefSignals(brief);
  const pipelineStages = inferPipelineStages(brief);
  const coreFeatures = summarizeCoreFeatures(brief);
  const adoptedDependencies = summarizeDependencyNames(brief, 'adopted');
  const runtimeBoundary = summarizeRuntimeBoundary(brief);
  const hasWebUi = hasOperatorFacingWebUi(brief);
  const hasFrameworkSignal = tech.domains.includes('web')
    || tech.frameworks.length > 0
    || planning.tech_decisions.some((item) => /framework/i.test(item.topic));
  const hasResolvedFrameworkChoice = tech.frameworks.length > 0
    || planning.tech_decisions.some((item) => /framework/i.test(item.topic) && item.choice.trim());

  const frameworkLine = tech.frameworks.length > 0
    ? `- Frameworks: ${tech.frameworks.join(', ')}\n`
    : '';
  const requirementSections: Array<{
    title: string;
    description: string;
    criteria: string[];
  }> = [
    {
      title: 'R1: Deliver the primary workflow',
      description: `${project.name} must support the first useful user outcome described in the overview: ${formatProjectDescription(project.description)}.`,
      criteria: [
        `A user can complete the first end-to-end workflow for ${project.name}.`,
        'The main inputs and outputs for that workflow are explicitly handled in code or documented in the repository.',
        'The first workflow is small enough to deliver within the current planning horizon without broadening scope unnecessarily.',
        'The exact boundary of the initial scope is written down, including what is included now and what is explicitly deferred.',
      ],
    },
    {
      title: 'R2: Keep the project operable and traceable from day one',
      description: `${project.name} must remain easy to start, safe to configure, and easy to inspect while the product scope is still evolving.`,
      criteria: [
        'Local setup expectations and required environment placeholders are documented.',
        `Security expectations for level \`${security.level}\` are reflected in implementation and deployment decisions.`,
        'Release version and commit identity can be surfaced by the running service, API, or CLI when applicable.',
        ...(hasWebUi
          ? [
            'Operator-facing web UI keeps a low-emphasis runtime label in the top-right header showing release version, commit SHA, and deploy or publication time during active development and rollout.',
            'The UI label can later be hidden, feature-flagged, or restricted to admins without removing other runtime identity surfaces.',
          ]
          : []),
      ],
    },
  ];

  if (structure.repo_type === 'multi') {
    const repoNames = structure.repos.map((repo) => repo.name).join(', ');
    requirementSections.push({
      title: `R${requirementSections.length + 1}: Keep repository boundaries explicit`,
      description: `The workspace must keep responsibilities clear across the initial repositories: ${repoNames}.`,
      criteria: [
        'Each repository has a clearly named responsibility and owner.',
        'Cross-repository dependencies are documented before implementation work starts.',
        'Shared decisions stay in workspace-level docs and do not drift into repo-local copies.',
      ],
    });
  }

  if (signals.hasPipeline) {
    const stageLine = pipelineStages.length > 0
      ? `The initial stage order is explicit: ${pipelineStages.join(' -> ')}.`
      : 'The initial stage order is explicit and documented before implementation expands.';

    const criteria = [
      stageLine,
      'Inputs, outputs, and failure boundaries for each stage are documented in code, tests, or repository docs.',
      'The output contract for the first workflow is specified, including response, file, or artifact format when applicable.',
    ];

    if (signals.hasTunableParameters) {
      criteria.push('Tunable parameters that materially affect generated output are listed with defaults and intended effects.');
    }

    if (signals.hasTts || signals.hasAudio) {
      criteria.push('Audio-related parameters and output format requirements are documented when they affect quality or compatibility.');
    }

    requirementSections.push({
      title: `R${requirementSections.length + 1}: Keep the processing pipeline explicit and testable`,
      description: `${project.name} must describe and validate the ordered processing stages needed for the first useful output.`,
      criteria,
    });
  }

  if (coreFeatures.length > 0) {
    requirementSections.push({
      title: `R${requirementSections.length + 1}: Preserve the differentiating workflow features`,
      description: `${project.name} must keep the project-specific features that make the first workflow valuable explicit from the first release.`,
      criteria: [
        `The first release preserves these differentiating features: ${coreFeatures.join(', ')}.`,
        'Each feature is mapped to code, configuration, or acceptance checks rather than being left as a generic quality goal.',
        'Feature-specific behavior is documented close to the first workflow so implementation and review use the same language.',
      ],
    });
  }

  if (runtimeBoundary.length > 0) {
    requirementSections.push({
      title: `R${requirementSections.length + 1}: Keep the client-host runtime boundary explicit`,
      description: `${project.name} must keep the operator-facing client and the inference or media-processing host aligned as separate but coordinated runtime responsibilities.`,
      criteria: [
        ...runtimeBoundary,
        'The runtime transport between client and host is named before implementation expands across machines.',
        'Host OS, GPU, and runtime prerequisites are documented close to setup and deployment notes.',
      ],
    });
  }

  if (signals.hasCli) {
    requirementSections.push({
      title: `R${requirementSections.length + 1}: Provide a stable operator-facing CLI contract`,
      description: `${project.name} must be runnable as a documented command-line workflow from the first release.`,
      criteria: [
        'The primary command entrypoint and invocation examples are documented.',
        'Arguments or options that materially change behavior are documented with expected inputs.',
        'Exit behavior and output location or stdout/stderr contract are defined for the first workflow.',
        'Help and version surfaces exist or are explicitly planned before release.',
      ],
    });
  }

  if (adoptedDependencies.length > 0) {
    requirementSections.push({
      title: `R${requirementSections.length + 1}: Integrate adopted external dependencies intentionally`,
      description: `The first workflow depends on adopted external dependencies that must be introduced deliberately: ${adoptedDependencies.join(', ')}.`,
      criteria: [
        'Each adopted dependency required for the first workflow is named and mapped to a clear purpose.',
        'License or usage terms are reviewed for adopted dependencies before release.',
        'Required environment variables and setup prerequisites are documented.',
        'Dependencies that send data externally have documented outbound-data expectations.',
      ],
    });
  }

  const requirementLines = requirementSections.flatMap((section, index) => [
    index === 0 ? `### ${section.title}` : '',
    index === 0 ? `- Description: ${section.description}` : `### ${section.title}`,
    index === 0 ? '- Acceptance Criteria:' : `- Description: ${section.description}`,
    ...(index === 0 ? section.criteria.map((item) => `  - [ ] ${item}`) : ['- Acceptance Criteria:', ...section.criteria.map((item) => `  - [ ] ${item}`)]),
  ]).filter(Boolean);

  const knownTbdLines = [
    project.owner.trim() ? null : '- Project owner is still TBD.',
    tech.domains.length > 0 ? null : '- Technical domain is still TBD.',
    hasFrameworkSignal && !hasResolvedFrameworkChoice ? '- Framework choice is still TBD.' : null,
    ...planning.tech_decisions
      .filter((item) => item.status === 'open' && item.topic.trim())
      .slice(0, 5)
      .map((item) => `- Open decision: ${item.topic}${item.choice ? ` -> ${item.choice}` : ''}.`),
    ...getDependenciesByStatus(brief, 'open')
      .slice(0, 5)
      .map((item) => `- Open dependency: ${item.name} (${item.category}).`),
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
${frameworkLine}- AI Tooling Policy: \`docs/AI_TOOLING.md\`

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
- Running services should expose deploy or publication time where operators inspect runtime identity.
- APIs should expose deploy identity through health/version surfaces or logs.
- CLI tools should support version output.
`;
}
