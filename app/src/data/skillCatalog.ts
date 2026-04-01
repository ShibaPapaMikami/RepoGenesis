import type { AiTool, Domain, RepoType } from '../constants/enums.ts';

export type SkillProvider = 'codex' | 'claude_code' | 'gemini_cli' | 'tool_agnostic';
export type SkillSourceType = 'official' | 'curated' | 'internal';
export type SkillRiskLevel = 'low' | 'medium' | 'high';
export type SkillProviderSupportType = 'official' | 'curated';
export type SkillSelectionStage = 'first' | 'later';

export interface SkillProviderSupport {
  provider: SkillProvider;
  supportType: SkillProviderSupportType;
}

export interface SkillCatalogItem {
  id: string;
  name: string;
  description: string;
  whenToUse: string;
  owner: string;
  version: string;
  sourceType: SkillSourceType;
  sourceLabel: string;
  sourceUrl?: string;
  riskLevel: SkillRiskLevel;
  selectionStage: SkillSelectionStage;
  providers: SkillProvider[];
  providerSupport: SkillProviderSupport[];
  tags: string[];
}

export interface SkillRecommendationContext {
  aiTools: AiTool[];
  domains?: Domain[];
  frameworks?: string[];
  repoType?: RepoType;
  planningHints?: string[];
}

export const SKILL_PROVIDER_LABELS: Record<SkillProvider, string> = {
  codex: 'Codex',
  claude_code: 'Claude Code',
  gemini_cli: 'Gemini CLI',
  tool_agnostic: '共通',
};

export const SKILL_PROVIDER_SUPPORT_LABELS: Record<SkillProviderSupportType, string> = {
  official: '公式',
  curated: 'RepoGenesis整備',
};

export const SKILL_RISK_LABELS: Record<SkillRiskLevel, string> = {
  low: '低',
  medium: '中',
  high: '高',
};

