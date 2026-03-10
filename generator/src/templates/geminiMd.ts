import type { ProjectBrief } from '../schema';

interface RepoEntry {
  name: string;
}

interface GenerateGeminiMdOptions {
  scope?: 'single' | 'workspace' | 'repo';
  repo?: RepoEntry;
}

export function generateGeminiMd(
  _brief: ProjectBrief,
  options: GenerateGeminiMdOptions = {},
): string {
  const scope = options.scope ?? 'single';

  if (scope === 'workspace') {
    return `# Read PROJECT.md first.

## Gemini CLI rules
- On session start, read: \`PROJECT.md\` -> \`GLOBAL_CONTEXT.md\` -> \`REQUIREMENTS.md\`.
- Before editing a repository, also read that repository's \`PROJECT.md\` and \`docs/ACTIVE_CONTEXT.md\`.
- Keep project truth in \`PROJECT.md\` and \`docs/\`; this file is only Gemini-specific behavior.
`;
  }

  if (scope === 'repo' && options.repo) {
    return `# Read PROJECT.md first.

## Gemini CLI rules
- On session start, read: \`PROJECT.md\` -> \`docs/ACTIVE_CONTEXT.md\` -> \`../GLOBAL_CONTEXT.md\`.
- This file contains Gemini-specific workflow only. Project truth lives in \`PROJECT.md\` and \`docs/\`.
- If work changes another repository, return to \`../GLOBAL_CONTEXT.md\` and update both repositories' context files.
`;
  }

  return `# Read PROJECT.md first.

## Gemini CLI rules
- On session start, read: \`PROJECT.md\` -> \`docs/ACTIVE_CONTEXT.md\` -> \`docs/REQUIREMENTS.md\` -> \`docs/ROADMAP.md\`.
- Keep project truth in \`PROJECT.md\` and \`docs/\`; this file is only Gemini-specific behavior.
`;
}
