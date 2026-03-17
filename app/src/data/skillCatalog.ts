import type { AiTool } from '../constants/enums.ts';

export type SkillProvider = 'codex' | 'claude_code' | 'gemini_cli' | 'tool_agnostic';
export type SkillSourceType = 'official' | 'curated' | 'internal';
export type SkillRiskLevel = 'low' | 'medium' | 'high';
export type SkillProviderSupportType = 'official' | 'curated';

export interface SkillProviderSupport {
  provider: SkillProvider;
  supportType: SkillProviderSupportType;
}

export interface SkillCatalogItem {
  id: string;
  name: string;
  description: string;
  owner: string;
  version: string;
  sourceType: SkillSourceType;
  sourceLabel: string;
  sourceUrl?: string;
  riskLevel: SkillRiskLevel;
  providers: SkillProvider[];
  providerSupport: SkillProviderSupport[];
  tags: string[];
}

export const SKILL_PROVIDER_LABELS: Record<SkillProvider, string> = {
  codex: 'Codex',
  claude_code: 'Claude Code',
  gemini_cli: 'Gemini CLI',
  tool_agnostic: '共通',
};

export const SKILL_PROVIDER_SUPPORT_LABELS: Record<SkillProviderSupportType, string> = {
  official: '公式',
  curated: 'RepoGenesis対応',
};

export const SKILL_CATALOG: SkillCatalogItem[] = [
  {
    id: 'repo-readiness-review',
    name: 'Repo Readiness Review',
    description: '生成前後に、構成の抜け・仮置き・運用ギャップをレビューする skill です。',
    owner: 'repogenesis',
    version: '0.1.0',
    sourceType: 'curated',
    sourceLabel: 'RepoGenesis curated',
    riskLevel: 'low',
    providers: ['codex', 'claude_code', 'gemini_cli'],
    providerSupport: [
      { provider: 'codex', supportType: 'curated' },
      { provider: 'claude_code', supportType: 'curated' },
      { provider: 'gemini_cli', supportType: 'curated' },
    ],
    tags: ['review', 'readiness', 'repogenesis'],
  },
  {
    id: 'gh-fix-ci',
    name: 'GH Fix CI',
    description: 'GitHub Actions の失敗ジョブを切り分けて、最小修正へ進める skill です。',
    owner: 'openai',
    version: '0.1.0',
    sourceType: 'official',
    sourceLabel: 'OpenAI official skills',
    sourceUrl: 'https://github.com/openai/skills/tree/main/skills/.curated/gh-fix-ci',
    riskLevel: 'low',
    providers: ['codex', 'claude_code', 'gemini_cli'],
    providerSupport: [
      { provider: 'codex', supportType: 'official' },
      { provider: 'claude_code', supportType: 'curated' },
      { provider: 'gemini_cli', supportType: 'curated' },
    ],
    tags: ['github', 'ci', 'review', 'ops'],
  },
  {
    id: 'playwright',
    name: 'Playwright Browser QA',
    description: 'ブラウザ操作と画面確認をまとめて進める UI QA 向け skill です。',
    owner: 'openai',
    version: '0.1.0',
    sourceType: 'official',
    sourceLabel: 'OpenAI official skills',
    sourceUrl: 'https://github.com/openai/skills/tree/main/skills/.curated/playwright',
    riskLevel: 'low',
    providers: ['codex', 'claude_code', 'gemini_cli'],
    providerSupport: [
      { provider: 'codex', supportType: 'official' },
      { provider: 'claude_code', supportType: 'curated' },
      { provider: 'gemini_cli', supportType: 'curated' },
    ],
    tags: ['browser', 'qa', 'playwright', 'frontend'],
  },
  {
    id: 'vercel-deploy',
    name: 'Vercel Deploy Check',
    description: 'Vercel 向けの build / env / production deploy 確認を進める skill です。',
    owner: 'openai',
    version: '0.1.0',
    sourceType: 'official',
    sourceLabel: 'OpenAI official skills',
    sourceUrl: 'https://github.com/openai/skills/tree/main/skills/.curated/vercel-deploy',
    riskLevel: 'medium',
    providers: ['codex', 'claude_code', 'gemini_cli'],
    providerSupport: [
      { provider: 'codex', supportType: 'official' },
      { provider: 'claude_code', supportType: 'curated' },
      { provider: 'gemini_cli', supportType: 'curated' },
    ],
    tags: ['deploy', 'vercel', 'ops', 'frontend'],
  },
  {
    id: 'render-deploy',
    name: 'Render Deploy Check',
    description: 'Render 向けの service 設定・healthcheck・deploy 確認を進める skill です。',
    owner: 'openai',
    version: '0.1.0',
    sourceType: 'official',
    sourceLabel: 'OpenAI official skills',
    sourceUrl: 'https://github.com/openai/skills/tree/main/skills/.curated/render-deploy',
    riskLevel: 'medium',
    providers: ['codex', 'claude_code', 'gemini_cli'],
    providerSupport: [
      { provider: 'codex', supportType: 'official' },
      { provider: 'claude_code', supportType: 'curated' },
      { provider: 'gemini_cli', supportType: 'curated' },
    ],
    tags: ['deploy', 'render', 'ops', 'backend'],
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

export function formatProviderSupportLabel(entry: SkillProviderSupport): string {
  return `${SKILL_PROVIDER_LABELS[entry.provider]}: ${SKILL_PROVIDER_SUPPORT_LABELS[entry.supportType]}`;
}

export function getRecommendedSkills(aiTools: AiTool[]): SkillCatalogItem[] {
  const activeProviders = new Set(
    aiTools
      .map(mapAiToolToSkillProvider)
      .filter((provider): provider is SkillProvider => provider !== null),
  );

  if (activeProviders.size === 0) {
    return [...SKILL_CATALOG];
  }

  return SKILL_CATALOG.filter((item) =>
    item.providers.includes('tool_agnostic')
    || item.providers.some((provider) => activeProviders.has(provider)),
  );
}
