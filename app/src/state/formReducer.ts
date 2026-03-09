import type { FormAction, FormState } from './actions';
import { slugify } from '../utils/slugify';
import { calculateMinSecurityLevel } from '../utils/securityCalc';
import type { SecurityLevel } from '../constants/enums';

export const initialFormState: FormState = {
  project: {
    name: '',
    slug: '',
    description: '',
    owner: '',
  },
  tech: {
    domains: [],
    primary_language: 'typescript',
    frameworks: [],
    ai_tools: ['claude_code'],
    ai_tool_detail: '',
  },
  security: {
    level: 'low',
    has_api_keys: false,
    has_user_data: false,
    has_payment_data: false,
    has_ip_sensitive: false,
    has_credentials: false,
  },
  structure: {
    repo_type: 'single',
    repos: [],
  },
  workflow: {
    phases_count: 3,
  },
  slugManuallyEdited: false,
  securityLevelOverride: null,
};

const SECURITY_ORDER: SecurityLevel[] = ['low', 'medium', 'high'];

function resolveSecurityLevel(
  minLevel: SecurityLevel,
  override: SecurityLevel | null,
): SecurityLevel {
  const minIndex = SECURITY_ORDER.indexOf(minLevel);
  if (override === null) return minLevel;
  const overrideIndex = SECURITY_ORDER.indexOf(override);
  return overrideIndex >= minIndex ? override : minLevel;
}

function recalcSecurityLevel(state: FormState): FormState {
  const minLevel = calculateMinSecurityLevel(state.security);
  const level = resolveSecurityLevel(minLevel, state.securityLevelOverride);
  return {
    ...state,
    security: { ...state.security, level },
  };
}

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    // Project
    case 'SET_PROJECT_NAME': {
      const newSlug = state.slugManuallyEdited ? state.project.slug : slugify(action.payload);
      return {
        ...state,
        project: { ...state.project, name: action.payload, slug: newSlug },
      };
    }
    case 'SET_PROJECT_SLUG':
      return {
        ...state,
        project: { ...state.project, slug: action.payload },
        slugManuallyEdited: true,
      };
    case 'SET_PROJECT_DESCRIPTION':
      return {
        ...state,
        project: { ...state.project, description: action.payload },
      };
    case 'SET_PROJECT_OWNER':
      return {
        ...state,
        project: { ...state.project, owner: action.payload },
      };

    // Tech
    case 'TOGGLE_DOMAIN': {
      const domains = state.tech.domains.includes(action.payload)
        ? state.tech.domains.filter((d) => d !== action.payload)
        : [...state.tech.domains, action.payload];
      return { ...state, tech: { ...state.tech, domains } };
    }
    case 'SET_PRIMARY_LANGUAGE':
      return { ...state, tech: { ...state.tech, primary_language: action.payload } };
    case 'SET_FRAMEWORKS':
      return { ...state, tech: { ...state.tech, frameworks: action.payload } };
    case 'TOGGLE_AI_TOOL': {
      const ai_tools = state.tech.ai_tools.includes(action.payload)
        ? state.tech.ai_tools.filter((tool) => tool !== action.payload)
        : [...state.tech.ai_tools, action.payload];
      return {
        ...state,
        tech: {
          ...state.tech,
          ai_tools,
          ai_tool_detail: ai_tools.includes('other') ? state.tech.ai_tool_detail : '',
        },
      };
    }
    case 'SET_AI_TOOL_DETAIL':
      return { ...state, tech: { ...state.tech, ai_tool_detail: action.payload } };

    // Security
    case 'SET_HAS_API_KEYS':
      return recalcSecurityLevel({
        ...state,
        security: { ...state.security, has_api_keys: action.payload },
      });
    case 'SET_HAS_USER_DATA':
      return recalcSecurityLevel({
        ...state,
        security: { ...state.security, has_user_data: action.payload },
      });
    case 'SET_HAS_PAYMENT_DATA':
      return recalcSecurityLevel({
        ...state,
        security: { ...state.security, has_payment_data: action.payload },
      });
    case 'SET_HAS_IP_SENSITIVE':
      return recalcSecurityLevel({
        ...state,
        security: { ...state.security, has_ip_sensitive: action.payload },
      });
    case 'SET_HAS_CREDENTIALS':
      return recalcSecurityLevel({
        ...state,
        security: { ...state.security, has_credentials: action.payload },
      });
    case 'SET_SECURITY_LEVEL_OVERRIDE':
      return recalcSecurityLevel({
        ...state,
        securityLevelOverride: action.payload,
      });

    // Structure
    case 'SET_REPO_TYPE':
      return { ...state, structure: { ...state.structure, repo_type: action.payload } };
    case 'ADD_REPO':
      return {
        ...state,
        structure: {
          ...state.structure,
          repos: [
            ...state.structure.repos,
            { name: '', type: 'frontend', description: '', owner: '', depends_on: [] },
          ],
        },
      };
    case 'REMOVE_REPO':
      return {
        ...state,
        structure: {
          ...state.structure,
          repos: state.structure.repos.filter((_, i) => i !== action.payload),
        },
      };
    case 'SET_REPO_NAME': {
      const repos = state.structure.repos.map((r, i) =>
        i === action.payload.index ? { ...r, name: action.payload.value } : r,
      );
      return { ...state, structure: { ...state.structure, repos } };
    }
    case 'SET_REPO_KIND': {
      const repos = state.structure.repos.map((r, i) =>
        i === action.payload.index ? { ...r, type: action.payload.value } : r,
      );
      return { ...state, structure: { ...state.structure, repos } };
    }
    case 'SET_REPO_DESCRIPTION': {
      const repos = state.structure.repos.map((r, i) =>
        i === action.payload.index ? { ...r, description: action.payload.value } : r,
      );
      return { ...state, structure: { ...state.structure, repos } };
    }
    case 'SET_REPO_OWNER': {
      const repos = state.structure.repos.map((r, i) =>
        i === action.payload.index ? { ...r, owner: action.payload.value } : r,
      );
      return { ...state, structure: { ...state.structure, repos } };
    }
    case 'SET_REPO_DEPENDS_ON': {
      const repos = state.structure.repos.map((r, i) =>
        i === action.payload.index ? { ...r, depends_on: action.payload.value } : r,
      );
      return { ...state, structure: { ...state.structure, repos } };
    }

    // Workflow
    case 'SET_PHASES_COUNT':
      return { ...state, workflow: { ...state.workflow, phases_count: action.payload } };

    // Meta
    case 'RESTORE_DRAFT':
      return action.payload;
    case 'RESET':
      return initialFormState;

    default:
      return state;
  }
}
