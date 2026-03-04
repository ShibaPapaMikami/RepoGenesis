import type { ProjectBrief } from '../schema';

export function generatePlansTemplate(_brief: ProjectBrief): string {
  return `# Plan: [Task Title]

## Objective
What is the goal of this task?

## Background
Why is this task needed? What context is relevant?

## Approach
1. Step 1
2. Step 2
3. Step 3

## Files to Create/Modify
- \`path/to/file\` — description of changes

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes
- Any additional context or constraints
`;
}
