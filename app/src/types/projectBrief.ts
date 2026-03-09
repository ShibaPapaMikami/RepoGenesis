import type { Domain, PrimaryLanguage, AiTool, SecurityLevel, RepoType, RepoKind } from '../constants/enums';
import type { LegacyAiTool } from '../utils/aiTools';
import type { SupportedSpecVersion } from '../constants/spec';

export interface ProjectInfo {
  name: string;
  slug: string;
  description: string;
  owner: string;
  created_at?: string;
}

export interface TechInfo {
  domains: Domain[];
  primary_language: PrimaryLanguage;
  frameworks: string[];
  ai_tools: AiTool[];
  ai_tool: LegacyAiTool;
  ai_tool_detail: string;
}

export interface SecurityInfo {
  level: SecurityLevel;
  has_api_keys: boolean;
  has_user_data: boolean;
  has_payment_data: boolean;
  has_ip_sensitive: boolean;
  has_credentials: boolean;
}

export interface RepoEntry {
  name: string;
  type: RepoKind;
  description: string;
  owner: string;
  depends_on: string[];
}

export interface StructureInfo {
  repo_type: RepoType;
  repos: RepoEntry[];
}

export interface WorkflowInfo {
  phases_count: number;
}

export interface ProjectBrief {
  project: ProjectInfo;
  tech: TechInfo;
  security: SecurityInfo;
  structure: StructureInfo;
  workflow: WorkflowInfo;
}

export interface ProjectSpec extends ProjectBrief {
  specVersion: SupportedSpecVersion;
}
