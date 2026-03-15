import type { AiTool } from '../constants/enums.ts';

export type SkillProvider = 'codex' | 'claude_code' | 'gemini_cli' | 'tool_agnostic';
export type SkillSourceType = 'official' | 'curated' | 'internal';
export type SkillRiskLevel = 'low' | 'medium' | 'high';

export interface SkillCatalogItem {
  id: string;
  name: string;
  description: string;
  owner: string;
  version: string;
  sourceType: SkillSourceType;
  riskLevel: SkillRiskLevel;
  providers: SkillProvider[];
  tags: string[];
}

export const SKILL_CATALOG: SkillCatalogItem[] = [
  {
    id: 'repo-readiness-review',
    name: 'Repo Readiness Review',
    description: '生成前後に、構成の抜け・仮置き・運用ギャップをレビューする skill です。',
    owner: 'repogenesis',
    version: '0.1.0',
    sourceType: 'curated',
    riskLevel: 'low',
    providers: ['codex', 'claude_code', 'gemini_cli'],
    tags: ['review', 'readiness', 'repogenesis'],
  },
];

export function mapAiToolToSkillProvider(tool: AiTool): SkillProvider | null {
  switch (tool) {
    case 'codex':
      return 'codex';
    case 'claude_code':
      return 'claude_code';
    case 'gemini_cli':
      return 'gemini_cli';
    default:
      return null;
  }
}

export function getRecommendedSkills(aiTools: AiTool[]): SkillCatalogItem[] {
  const activeProviders = new Set(
    aiTools
      .map(mapAiToolToSkillProvider)
      .filter((provider): provider is SkillProvider => provider !== null),
  );

  return SKILL_CATALOG.filter((item) =>
    item.providers.some((provider) => provider === 'tool_agnostic' || activeProviders.has(provider)),
  );
}
