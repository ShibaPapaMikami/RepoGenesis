import { slugify } from './slugify.ts';
import type { FormState } from '../state/actions.ts';
import type { Domain, RepoType } from '../constants/enums.ts';

export interface IntakeReadiness {
  blocking: string[];
  warnings: string[];
}

export interface IntakeDraft {
  source: 'pasted_consultation';
  rawText: string;
  sections: Record<string, string>;
  review: {
    facts: string[];
    assumptions: string[];
    openQuestions: string[];
  };
  extracted: {
    summary: string | null;
    users: string[];
    problem: string | null;
    firstDeliverable: string | null;
    dataKinds: string[];
    integrations: string[];
    openQuestions: string[];
    candidateInputs: string[];
  };
  certainty: {
    confirmed: string[];
    provisional: string[];
    unresolved: string[];
  };
  suggestedState: FormState;
}

export type ConsultationPromptVariant = 'new_business' | 'internal_tool' | 'client_project';

export interface ConsultationPromptOption {
  id: ConsultationPromptVariant;
  label: string;
  description: string;
}

export interface ConsultationReviewHints {
  title: string;
  points: string[];
}

function normalizeOpenQuestionLines(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

function isBlockingUnresolved(item: string): boolean {
  if (item === 'プロジェクト名') return true;
  if (/（未入力）$/.test(item)) return true;
  if (item === '技術ドメイン') return true;
  return false;
}

export function assessIntakeReadiness(draft: IntakeDraft | null): IntakeReadiness {
  if (!draft) return { blocking: [], warnings: [] };

  const blocking = draft.certainty.unresolved.filter(isBlockingUnresolved);
  const warnings = [
    ...draft.certainty.provisional,
    ...draft.certainty.unresolved.filter((item) => !isBlockingUnresolved(item)),
  ];

  return {
    blocking: [...new Set(blocking)],
    warnings: [...new Set(warnings)],
  };
}

const REQUIRED_SECTION_KEYS = [
  'プロジェクト概要',
  '想定ユーザー',
  '解決したい課題',
  '扱うデータ',
  '未確定事項',
] as const;

const PROMPT_SKELETON = `## プロジェクト概要

## 想定ユーザー

## 解決したい課題

## 最初に作るべきもの

## 扱うデータ

## 外部連携候補

## 未確定事項

## RepoGenesis入力候補`;

const PROMPT_TEMPLATES: Record<ConsultationPromptVariant, string> = {
  new_business: `あなたは新規事業の要件整理アシスタントです。
新しい事業やプロダクトの立ち上げ前提で、非エンジニアでも RepoGenesis に反映しやすいように整理してください。
市場仮説、最初の提供価値、初期ユーザー、検証したいことを優先し、推測は最小化してください。
不明点は「未確定事項」に残してください。

${PROMPT_SKELETON}`,
  internal_tool: `あなたは社内ツールの要件整理アシスタントです。
業務改善や情報整理のための社内利用前提で、非エンジニアでも RepoGenesis に反映しやすいように整理してください。
対象部門、現状の非効率、最初に置き換えたい業務、機密情報の扱いを優先し、推測は最小化してください。
不明点は「未確定事項」に残してください。

${PROMPT_SKELETON}`,
  client_project: `あなたはクライアント案件の要件整理アシスタントです。
受託開発や提案前提で、非エンジニアでも RepoGenesis に反映しやすいように整理してください。
クライアントの目的、納品範囲、最初の成果物、制約条件、扱う情報の機密性を優先し、推測は最小化してください。
不明点は「未確定事項」に残してください。

${PROMPT_SKELETON}`,
};

export const CONSULTATION_PROMPT_OPTIONS: ConsultationPromptOption[] = [
  { id: 'new_business', label: '新規事業', description: '新しい事業やプロダクトの立ち上げを整理する' },
  { id: 'internal_tool', label: '社内ツール', description: '業務改善や社内利用のツールを整理する' },
  { id: 'client_project', label: 'クライアント案件', description: '受託開発や提案案件の整理に使う' },
];

const REVIEW_HINTS: Record<ConsultationPromptVariant, ConsultationReviewHints> = {
  new_business: {
    title: '新規事業で先に確認したいこと',
    points: [
      '最初の提供価値が一文で説明できるか',
      '最初に使ってほしいユーザーが具体化されているか',
      'PoC と本番運用の境界が未確定のまま混ざっていないか',
    ],
  },
  internal_tool: {
    title: '社内ツールで先に確認したいこと',
    points: [
      'どの部門のどの作業を先に置き換えるかが明確か',
      '扱う情報に機密や個人情報が含まれるか整理できているか',
      '外部APIや複数リポジトリが本当に必要かを仮置きで済ませていないか',
    ],
  },
  client_project: {
    title: 'クライアント案件で先に確認したいこと',
    points: [
      '最初の成果物と納品範囲が分かれているか',
      'クライアント固有の制約や機密条件が書かれているか',
      '提案段階の仮説と確定仕様が混ざっていないか',
    ],
  },
};

export function getConsultationPromptTemplate(variant: ConsultationPromptVariant): string {
  return PROMPT_TEMPLATES[variant];
}

export function getConsultationReviewHints(variant: ConsultationPromptVariant): ConsultationReviewHints {
  return REVIEW_HINTS[variant];
}

function parseSections(input: string): Record<string, string> {
  const lines = input.replace(/\r\n/g, '\n').split('\n');
  const sections: Record<string, string[]> = {};
  let current = '';

  for (const line of lines) {
    const match = line.match(/^##\s+(.+)\s*$/);
    if (match) {
      current = match[1].trim();
      if (!sections[current]) sections[current] = [];
      continue;
    }
    if (!current) continue;
    sections[current].push(line);
  }

  return Object.fromEntries(
    Object.entries(sections).map(([key, value]) => [key, value.join('\n').trim()]),
  );
}

function toList(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .map((line) => line.split(/[、,]/).map((part) => part.trim()))
    .flat()
    .filter(Boolean);
}

function inferDomains(text: string): Domain[] {
  const normalized = text.toLowerCase();
  const domains: Domain[] = [];

  if (/(web|サイト|画面|ブラウザ)/i.test(normalized)) domains.push('web');
  if (/(ai|llm|生成ai|機械学習)/i.test(normalized)) domains.push('ai');
  if (/(mobile|ios|android|スマホ)/i.test(normalized)) domains.push('mobile');
  if (/(unity)/i.test(normalized)) domains.push('unity');
  if (/(xr|vr|ar|mr)/i.test(normalized)) domains.push('xr');
  if (/(infra|devops|aws|gcp|azure)/i.test(normalized)) domains.push('infra');
  if (/(cli|コマンド)/i.test(normalized)) domains.push('cli');
  if (/(iot|センサー|デバイス)/i.test(normalized)) domains.push('iot');

  return [...new Set(domains)];
}

function guessProjectName(summary: string | null): string {
  if (!summary) return '未確定プロジェクト';
  const firstLine = summary.split('\n')[0].trim();
  if (firstLine.length <= 36) return firstLine;
  return `${firstLine.slice(0, 33)}...`;
}

function detectHasUserData(text: string): boolean {
  return /(個人情報|顧客情報|アカウント|メールアドレス|ユーザー情報)/i.test(text);
}

function detectHasIpSensitive(text: string): boolean {
  return /(機密|秘匿|社外秘|取引先情報|案件情報)/i.test(text);
}

function toFactList(
  summary: string | null,
  users: string[],
  problem: string | null,
  firstDeliverable: string | null,
  dataKinds: string[],
  integrations: string[],
): string[] {
  const facts: string[] = [];
  if (summary) facts.push(`概要: ${summary}`);
  if (users.length > 0) facts.push(`想定ユーザー: ${users.join(' / ')}`);
  if (problem) facts.push(`課題: ${problem}`);
  if (firstDeliverable) facts.push(`最初に作るもの: ${firstDeliverable}`);
  if (dataKinds.length > 0) facts.push(`扱うデータ: ${dataKinds.join(' / ')}`);
  if (integrations.length > 0) facts.push(`外部連携候補: ${integrations.join(' / ')}`);
  return facts;
}

function toAssumptionList(
  provisional: string[],
  inferredRepoType: RepoType,
  inferredPhasesCount: number,
): string[] {
  return provisional.map((item) => {
    if (item.startsWith('リポジトリ構成')) {
      return `リポジトリ構成は ${inferredRepoType} を仮置き`;
    }
    if (item.startsWith('フェーズ数')) {
      return `フェーズ数は ${inferredPhasesCount} を仮置き`;
    }
    if (item === '外部API有無') {
      return '外部API有無は未確定のため仮置き';
    }
    if (item === '技術ドメイン') {
      return '技術ドメインは文面から推定';
    }
    if (item === 'プロジェクト名') {
      return 'プロジェクト名は概要から仮置き';
    }
    if (item === '責任者') {
      return '責任者は未設定のため仮置き';
    }
    return item;
  });
}

function toOpenQuestionList(
  unresolved: string[],
  openQuestions: string[],
): string[] {
  return [...new Set([...openQuestions, ...unresolved])];
}

function inferRepoType(text: string): RepoType {
  if (/(管理画面|ダッシュボード|画面)/i.test(text) && /(api|バッチ|worker|ジョブ)/i.test(text)) {
    return 'multi';
  }
  return 'single';
}

function inferPhasesCount(text: string, integrations: string[]): number {
  if (/(poc|PoC|プロトタイプ|たたき台)/i.test(text)) {
    return 2;
  }
  if (/(管理画面|ダッシュボード|認証|権限)/i.test(text) || integrations.length > 0) {
    return 4;
  }
  return 3;
}

function inferSuggestedRepos(
  currentState: FormState,
  inferredRepoType: RepoType,
  firstDeliverable: string | null,
): FormState['structure']['repos'] {
  if (currentState.structure.repo_type === 'multi' && currentState.structure.repos.length > 0) {
    return currentState.structure.repos;
  }

  if (inferredRepoType !== 'multi') {
    return currentState.structure.repos;
  }

  const source = (firstDeliverable ?? '').toLowerCase();
  const includesWorker = /(worker|バッチ|ジョブ)/i.test(firstDeliverable ?? '');

  const repos: FormState['structure']['repos'] = [
    {
      name: source.includes('admin') || /管理画面|ダッシュボード/i.test(firstDeliverable ?? '') ? 'frontend-admin' : 'frontend',
      type: 'frontend',
      description: 'ユーザー向けまたは管理向けの Web 画面を担当するリポジトリ',
      owner: currentState.project.owner || '未設定',
      depends_on: ['backend'],
    },
    {
      name: 'backend',
      type: 'backend',
      description: 'API と業務ロジックを担当するリポジトリ',
      owner: currentState.project.owner || '未設定',
      depends_on: [],
    },
  ];

  if (includesWorker) {
    repos.push({
      name: 'worker',
      type: 'backend',
      description: '非同期処理やバッチ処理を担当するリポジトリ',
      owner: currentState.project.owner || '未設定',
      depends_on: ['backend'],
    });
  }

  return repos;
}

export function parseConsultationIntake(input: string, currentState: FormState): IntakeDraft {
  const rawText = input.trim();
  const sections = parseSections(rawText);
  const combined = Object.values(sections).join('\n');
  const summary = sections['プロジェクト概要'] || null;
  const users = toList(sections['想定ユーザー']);
  const problem = sections['解決したい課題'] || null;
  const firstDeliverable = sections['最初に作るべきもの'] || null;
  const dataKinds = toList(sections['扱うデータ']);
  const integrations = toList(sections['外部連携候補']);
  const openQuestions = toList(sections['未確定事項']);
  const candidateInputs = toList(sections['RepoGenesis入力候補']);
  const inferredDomains = inferDomains(combined);
  const inferenceSource = [
    summary ?? '',
    problem ?? '',
    firstDeliverable ?? '',
    candidateInputs.join('\n'),
    integrations.join('\n'),
  ].join('\n');

  const projectName = currentState.project.name || guessProjectName(summary);
  const projectDescription = currentState.project.description || problem || summary || '';
  const owner = currentState.project.owner || '未設定';
  const slug = currentState.project.slug || slugify(projectName);
  const hasUserData = currentState.security.has_user_data || detectHasUserData(combined);
  const hasIpSensitive = currentState.security.has_ip_sensitive || detectHasIpSensitive(combined);
  const hasApiKeys = currentState.security.has_api_keys;
  const inferredRepoType = inferRepoType(inferenceSource);
  const inferredPhasesCount = inferPhasesCount(inferenceSource, integrations);

  const confirmed: string[] = [];
  const provisional: string[] = [];
  const unresolved: string[] = [];

  if (summary) confirmed.push('プロジェクト概要');
  if (users.length > 0) confirmed.push('想定ユーザー');
  if (problem) confirmed.push('解決したい課題');
  if (dataKinds.length > 0) confirmed.push('扱うデータ');

  if (projectName === '未確定プロジェクト') {
    unresolved.push('プロジェクト名');
  } else if (!currentState.project.name) {
    provisional.push('プロジェクト名');
  }

  if (!currentState.project.owner) {
    provisional.push('責任者');
  }

  if (inferredDomains.length === 0 && currentState.tech.domains.length === 0) {
    unresolved.push('技術ドメイン');
  } else if (currentState.tech.domains.length === 0) {
    provisional.push('技術ドメイン');
  }

  provisional.push(`リポジトリ構成（${inferredRepoType} 仮置き）`);
  provisional.push(`フェーズ数（${inferredPhasesCount} 仮置き）`);
  provisional.push('外部API有無');

  for (const key of REQUIRED_SECTION_KEYS) {
    if (!sections[key]) {
      unresolved.push(`${key}（未入力）`);
    }
  }

  const suggestedState: FormState = {
    ...currentState,
    project: {
      ...currentState.project,
      name: projectName,
      slug,
      description: projectDescription,
      owner,
    },
    tech: {
      ...currentState.tech,
      domains: currentState.tech.domains.length > 0 ? currentState.tech.domains : inferredDomains,
    },
    security: {
      ...currentState.security,
      has_user_data: hasUserData,
      has_ip_sensitive: hasIpSensitive,
      has_api_keys: hasApiKeys,
    },
    structure: {
      ...currentState.structure,
      repo_type: inferredRepoType,
      repos: inferSuggestedRepos(currentState, inferredRepoType, firstDeliverable),
    },
    workflow: {
      ...currentState.workflow,
      phases_count: currentState.workflow.phases_count === 3 ? inferredPhasesCount : currentState.workflow.phases_count,
    },
    slugManuallyEdited: Boolean(currentState.project.slug),
    securityLevelOverride: currentState.securityLevelOverride,
  };

  return {
    source: 'pasted_consultation',
    rawText,
    sections,
    review: {
      facts: toFactList(summary, users, problem, firstDeliverable, dataKinds, integrations),
      assumptions: toAssumptionList([...new Set(provisional)], inferredRepoType, inferredPhasesCount),
      openQuestions: toOpenQuestionList([...new Set(unresolved)], openQuestions),
    },
    extracted: {
      summary,
      users,
      problem,
      firstDeliverable,
      dataKinds,
      integrations,
      openQuestions,
      candidateInputs,
    },
    certainty: {
      confirmed: [...new Set(confirmed)],
      provisional: [...new Set(provisional)],
      unresolved: [...new Set(unresolved)],
    },
    suggestedState,
  };
}

export function updateDraftOpenQuestions(draft: IntakeDraft, input: string): IntakeDraft {
  const questions = normalizeOpenQuestionLines(input);
  return {
    ...draft,
    sections: {
      ...draft.sections,
      未確定事項: questions.map((item) => `- ${item}`).join('\n'),
    },
    review: {
      ...draft.review,
      openQuestions: questions,
    },
    extracted: {
      ...draft.extracted,
      openQuestions: questions,
    },
  };
}
