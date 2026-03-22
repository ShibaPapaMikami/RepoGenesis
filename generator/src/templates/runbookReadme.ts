import type { ProjectBrief } from '../schema';

export function generateRunbookReadme(brief: ProjectBrief): string {
  return `# Runbooks

## Purpose
Store operational procedures for ${brief.project.name}.

## Generated baseline
- \`production-bootstrap.md\`: production target, ownership, and secret inventory before first deploy
- \`production-cutover.md\`: first deployment checklist and stop conditions
- \`production-checks.md\`: repeatable pre/post-deploy verification checklist
- \`rollback.md\`: release rollback steps and data integrity notes
- \`incident-response.md\`: severity, containment, recovery, and follow-up flow
- \`skill-install.md\`: selected skill installation handoff for AI tooling

## How to maintain these runbooks
- Keep them aligned with \`docs/TECH_DECISIONS.md\`, \`docs/EXTERNAL_DEPENDENCIES.md\`, \`.env.example\`, and \`SECURITY.md\`.
- Replace placeholders with concrete deploy commands, URLs, owners, and dashboards before production use.
- Re-run \`repogenesis doctor --project <project-root>\` after major structural edits so generated docs stay coherent.
`;
}
