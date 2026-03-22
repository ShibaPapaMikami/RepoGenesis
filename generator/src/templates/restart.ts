import type { ProjectBrief } from '../schema';
import { buildToolWrapperExampleClause } from '../aiTools';

interface GenerateRestartOptions {
  scope?: 'single' | 'workspace' | 'repo';
}

export function generateRestart(brief: ProjectBrief, options: GenerateRestartOptions = {}): string {
  const scope = options.scope ?? (brief.structure.repo_type === 'multi' ? 'workspace' : 'single');
  const aiToolingPath = scope === 'repo' ? '../docs/AI_TOOLING.md' : 'docs/AI_TOOLING.md';
  const globalContextPath = scope === 'repo' ? '../GLOBAL_CONTEXT.md' : 'GLOBAL_CONTEXT.md';

  return `# Session Restart Protocol

When starting a new session or restarting, follow these steps:

## Step 1: Read Constitution
\`\`\`
Read PROJECT.md
Read ${aiToolingPath} if it exists
Read the tool-specific wrapper if present${buildToolWrapperExampleClause(brief.tech)}
\`\`\`

## Step 2: Read Current State
\`\`\`
Read docs/ACTIVE_CONTEXT.md if it exists
Read ${globalContextPath} or ../GLOBAL_CONTEXT.md if it exists
\`\`\`

## Step 3: Summarize
Before taking any action, summarize:
- Current phase
- What has been done
- What is being done now
- What is blocked
- What is the next step

## Step 4: Confirm
State your summary and wait for user confirmation before proceeding.

## Rules
- Do not infer or guess project state.
- If ACTIVE_CONTEXT.md conflicts with conversation, the file wins.
- Always re-read files — do not rely on memory from previous sessions.
`;
}
