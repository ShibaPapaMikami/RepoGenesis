import type { ProjectBrief } from '../schema';

export function generateAdrTemplate(_brief: ProjectBrief): string {
  return `# ADR-XXXX: [Title]

## Status
Proposed | Accepted | Deprecated | Superseded

## Date
YYYY-MM-DD

## Context
What is the issue that we're seeing that is motivating this decision or change?

## Decision
What is the change that we're proposing and/or doing?

## Consequences
### Positive
- ...

### Negative
- ...

## Alternatives Considered
- ...
`;
}
