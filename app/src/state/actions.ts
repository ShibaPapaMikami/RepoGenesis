import type {
  Domain,
  PrimaryLanguage,
  AiTool,
  SecurityLevel,
  RepoType,
  RepoKind,
  TechDecisionStatus,
  DependencyCategory,
} from '../constants/enums';

export type FormAction =
  // Project
  | { type: 'SET_PROJECT_NAME'; payload: string }
  | { type: 'SET_PROJECT_SLUG'; payload: string }
  | { type: 'SET_PROJECT_DESCRIPTION'; payload: string }
  | { type: 'SET_PROJECT_OWNER'; payload: string }
  // Tech
  | { type: 'TOGGLE_DOMAIN'; payload: Domain }
  | { type: 'SET_PRIMARY_LANGUAGE'; payload: PrimaryLanguage }
  | { type: 'SET_FRAMEWORKS'; payload: string[] }
  | { type: 'TOGGLE_AI_TOOL'; payload: AiTool }
  | { type: 'SET_AI_TOOL_DETAIL'; payload: string }
  // Security
  | { type: 'SET_HAS_API_KEYS'; payload: boolean }
  | { type: 'SET_HAS_USER_DATA'; payload: boolean }
  | { type: 'SET_HAS_PAYMENT_DATA'; payload: boolean }
  | { type: 'SET_HAS_IP_SENSITIVE'; payload: boolean }
  | { type: 'SET_HAS_CREDENTIALS'; payload: boolean }
  | { type: 'SET_SECURITY_LEVEL_OVERRIDE'; payload: SecurityLevel }
  // Structure
  | { type: 'SET_REPO_TYPE'; payload: RepoType }
  | { type: 'ADD_REPO' }
  | { type: 'REMOVE_REPO'; payload: number }
  | { type: 'SET_REPO_NAME'; payload: { index: number; value: string } }
  | { type: 'SET_REPO_KIND'; payload: { index: number; value: RepoKind } }
  | { type: 'SET_REPO_DESCRIPTION'; payload: { index: number; value: string } }
  | { type: 'SET_REPO_OWNER'; payload: { index: number; value: string } }
  | { type: 'SET_REPO_DEPENDS_ON'; payload: { index: number; value: string[] } }
  // Workflow
  | { type: 'SET_PHASES_COUNT'; payload: number }
  // Planning
  | { type: 'ADD_TECH_DECISION' }
  | { type: 'REMOVE_TECH_DECISION'; payload: number }
  | {
    type: 'SET_TECH_DECISION_FIELD';
    payload: {
      index: number;
      field: 'topic' | 'choice' | 'status' | 'rationale' | 'decision_date' | 'notes';
      value: string;
    };
  }
  | { type: 'ADD_EXTERNAL_DEPENDENCY' }
  | { type: 'REMOVE_EXTERNAL_DEPENDENCY'; payload: number }
  | {
    type: 'SET_EXTERNAL_DEPENDENCY_FIELD';
    payload: {
      index: number;
      field: 'name' | 'category' | 'status' | 'purpose' | 'owner' | 'source' | 'license' | 'notes';
      value: string;
    };
  }
  | { type: 'SET_EXTERNAL_DEPENDENCY_ENV_VARS'; payload: { index: number; value: string[] } }
  | { type: 'SET_EXTERNAL_DEPENDENCY_DATA_OUTBOUND'; payload: { index: number; value: boolean } }
  // Meta
  | { type: 'RESTORE_DRAFT'; payload: FormState }
  | { type: 'RESET' };

export interface FormState {
  project: {
    name: string;
    slug: string;
    description: string;
    owner: string;
  };
  tech: {
    domains: Domain[];
    primary_language: PrimaryLanguage;
    frameworks: string[];
    ai_tools: AiTool[];
    ai_tool_detail: string;
  };
  security: {
    level: SecurityLevel;
    has_api_keys: boolean;
    has_user_data: boolean;
    has_payment_data: boolean;
    has_ip_sensitive: boolean;
    has_credentials: boolean;
  };
  structure: {
    repo_type: RepoType;
    repos: {
      name: string;
      type: RepoKind;
      description: string;
      owner: string;
      depends_on: string[];
    }[];
  };
  workflow: {
    phases_count: number;
  };
  planning: {
    tech_decisions: {
      topic: string;
      choice: string;
      status: TechDecisionStatus;
      rationale: string;
      decision_date: string;
      notes: string;
    }[];
    external_dependencies: {
      name: string;
      category: DependencyCategory;
      status: TechDecisionStatus;
      purpose: string;
      owner: string;
      source: string;
      license: string;
      env_vars: string[];
      data_outbound: boolean;
      notes: string;
    }[];
  };
  slugManuallyEdited: boolean;
  securityLevelOverride: SecurityLevel | null;
}
