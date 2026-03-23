import type { ProjectBrief } from '../schema';
import type { SupportedAiTool } from '../aiTools';
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
  _brief: ProjectBrief,
  tool: SupportedAiTool,
  options: GenerateToolGuidanceOptions = {},
): string {
  const scope = options.scope ?? 'single';
  const label = TOOL_LABELS[tool];
  const wrapperFile = getToolWrapperFile(tool);
  const providerSpecificLine = PROVIDER_SPECIFIC_LINES[tool];

  if (scope === 'workspace') {
    return `# Read PROJECT.md first.

## ${label} rules
- On session start, read: \`PROJECT.md\` -> \`docs/AI_TOOLING.md\` -> \`GLOBAL_CONTEXT.md\` -> \`REQUIREMENTS.md\`.
- Before editing a repository, also read that repository's \`PROJECT.md\` and \`docs/ACTIVE_CONTEXT.md\`.
- Keep project truth in \`PROJECT.md\` and \`docs/\`; \`${wrapperFile}\` is only the ${label}-specific overlay.
- Treat \`${wrapperFile}\` as a thin adapter over the shared project constitution.
${providerSpecificLine}
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
- During substantive progress updates, include a short checklist of done / remaining work and a rough remaining-time estimate by default.
`;
  }

  return `# Read PROJECT.md first.

## ${label} rules
- On session start, read: \`PROJECT.md\` -> \`docs/AI_TOOLING.md\` -> \`docs/ACTIVE_CONTEXT.md\` -> \`docs/REQUIREMENTS.md\` -> \`docs/ROADMAP.md\`.
- Keep project truth in \`PROJECT.md\` and \`docs/\`; \`${wrapperFile}\` is only the ${label}-specific overlay.
- Treat \`${wrapperFile}\` as a thin adapter over the shared project constitution.
${providerSpecificLine}
- During substantive progress updates, include a short checklist of done / remaining work and a rough remaining-time estimate by default.
`;
}