export const SKILL_CATALOG: SkillCatalogItem[] = [
  {
    id: 'repo-readiness-review',
    name: 'Repo Readiness Review',
    description: '生成前後に、構成の抜け・仮置き・運用ギャップをレビューする skill です。',
    whenToUse: 'まず最初に、要件や構成の抜け漏れを確認したい時',
    owner: 'repogenesis',
    version: '0.1.0',
    sourceType: 'curated',
    sourceLabel: 'RepoGenesis整備',
    riskLevel: 'low',
    selectionStage: 'first',
    providers: ['codex', 'claude_code', 'gemini_cli'],
    providerSupport: [
      { provider: 'codex', supportType: 'curated' },
      { provider: 'claude_code', supportType: 'curated' },
      { provider: 'gemini_cli', supportType: 'curated' },
    ],
    tags: ['review', 'readiness', 'repogenesis'],
  },
  {
    id: 'frontend-design',
    name: 'Frontend Design Direction',
    description: '画面のトーン、タイポ、配色、レイアウトをまとめて引き上げる frontend 向け skill です。',
    whenToUse: '見た目が平坦で、UI に明確な美学や仕上げが足りない時',
    owner: 'anthropic',
    version: '0.1.0',
    sourceType: 'curated',
    sourceLabel: 'RepoGenesis整備',
    sourceUrl: 'https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md',
    riskLevel: 'low',
    selectionStage: 'later',
    providers: ['codex', 'claude_code', 'gemini_cli'],
    providerSupport: [
      { provider: 'codex', supportType: 'curated' },
      { provider: 'claude_code', supportType: 'curated' },
      { provider: 'gemini_cli', supportType: 'curated' },
    ],
    tags: ['frontend', 'design', 'ui', 'branding'],
  },
  {
    id: 'gh-fix-ci',
    name: 'GH Fix CI',
    description: 'GitHub Actions の失敗ジョブを切り分けて、最小修正へ進める skill です。',
    whenToUse: 'CI や GitHub Actions が失敗した時',
    owner: 'openai',
    version: '0.1.0',
    sourceType: 'official',
    sourceLabel: 'OpenAI公式',
    sourceUrl: 'https://github.com/openai/skills/tree/main/skills/.curated/gh-fix-ci',
    riskLevel: 'low',
    selectionStage: 'later',
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
    whenToUse: '画面の動きや表示を AI と一緒に確認したい時',
    owner: 'openai',
    version: '0.1.0',
    sourceType: 'official',
    sourceLabel: 'OpenAI公式',
    sourceUrl: 'https://github.com/openai/skills/tree/main/skills/.curated/playwright',
    riskLevel: 'low',
    selectionStage: 'later',
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
    whenToUse: 'Vercel 公開前後の状態を確認したい時',
    owner: 'openai',
    version: '0.1.0',
    sourceType: 'official',
    sourceLabel: 'OpenAI公式',
    sourceUrl: 'https://github.com/openai/skills/tree/main/skills/.curated/vercel-deploy',
    riskLevel: 'medium',
    selectionStage: 'later',
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
    whenToUse: 'Render の API や backend の公開状態を確認したい時',
    owner: 'openai',
    version: '0.1.0',
    sourceType: 'official',
    sourceLabel: 'OpenAI公式',
    sourceUrl: 'https://github.com/openai/skills/tree/main/skills/.curated/render-deploy',
    riskLevel: 'medium',
    selectionStage: 'later',
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

export function formatSkillProviderNames(skill: SkillCatalogItem): string {
  return skill.providerSupport.map((entry) => SKILL_PROVIDER_LABELS[entry.provider]).join(' / ');
}

export function formatSkillProviderSupportSummary(skill: SkillCatalogItem): string {
  return skill.providerSupport
    .map((entry) => `${SKILL_PROVIDER_LABELS[entry.provider]}は${SKILL_PROVIDER_SUPPORT_LABELS[entry.supportType]}`)
    .join('、');
}

function normalizeContext(input: AiTool[] | SkillRecommendationContext): SkillRecommendationContext {
  if (Array.isArray(input)) {
    return { aiTools: input };
  }
  return input;
}

function filterByProviders(aiTools: AiTool[]): SkillCatalogItem[] {
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

function isProjectAwareFilteringNeeded(context: SkillRecommendationContext): boolean {
  return Boolean(
    context.domains?.length
    || context.frameworks?.length
    || context.repoType
    || context.planningHints?.some((item) => item.trim().length > 0),
  );
}

function collectSignalText(context: SkillRecommendationContext): string {
  return [
    context.domains?.join(' ') ?? '',
    context.frameworks?.join(' ') ?? '',
    context.repoType ?? '',
    context.planningHints?.join(' ') ?? '',
  ].join(' ').toLowerCase();
}

function isSkillRelevant(skill: SkillCatalogItem, context: SkillRecommendationContext): boolean {
  if (skill.id === 'repo-readiness-review') return true;

  const signalText = collectSignalText(context);
  const hasWebUi = (context.domains ?? []).includes('web')
    || /\bnext(?:\.js|js)?\b|\breact\b|\bvue\b|\bnuxt\b|\bsvelte\b|\bvite\b|frontend|browser|web ui|webui|\bui\b/.test(signalText);
  const hasBackend = /\bfastapi\b|\bapi\b|\bbackend\b|\bserver\b|\brender\b/.test(signalText)
    || context.repoType === 'multi';
  const hasDeploySurface = /\bdeploy\b|\bvercel\b|\brender\b|production|公開/.test(signalText) || hasWebUi || hasBackend;

  switch (skill.id) {
    case 'frontend-design':
      return hasWebUi;
    case 'playwright':
      return hasWebUi;
    case 'vercel-deploy':
      return hasWebUi && /\bvercel\b|\bnext(?:\.js|js)?\b/.test(signalText);
    case 'render-deploy':
      return hasBackend || /\brender\b/.test(signalText);
    case 'gh-fix-ci':
      return hasDeploySurface;
    default:
      return true;
  }
}

export function getRecommendedSkills(input: AiTool[] | SkillRecommendationContext): SkillCatalogItem[] {
  const context = normalizeContext(input);
  const providerFiltered = filterByProviders(context.aiTools);

  if (!isProjectAwareFilteringNeeded(context)) {
    return providerFiltered;
  }

  const relevant = providerFiltered.filter((item) => isSkillRelevant(item, context));
  return relevant.length > 0 ? relevant : providerFiltered;
}

export function getAutoSelectedSkillIds(input: AiTool[] | SkillRecommendationContext): string[] {
  return getRecommendedSkills(input)
    .filter((skill) => skill.selectionStage === 'first')
    .map((skill) => skill.id);
}
