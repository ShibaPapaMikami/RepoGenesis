import type { ProjectBrief } from '../schema';
import { buildToolWrapperExampleClause } from '../aiTools';

export function generateRestart(brief: ProjectBrief): string {
  return `# Session Restart Protocol

When starting a new session or restarting, follow these steps:

## Step 1: Read Constitution
\`\`\`
Read PROJECT.md
Read the tool-specific wrapper if present${buildToolWrapperExampleClause(brief.tech)}
\`\`\`

## Step 2: Read Current State
\`\`\`
Read docs/ACTIVE_CONTEXT.md if it exists
Read GLOBAL_CONTEXT.md or ../GLOBAL_CONTEXT.md if it exists
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
