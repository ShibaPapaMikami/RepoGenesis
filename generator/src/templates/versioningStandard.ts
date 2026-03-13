import type { ProjectBrief } from '../schema';

export function generateVersioningStandard(brief: ProjectBrief): string {
  return `# VERSIONING_STANDARD.md

## Purpose
Define how ${brief.project.name} should expose release identity and runtime traceability.

## Rules

### 1. Stable releases must be tagged
- Stable releases use Git tags in the form \`vMAJOR.MINOR.PATCH\`.
- A stable release must correspond to a tested deployable state.

### 2. Runtime identity must be inspectable
- Deployable services must expose:
  - release version
  - commit SHA
  - environment
- The display location is implementation-specific.
- If the identity is shown in UI, prefer a compact low-emphasis label such as \`v2.2.13 (4094d23)\`.
- The requirement is observability, not a fixed UI layout.

### 3. API services
- APIs should expose version identity via:
  - \`/healthz\`
  - \`/version\`
  - response headers
  - structured logs

### 4. CLI tools
- CLI tools should support \`--version\`.
- Output should identify the release and, when possible, the commit.

### 5. Release policy
- Release version is the human-facing stable label.
- Commit SHA is the exact deployed code identity.
- Both should be retained for rollback and incident handling.

### 6. Preferred UI label
- When a web UI shows version identity, prefer the format \`v<release> (<commit>)\`.
- Keep the label visible but visually low-emphasis so it supports debugging without competing with the main product UI.

### 7. Minimum operational requirement
- Operators must be able to answer:
  - What release is running?
  - What commit is running?
  - Which environment is affected?
`;
}
