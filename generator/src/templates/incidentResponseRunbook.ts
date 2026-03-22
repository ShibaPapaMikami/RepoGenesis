import type { ProjectBrief } from '../schema';

export function generateIncidentResponseRunbook(brief: ProjectBrief): string {
  return `# incident-response.md

## Purpose
Coordinate response work when ${brief.project.name} has an operational or security incident.

## Severity guide
- SEV-1: Broad outage, data loss risk, or active security event.
- SEV-2: Major feature degraded, workaround exists, or repeated customer impact.
- SEV-3: Limited impact, internal-only degradation, or support issue without sustained outage.

## First response
1. Name the incident lead.
2. Record start time, affected surface, and current symptoms.
3. Decide severity and communication channel.
4. Preserve evidence.
   - Error logs
   - Audit trail
   - Recent deploy or config change
   - External dependency status

## Containment
- Stop or limit the blast radius.
- Disable the failing feature, revert the deploy, or isolate the dependency if needed.
- If credentials may be compromised, rotate them and invalidate sessions.

## Recovery
- Restore the primary workflow first.
- Use \`docs/runbooks/rollback.md\` when rollback is the safest path.
- Run \`docs/runbooks/production-checks.md\` before declaring recovery complete.

## Communication
- Keep an incident timeline with decisions and owners.
- Record customer-facing updates separately from internal debugging notes.
- Capture which dependency owners or vendors were contacted.

## Aftercare
- Publish a brief incident summary.
- Open follow-up tasks for monitoring, tests, docs, or architecture changes.
- Review whether \`SECURITY.md\`, \`.env.example\`, or the planning docs should change.
`;
}
