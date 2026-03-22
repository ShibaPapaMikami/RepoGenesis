import {
  CONSULTATION_PROMPT_OPTIONS,
  getConsultationReviewHints,
  type ConsultationPromptVariant,
  type IntakeDraft,
} from './intakeParser.ts';
import {
  DOMAIN_LABELS,
  formatAiToolNames,
  LANGUAGE_LABELS,
  type Domain,
} from '../constants/enums.ts';
import type { FormState } from '../state/actions.ts';

const REFINEMENT_HEADINGS = [
  'プロジェクト概要',
  '想定ユーザー',
  '解決したい課題',
  '最初に作るべきもの',
  '扱うデータ',
  '外部連携候補',
  '未確定事項',
  'RepoGenesis入力候補',
] as const;

function formatBullets(items: string[], fallback = '- なし'): string {
  if (items.length === 0) return fallback;
  return items.map((item) => `- ${item}`).join('\n');
}

function formatDomains(domains: Domain[]): string {
  if (domains.length === 0) return '未確定';
  return domains.map((domain) => DOMAIN_LABELS[domain]).join(', ');
}

function formatRepos(state: FormState): string {
  if (state.structure.repo_type === 'single') {
    return 'single';
  }
  if (state.structure.repos.length === 0) {
    return 'multi (repo 未整理)';
  }
  return `multi (${state.structure.repos.map((repo) => `${repo.name || 'unnamed'}:${repo.type}`).join(', ')})`;
}

function formatTechDecisions(state: FormState): string {
  const adopted = state.planning.tech_decisions
    .filter((item) => item.status === 'adopted' && item.topic.trim() && item.choice.trim())
    .map((item) => `${item.topic}: ${item.choice}${item.rationale.trim() ? ` (${item.rationale.trim()})` : ''}`);
  return formatBullets(adopted);
}

function formatExternalDependencies(state: FormState): string {
  const adopted = state.planning.external_dependencies
    .filter((item) => item.status === 'adopted' && item.name.trim())
    .map((item) => {
      const env = item.env_vars.length > 0 ? ` / env: ${item.env_vars.join(', ')}` : '';
      return `${item.name} (${item.category})${item.purpose.trim() ? ` / ${item.purpose.trim()}` : ''}${env}`;
    });
  return formatBullets(adopted);
}

export function getRequirementRefinementPromptFilename(slug: string | undefined): string {
  const normalized = slug?.trim() || 'repogenesis';
  return `${normalized}-requirement-refinement-prompt.md`;
}

export function buildRequirementRefinementPrompt(
  state: FormState,
  draft: IntakeDraft,
  variant: ConsultationPromptVariant,
): string {
  const variantLabel = CONSULTATION_PROMPT_OPTIONS.find((option) => option.id === variant)?.label ?? variant;
  const reviewHints = getConsultationReviewHints(variant);
  const aiToolNames = formatAiToolNames(state.tech.ai_tools) || '未確定';
  const headings = REFINEMENT_HEADINGS.map((heading) => `## ${heading}`).join('\n\n');

  return `# RepoGenesis 要件整理用プロンプト

あなたは RepoGenesis 用の要件整理アシスタントです。
以下の現在情報を前提に、RepoGenesis に再入力しやすい形で要件を整理してください。

## このプロンプトの目的
- 既に確認できている事実は維持する
- 仮置きした内容と未確定事項を分けたまま、次に決めるべき点を明確にする
- RepoGenesis に戻した時に project / tech / planning を更新しやすい材料を作る

## ルール
- 既に「確認できたこと」にある内容は、明確な矛盾がない限り覆さない
- 推測は事実として断定しない
- 不明点は無理に埋めず、\`## 未確定事項\` へ残す
- repo 構成、security、水準、外部連携候補、技術判断候補は \`## RepoGenesis入力候補\` に簡潔に残す
- 出力は指定した見出しだけを使い、前置き・まとめ・注意書きは書かない

## 今回の前提
- 相談タイプ: ${variantLabel}
- 想定AIツール: ${aiToolNames}
- primary language: ${LANGUAGE_LABELS[state.tech.primary_language]}
- 現在の repo 構成: ${formatRepos(state)}
- 現在の security: ${state.security.level}

## この案件で見直したい観点
${formatBullets(reviewHints.points)}

## 現在の整理状況
### 確認できたこと
${formatBullets(draft.review.facts)}

### 仮置きした内容
${formatBullets(draft.review.assumptions)}

### 未確定事項
${formatBullets(draft.review.openQuestions)}

### 現在のフォーム設定
- project 名: ${state.project.name || '未確定'}
- slug: ${state.project.slug || '未確定'}
- owner: ${state.project.owner || '未確定'}
- project 説明: ${state.project.description || '未確定'}
- domain: ${formatDomains(state.tech.domains)}
- frameworks: ${state.tech.frameworks.join(', ') || '未確定'}
- workflow phases: ${state.workflow.phases_count}

### 採用済み技術判断
${formatTechDecisions(state)}

### 採用済み外部依存
${formatExternalDependencies(state)}

## 出力フォーマット
${headings}
`;
}
