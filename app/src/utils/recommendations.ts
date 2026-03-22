import type { RepoType, SecurityLevel } from '../constants/enums.ts';
import type { FormState } from '../state/actions.ts';
import type { IntakeDraft } from './intakeParser.ts';

export type RecommendationKey = 'repo_type' | 'security_level' | 'phases_count';
export type RecommendationDecisionStatus = 'pending' | 'accepted' | 'overridden';

export interface RecommendationDecisions {
  repo_type: RecommendationDecisionStatus;
  security_level: RecommendationDecisionStatus;
  phases_count: RecommendationDecisionStatus;
}

export interface DraftRecommendation {
  key: RecommendationKey;
  title: string;
  suggestedLabel: string;
  currentLabel: string;
  status: RecommendationDecisionStatus;
  rationale: string;
}

export const DEFAULT_RECOMMENDATION_DECISIONS: RecommendationDecisions = {
  repo_type: 'pending',
  security_level: 'pending',
  phases_count: 'pending',
};

export function normalizeRecommendationDecisions(
  value: Partial<RecommendationDecisions> | null | undefined,
): RecommendationDecisions {
  return {
    repo_type: normalizeStatus(value?.repo_type),
    security_level: normalizeStatus(value?.security_level),
    phases_count: normalizeStatus(value?.phases_count),
  };
}

function normalizeStatus(value: RecommendationDecisionStatus | undefined): RecommendationDecisionStatus {
  return value === 'accepted' || value === 'overridden' ? value : 'pending';
}

function repoTypeLabel(value: RepoType): string {
  return value === 'single' ? 'シングル' : 'マルチ';
}

function securityLabel(value: SecurityLevel): string {
  return value;
}

function phasesLabel(value: number): string {
  return `${value}段階`;
}

function resolveStatus<T>(
  suggestedValue: T,
  currentValue: T,
  explicit: RecommendationDecisionStatus,
): RecommendationDecisionStatus {
  if (explicit === 'overridden') {
    return 'overridden';
  }
  if (currentValue !== suggestedValue) {
    return 'overridden';
  }
  if (explicit === 'accepted') {
    return 'accepted';
  }
  return 'pending';
}

function repoTypeRationale(state: FormState, draft: IntakeDraft): string {
  if (draft.suggestedState.structure.repo_type === 'multi') {
    return draft.extracted.integrations.length > 0
      ? '外部連携候補と役割分離が見えているため、画面と裏側の責務を分けておく方が安全です。'
      : '最初に作るものの範囲が広く、後で境界を切りやすいようにマルチを勧めています。';
  }
  return state.structure.repos.length > 0
    ? '最初の成果物は 1 つにまとめても進められるため、まずはシングルで進める方が早いです。'
    : '最初の成果物が比較的まとまっているので、まずはシングルで始める方が安全です。';
}

function securityRationale(draft: IntakeDraft): string {
  const security = draft.suggestedState.security;
  if (security.level === 'high') {
    return '強い機密性や credentials / payment 相当の扱いが見えているため、high 前提で進める方が安全です。';
  }
  if (security.has_user_data || security.has_ip_sensitive || security.has_api_keys) {
    return '顧客情報・機密情報・外部連携の可能性があるため、medium を基準に整理する方が現実的です。';
  }
  return '現時点では強い機密要件が薄いため、low から始めて必要時に引き上げる前提です。';
}

function phasesRationale(draft: IntakeDraft): string {
  if (draft.review.openQuestions.length > 0 || draft.extracted.integrations.length > 0) {
    return `${draft.suggestedState.workflow.phases_count}段階に分けると、未確定事項や外部連携を後ろへ逃がしやすくなります。`;
  }
  return `初回スコープは ${draft.suggestedState.workflow.phases_count}段階で十分に切れそうです。`;
}

export function deriveDraftRecommendations(
  state: FormState,
  draft: IntakeDraft,
  decisions: RecommendationDecisions,
): DraftRecommendation[] {
  return [
    {
      key: 'repo_type',
      title: 'リポジトリ構成',
      suggestedLabel: repoTypeLabel(draft.suggestedState.structure.repo_type),
      currentLabel: repoTypeLabel(state.structure.repo_type),
      status: resolveStatus(draft.suggestedState.structure.repo_type, state.structure.repo_type, decisions.repo_type),
      rationale: repoTypeRationale(state, draft),
    },
    {
      key: 'security_level',
      title: 'security 水準',
      suggestedLabel: securityLabel(draft.suggestedState.security.level),
      currentLabel: securityLabel(state.security.level),
      status: resolveStatus(draft.suggestedState.security.level, state.security.level, decisions.security_level),
      rationale: securityRationale(draft),
    },
    {
      key: 'phases_count',
      title: '進め方の段階数',
      suggestedLabel: phasesLabel(draft.suggestedState.workflow.phases_count),
      currentLabel: phasesLabel(state.workflow.phases_count),
      status: resolveStatus(draft.suggestedState.workflow.phases_count, state.workflow.phases_count, decisions.phases_count),
      rationale: phasesRationale(draft),
    },
  ];
}
