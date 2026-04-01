import type { ProjectBrief } from '../schema';
import type { SupportedAiTool } from '../aiTools';
import { hasOperatorFacingUi, hasStableCliSurface, inferBriefSignals } from '../templateSignals';
import { getToolWrapperFile } from '../aiTools';

interface RepoEntry {
  name: string;
}

export interface GenerateToolGuidanceOptions {
  scope?: 'single' | 'workspace' | 'repo';
  repo?: RepoEntry;
}

const TOOL_LABELS: Record<SupportedAiTool, string> = {
  codex: 'Codex',
  claude_code: 'Claude Code',
  gemini_cli: 'Gemini CLI',
};

const PROVIDER_SPECIFIC_LINES: Record<SupportedAiTool, string> = {
  codex: '- Prefer repository-local Codex skills or guidance artifacts when they exist.',
  claude_code: '- Prefer repository-local Claude Code skills when they exist.',
  gemini_cli: '- Prefer repository-local Gemini commands or context artifacts when they exist.',
};

export function generateToolGuidance(
  brief: ProjectBrief,
  tool: SupportedAiTool,
  options: GenerateToolGuidanceOptions = {},
): string {
  const scope = options.scope ?? 'single';
  const label = TOOL_LABELS[tool];
  const wrapperFile = getToolWrapperFile(tool);
  const providerSpecificLine = PROVIDER_SPECIFIC_LINES[tool];
  const signals = inferBriefSignals(brief);
  const hasOperatorUi = hasOperatorFacingUi(brief);
  const hasCliSurface = hasStableCliSurface(brief);
  const hasTyperFramework = brief.tech.frameworks.some((framework) => /typer/i.test(framework))
    || (brief.planning?.tech_decisions ?? []).some((item) => /framework/i.test(item.topic) && /typer/i.test(item.choice));
  const domainSpecificLines = [
    hasCliSurface
      ? '- Treat the CLI contract as first-class: keep command examples, flags, exit behavior, and output locations explicit.'
      : null,
    hasCliSurface && brief.tech.primary_language === 'python' && hasTyperFramework
      ? '- For Python CLI projects using `Typer`, keep command groups, help text, option types, and generated CLI help aligned with the documented contract.'
      : null,
    hasCliSurface && brief.tech.primary_language === 'python' && !hasTyperFramework
      ? '- For Python CLI projects, prefer `pyproject.toml` and default to `argparse` unless a richer subcommand tree is clearly justified.'
      : null,
    signals.hasPipeline
      ? '- Keep the first processing pipeline explicit end to end, including stage inputs, outputs, and tunable parameters that affect results.'
      : null,
    signals.hasTts
      ? '- When synthesis or media quality depends on parameters such as voice, speed, pitch, breath, or break, document their defaults and intended effect next to the implementation.'
      : null,
    signals.hasTranscription
      ? '- For transcription products, keep capture source, timestamp or speaker-label behavior, transcript storage format, and export contract explicit from the first release.'
      : null,
    signals.hasUnity
      ? '- Keep the Unity integration boundary explicit: define handoff artifacts, expected file formats, and runtime assumptions before coding across the boundary.'
      : null,
    hasOperatorUi
      ? '- For operator-facing UI, keep a small low-emphasis runtime label in the top-right header showing release version, commit, and deploy or publication time during active development and rollout.'
      : null,
    hasOperatorUi
      ? '- Implement the runtime label so it can later be hidden, feature-flagged, or restricted to admins without removing API/log-based traceability.'
      : null,
  ].filter(Boolean) as string[];
  const domainSpecificBlock = domainSpecificLines.length > 0
    ? `${domainSpecificLines.join('\n')}\n`
    : '';

  if (scope === 'workspace') {
    return `# Read PROJECT.md first.

## ${label} rules
- On session start, read: \`PROJECT.md\` -> \`docs/AI_TOOLING.md\` -> \`GLOBAL_CONTEXT.md\` -> \`REQUIREMENTS.md\`.
- Before editing a repository, also read that repository's \`PROJECT.md\` and \`docs/ACTIVE_CONTEXT.md\`.
- Keep project truth in \`PROJECT.md\` and \`docs/\`; \`${wrapperFile}\` is only the ${label}-specific overlay.
- Treat \`${wrapperFile}\` as a thin adapter over the shared project constitution.
${providerSpecificLine}
${domainSpecificBlock}
- During substantive progress updates, include a short checklist of done / remaining work and a rough remaining-time estimate by default.
`;
  }

  if (scope === 'repo' && options.repo) {
    return `# Read PROJECT.md first.

## ${label} rules
- On session start, read: \`PROJECT.md\` -> \`../docs/AI_TOOLING.md\` -> \`docs/ACTIVE_CONTEXT.md\` -> \`../GLOBAL_CONTEXT.md\`.
- \`${wrapperFile}\` contains ${label}-specific workflow only. Project truth lives in \`PROJECT.md\` and \`docs/\`.
- Treat \`${wrapperFile}\` as a thin adapter over the shared repository and workspace constitutions.
- If work changes another repository, return to \`../GLOBAL_CONTEXT.md\` and update both repositories' context files.
${providerSpecificLine}
${domainSpecificBlock}
- During substantive progress updates, include a short checklist of done / remaining work and a rough remaining-time estimate by default.
`;
  }

  return `# Read PROJECT.md first.

## ${label} rules
- On session start, read: \`PROJECT.md\` -> \`docs/AI_TOOLING.md\` -> \`docs/ACTIVE_CONTEXT.md\` -> \`docs/REQUIREMENTS.md\` -> \`docs/ROADMAP.md\`.
- Keep project truth in \`PROJECT.md\` and \`docs/\`; \`${wrapperFile}\` is only the ${label}-specific overlay.
- Treat \`${wrapperFile}\` as a thin adapter over the shared project constitution.
${providerSpecificLine}
${domainSpecificBlock}
- During substantive progress updates, include a short checklist of done / remaining work and a rough remaining-time estimate by default.
`;
}
