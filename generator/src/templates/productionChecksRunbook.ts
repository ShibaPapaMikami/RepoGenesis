import type { ProjectBrief } from '../schema';

export function generateProductionChecksRunbook(brief: ProjectBrief): string {
  const repoScope = brief.structure.repo_type === 'multi'
    ? 'workspace root plus each deployable repository'
    : 'repository root';

  return `# production-checks.md

## Purpose
Provide a repeatable verification checklist for ${brief.project.name} after deploys and during support work.

## Before deploy
- Run \`repogenesis doctor --project <project-root>\`.
- Confirm generated docs under ${repoScope} still reflect the intended release.
- Confirm adopted dependencies in \`docs/EXTERNAL_DEPENDENCIES.md\` are reachable.
- Confirm all required env vars from \`.env.example\` exist in the target environment.
- Confirm rollback target is known before starting.

## After deploy
- Entry URL returns the expected status code.
- Authentication flow works, if present.
- A representative read path succeeds.
- A representative write path succeeds.
- Background jobs, queues, cron, or notifications run as expected, if present.
- Logs, metrics, and error tracking receive fresh traffic.
- Any external dependency with outbound data flow is verified once.

## Operational evidence
- Release version / commit
- Time window checked
- Operator
- Links to logs, dashboards, or incident notes

## When to escalate
- Primary workflow fails after deploy.
- Auth or permissions behave differently from the documented expectations.
- Error rate spikes or logs stop arriving.
- Data integrity is unclear after a deploy or migration.
`;
}
