import type { ProjectBrief } from './schema';
import type { SkillProvider } from './skillsManifest';
import { generateRunbookReadme } from './templates/runbookReadme';
import { generateProductionBootstrapRunbook } from './templates/productionBootstrapRunbook';
import { generateProductionCutoverRunbook } from './templates/productionCutoverRunbook';
import { generateProductionChecksRunbook } from './templates/productionChecksRunbook';
import { generateRollbackRunbook } from './templates/rollbackRunbook';
import { generateIncidentResponseRunbook } from './templates/incidentResponseRunbook';
import { generateSkillInstallRunbook } from './templates/skillInstallRunbook';

export interface RunbookSelectedSkill {
  id: string;
  name: string;
  version: string;
  sourceType: 'official' | 'curated' | 'internal';
  providers: SkillProvider[];
}

export const DEFAULT_RUNBOOK_PATHS = [
  'docs/runbooks/README.md',
  'docs/runbooks/production-bootstrap.md',
  'docs/runbooks/production-cutover.md',
  'docs/runbooks/production-checks.md',
  'docs/runbooks/rollback.md',
  'docs/runbooks/incident-response.md',
  'docs/runbooks/skill-install.md',
] as const;

export function buildDefaultRunbookEntries(
  brief: ProjectBrief,
  selectedSkills: RunbookSelectedSkill[],
  options: { bundledAtGeneration: boolean },
): [string, string][] {
  return [
    [DEFAULT_RUNBOOK_PATHS[0], generateRunbookReadme(brief)],
    [DEFAULT_RUNBOOK_PATHS[1], generateProductionBootstrapRunbook(brief)],
    [DEFAULT_RUNBOOK_PATHS[2], generateProductionCutoverRunbook(brief)],
    [DEFAULT_RUNBOOK_PATHS[3], generateProductionChecksRunbook(brief)],
    [DEFAULT_RUNBOOK_PATHS[4], generateRollbackRunbook(brief)],
    [DEFAULT_RUNBOOK_PATHS[5], generateIncidentResponseRunbook(brief)],
    [DEFAULT_RUNBOOK_PATHS[6], generateSkillInstallRunbook(brief, selectedSkills, options)],
  ];
}
