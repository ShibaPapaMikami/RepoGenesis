import type { ProjectBrief } from '../schema';
import { formatAiTools, formatToolWrapperFiles, getToolWrapperFiles } from '../aiTools';

export function generateAiTooling(brief: ProjectBrief): string {
  const wrappers = getToolWrapperFiles(brief.tech);
  const toolNames = formatAiTools(brief.tech) || 'None';
  const wrapperLine = wrappers.length > 0
    ? wrappers.map((file) => `\`${file}\``).join(' / ')
    : 'None';
  const wrapperPolicy = wrappers.length > 0
    ? `- Thin wrapper files: ${formatToolWrapperFiles(brief.tech)}`
    : '- Thin wrapper files are not generated for this project.';

  return `# AI_TOOLING.md — AI Tooling Contract

## Purpose
Keep AI-tool-specific workflow guidance separate from project truth for ${brief.project.name}.

## Enabled Tooling
- Enabled AI tools: ${toolNames}
- Wrapper files generated: ${wrapperLine}
- Optional AI work guides are tracked in \`skills/README.md\` and \`repogenesis.skills.json\`.

## Rules
- \`PROJECT.md\` and \`docs/\` remain the source of truth for project state, requirements, and architecture.
${wrapperPolicy}
- Wrapper files may define provider-specific workflow preferences, but they must not replace project truth.
- If the current AI tool has no wrapper file, follow \`PROJECT.md\`, \`docs/ACTIVE_CONTEXT.md\`, and \`docs/REQUIREMENTS.md\` directly.
- Optional AI work guides should stay reviewable in the repository and must be pinned in \`repogenesis.skills.json\`.

## Session Start Order
1. Read \`PROJECT.md\`.
2. Read \`docs/AI_TOOLING.md\`.
3. Read the matching wrapper file when one exists.
4. Read \`docs/ACTIVE_CONTEXT.md\` and the planning docs before making changes.

## Update Policy
- Add or remove wrapper files only when the selected AI tools change.
- Keep wrapper-specific instructions thin and move shared rules back into \`PROJECT.md\` or \`docs/\`.
- Update \`skills/README.md\` and \`repogenesis.skills.json\` together when optional AI work guides change.
`;
}
