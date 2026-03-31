import type { ProjectBrief } from '../schema';
import { hasOperatorFacingWebUi } from '../templateSignals';

export function generateVersioningStandard(brief: ProjectBrief): string {
  const webUiBlock = hasOperatorFacingWebUi(brief)
    ? `### 6. Preferred web UI label
- For operator-facing web UI, default placement is a small low-emphasis label in the top-right of the header.
- Preferred compact label: \`v<release> (<commit>) <deploy time>\` (for example \`v2.2.13 (b41ecc0) 6:14\`).
- Keep the label visible during active development and rollout so operators can tell whether the current screen reflects the latest deploy.
- After the product stabilizes, the label may be hidden, feature-flagged, or restricted to admins if the same runtime identity remains inspectable elsewhere.
`
    : `### 6. Optional web UI label
- If the project later adds operator-facing web UI, default placement for runtime identity is a small low-emphasis label in the top-right of the header.
- Preferred compact label: \`v<release> (<commit>) <deploy time>\`.
- The label may be hidden, feature-flagged, or restricted to admins after launch, as long as runtime identity remains inspectable elsewhere.
`;

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
  - deploy or publication time
  - environment
- If the identity is shown in UI, prefer a compact low-emphasis label such as \`v2.2.13 (4094d23) 6:14\`.
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

${webUiBlock}

### 7. Minimum operational requirement
- Operators must be able to answer:
  - What release is running?
  - What commit is running?
  - When was this deploy or publication made visible?
  - Which environment is affected?
`;
}
