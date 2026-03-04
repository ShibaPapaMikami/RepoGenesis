import { SUPPORTED_SPEC_VERSION } from '../constants/spec.ts';
import type { FormState } from '../state/actions.ts';
import type { ProjectSpec } from '../types/projectBrief.ts';

export function buildProjectSpec(state: FormState): ProjectSpec {
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
      ai_tool: state.tech.ai_tool,
      ai_tool_detail: state.tech.ai_tool_detail,
    },
    security: {
      level: state.security.level,
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
  };
}

export function stringifyProjectSpec(state: FormState): string {
  return JSON.stringify(buildProjectSpec(state), null, 2);
}
