import { SUPPORTED_SPEC_VERSION } from '../constants/spec.ts';
import type { FormState } from '../state/actions.ts';
import type { ProjectSpec } from '../types/projectBrief.ts';
import { deriveLegacyAiTool, deriveLegacyAiToolDetail, normalizeAiTools } from './aiTools.ts';
import { calculateMinSecurityLevel } from './securityCalc.ts';

const SECURITY_ORDER = ['low', 'medium', 'high'] as const;
type CanonicalPrimaryLanguage = ProjectSpec['tech']['primary_language'];

function normalizePrimaryLanguageName(value: string): CanonicalPrimaryLanguage | null {
  const normalized = value.trim().toLowerCase().replace(/[()（）「」『』[\]]/g, ' ');
  if (!normalized) return null;

  if (/\btypescript\b|type\s*script/.test(normalized)) return 'typescript';
  if (/\bpython\b|python\s*3/.test(normalized)) return 'python';
  if (/\bc#\b|\bcsharp\b|c\s*sharp/.test(normalized)) return 'csharp';
  if (/\bswift\b/.test(normalized)) return 'swift';
  if (/\bgo\b|golang/.test(normalized)) return 'go';
  if (/\brust\b/.test(normalized)) return 'rust';
  if (/\bkotlin\b/.test(normalized)) return 'kotlin';
  if (/その他|other/.test(normalized)) return 'other';
  return null;
}

function parsePrimaryLanguageChoices(value: string): CanonicalPrimaryLanguage[] {
  return value
    .split(/\s*(?:、|,|\/|\n|\s+\+\s+|\s+＆\s+|\s*&\s+|\sand\s)\s*/i)
    .map((part) => normalizePrimaryLanguageName(part))
    .filter((language): language is CanonicalPrimaryLanguage => language !== null)
    .filter((language, index, list) => list.indexOf(language) === index);
}

function normalizeFrameworkName(value: string): string {
  const normalized = value.trim().replace(/[()（）「」『』[\]]/g, '');
  if (!normalized) return '';

  const lowered = normalized.toLowerCase();
  if (/^next(?:\.js|js)?$/.test(lowered)) return 'Next.js';
  if (/^fast\s*api$/.test(lowered) || lowered === 'fastapi') return 'FastAPI';
  if (/^react$/.test(lowered)) return 'React';
  if (/^vite$/.test(lowered)) return 'Vite';
  if (/^typer$/.test(lowered)) return 'Typer';
  if (/^nuxt(?:\.js|js)?$/.test(lowered)) return 'Nuxt.js';
  if (/^vue(?:\.js|js)?$/.test(lowered)) return 'Vue.js';
  if (/^svelte\s*kit$/.test(lowered) || lowered === 'sveltekit') return 'SvelteKit';
  return normalized;
}

function parseFrameworkChoices(value: string): string[] {
  return value
    .split(/\s*(?:、|,|\/|\n|\s+\+\s+|\s+＆\s+|\s*&\s+|\sand\s)\s*/i)
    .map((part) => normalizeFrameworkName(part))
    .filter(Boolean)
    .filter((framework, index, list) => list.indexOf(framework) === index);
}

function resolvePrimaryLanguage(state: FormState): ProjectSpec['tech']['primary_language'] {
  const planningPrimaryLanguage = state.planning.tech_decisions
    .filter((item) => item.topic === 'Primary language')
    .flatMap((item) => parsePrimaryLanguageChoices(item.choice))[0];

  return planningPrimaryLanguage ?? state.tech.primary_language;
}

function resolveFrameworks(state: FormState): string[] {
  if (state.tech.frameworks.length > 0) {
    return state.tech.frameworks.map((framework) => normalizeFrameworkName(framework)).filter(Boolean);
  }

  return state.planning.tech_decisions
    .filter((item) => item.topic === 'Framework')
    .flatMap((item) => parseFrameworkChoices(item.choice))
    .filter((framework, index, list) => list.indexOf(framework) === index);
}

function resolveSecurityLevel(state: FormState): ProjectSpec['security']['level'] {
  const minimum = calculateMinSecurityLevel(state.security);
  const candidate = state.securityLevelOverride ?? state.security.level;
  const minimumIndex = SECURITY_ORDER.indexOf(minimum);
  const candidateIndex = SECURITY_ORDER.indexOf(candidate);
  return SECURITY_ORDER[Math.max(minimumIndex, candidateIndex)];
}

export function buildProjectSpec(state: FormState): ProjectSpec {
  const aiTools = normalizeAiTools(state.tech.ai_tools);
  const securityLevel = resolveSecurityLevel(state);
  const primaryLanguage = resolvePrimaryLanguage(state);
  const frameworks = resolveFrameworks(state);
  return {
    specVersion: SUPPORTED_SPEC_VERSION,
    project: {
      name: state.project.name,
      slug: state.project.slug,
      description: state.project.description,
      owner: state.project.owner,
      created_at: new Date().toISOString(),
    },
    tech: {
      domains: state.tech.domains,
      primary_language: primaryLanguage,
      frameworks,
      ai_tools: aiTools,
      ai_tool: deriveLegacyAiTool(aiTools),
      ai_tool_detail: deriveLegacyAiToolDetail(aiTools, state.tech.ai_tool_detail),
    },
    security: {
      level: securityLevel,
      has_api_keys: state.security.has_api_keys,
      has_user_data: state.security.has_user_data,
      has_payment_data: state.security.has_payment_data,
      has_ip_sensitive: state.security.has_ip_sensitive,
      has_credentials: state.security.has_credentials,
    },
    structure: {
      repo_type: state.structure.repo_type,
      repos: state.structure.repos.map((r) => ({
        name: r.name,
        type: r.type,
        description: r.description,
        owner: r.owner,
        depends_on: r.depends_on,
      })),
    },
    workflow: {
      phases_count: state.workflow.phases_count,
    },
    planning: {
      tech_decisions: state.planning.tech_decisions.map((item) => ({
        topic: item.topic,
        choice: item.choice,
        status: item.status,
        rationale: item.rationale,
        decision_date: item.decision_date,
        notes: item.notes,
      })),
      external_dependencies: state.planning.external_dependencies.map((item) => ({
        name: item.name,
        category: item.category,
        status: item.status,
        purpose: item.purpose,
        owner: item.owner,
        source: item.source,
        license: item.license,
        env_vars: item.env_vars,
        data_outbound: item.data_outbound,
        notes: item.notes,
      })),
    },
  };
}

export function stringifyProjectSpec(state: FormState): string {
  return JSON.stringify(buildProjectSpec(state), null, 2);
}
