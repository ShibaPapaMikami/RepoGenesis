import { SUPPORTED_SPEC_VERSION } from '../constants/spec.ts';
import type { FormState } from '../state/actions.ts';
import type { ProjectSpec } from '../types/projectBrief.ts';
import { deriveLegacyAiTool, deriveLegacyAiToolDetail, normalizeAiTools } from './aiTools.ts';
import { calculateMinSecurityLevel } from './securityCalc.ts';

const SECURITY_ORDER = ['low', 'medium', 'high'] as const;

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
      primary_language: state.tech.primary_language,
      frameworks: state.tech.frameworks,
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
