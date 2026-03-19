import type { ProjectBrief } from './schema';

const STATUS_LABELS = {
  adopted: 'Adopted',
  candidate: 'Candidate',
  open: 'Open',
  rejected: 'Rejected',
} as const;

const CATEGORY_LABELS = {
  ai_api: 'AI API',
  model: 'Model',
  external_service: 'External Service',
  oss: 'OSS',
  github_repo: 'GitHub Repository',
  npm_package: 'npm Package',
  auth: 'Authentication',
  database: 'Database',
  storage: 'Storage',
  notification: 'Notification',
  ocr: 'OCR / Document Analysis',
  batch: 'Batch / Scheduler',
  other: 'Other',
} as const;

export type PlanningStatus = ProjectBrief['planning']['tech_decisions'][number]['status'];

function normalizePlanning(brief: ProjectBrief) {
  return brief.planning ?? {
    tech_decisions: [],
    external_dependencies: [],
  };
}

export function formatPlanningStatus(status: PlanningStatus): string {
  return STATUS_LABELS[status];
}

export function formatDependencyCategory(
  category: ProjectBrief['planning']['external_dependencies'][number]['category'],
): string {
  return CATEGORY_LABELS[category];
}

export function getTechDecisionsByStatus(brief: ProjectBrief, status: PlanningStatus) {
  return normalizePlanning(brief).tech_decisions.filter((item) => item.status === status && item.topic.trim() && item.choice.trim());
}

export function getDependenciesByStatus(brief: ProjectBrief, status: PlanningStatus) {
  return normalizePlanning(brief).external_dependencies.filter((item) => item.status === status && item.name.trim());
}

export function getAdoptedEnvVars(brief: ProjectBrief): string[] {
  return Array.from(
    new Set(
      getDependenciesByStatus(brief, 'adopted').flatMap((item) => item.env_vars.map((envVar) => envVar.trim()).filter(Boolean)),
    ),
  );
}

export function getAdoptedTechSummaryLines(brief: ProjectBrief): string[] {
  return getTechDecisionsByStatus(brief, 'adopted').map((item) => `${item.topic}: ${item.choice}`);
}

export function getAdoptedDependencySummaryLines(brief: ProjectBrief): string[] {
  return getDependenciesByStatus(brief, 'adopted').map((item) =>
    `${item.name} (${formatDependencyCategory(item.category)})${item.env_vars.length > 0 ? ` / env: ${item.env_vars.join(', ')}` : ''}`,
  );
}

export function getAdoptedTechBulletLines(brief: ProjectBrief): string[] {
  return getTechDecisionsByStatus(brief, 'adopted').map((item) =>
    `- ${item.topic}: ${item.choice}${item.rationale ? ` — ${item.rationale}` : ''}`,
  );
}

export function getAdoptedDependencyBulletLines(brief: ProjectBrief): string[] {
  return getDependenciesByStatus(brief, 'adopted').map((item) => {
    const envNote = item.env_vars.length > 0 ? ` / env: ${item.env_vars.join(', ')}` : '';
    const purpose = item.purpose ? ` — ${item.purpose}` : '';
    return `- ${item.name} (${formatDependencyCategory(item.category)})${purpose}${envNote}`;
  });
}
