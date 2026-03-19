import { slugify } from './slugify.ts';
import { createIntakeEnvelope } from './intakeProvider.ts';
import type { FormState } from '../state/actions.ts';
import type { Domain, RepoType, SecurityLevel } from '../constants/enums.ts';
import { calculateMinSecurityLevel } from './securityCalc.ts';
import { derivePlanningSuggestions } from './planning.ts';

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

export type ConsultationPromptVariant = 'new_business' | 'internal_tool' | 'client_project' | 'personal_project';

export interface ConsultationPromptOption {
  id: ConsultationPromptVariant;
  label: string;
  description: string;
}

export interface ConsultationReviewHints {
  title: string;
  points: string[];
}

interface IntakeExtractionInput {
  summary: string | null;
  problem: string | null;
  firstDeliverable: string | null;
  integrations: string[];
  candidateInputs: string[];
  candidateText: string;
  externalText: string;
  combinedText: string;
}

interface DraftSuggestions {
  suggestedState: FormState;
  projectName: string;
  inferredDomains: Domain[];
  inferredRepoType: RepoType;
  inferredPhasesCount: number;
}

interface ProjectKeywordRule {
  pattern: RegExp;
  label: string;
}

const SECURITY_ORDER: SecurityLevel[] = ['low', 'medium', 'high'];

function normalizeOpenQuestionLines(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

function isBlockingUnresolved(item: string): boolean {
  if (item === 'プロジェクト名') return true;
  if (/（未入力）$/.test(item)) return true;
  return false;
}

function resolveSecurityLevel(
  minimum: SecurityLevel,
  override: SecurityLevel | null,
  current: SecurityLevel,
): SecurityLevel {
  const minimumIndex = SECURITY_ORDER.indexOf(minimum);
  const candidate = override ?? current;
  const candidateIndex = SECURITY_ORDER.indexOf(candidate);
  return SECURITY_ORDER[Math.max(minimumIndex, candidateIndex)];
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

const ALL_SECTION_KEYS = [
  'プロジェクト概要',
  '想定ユーザー',
  '解決したい課題',
  '最初に作るべきもの',
  '扱うデータ',
  '外部連携候補',
  '未確定事項',
  'RepoGenesis入力候補',
] as const;

const PROMPT_SKELETON = `## プロジェクト概要

## 想定ユーザー

## 解決したい課題

## 最初に作るべきもの

## 扱うデータ

## 外部連携候補

## 未確定事項

## RepoGenesis入力候補`;

const PROMPT_OUTPUT_RULES = `出力ルール:
- 必ず以下の ` + '`## 見出し`' + ` をそのまま使ってください。見出し名を変えないでください。
- 各見出しの本文を最低1行は書いてください。空欄のまま返さないでください。
- 分からない内容を「未入力」「なし」で埋めないでください。分からない場合は ` + '`## 未確定事項`' + ` に移してください。
- 箇条書きでも文章でも構いませんが、RepoGenesis に貼り付けやすいように簡潔にしてください。
- 前置き、まとめ、注意書きは不要です。出力は見出しブロックだけにしてください。
- 空欄の見出しを作らず、内容が不明なものは ` + '`## 未確定事項`' + ` にまとめてください。

出力フォーマット:
${PROMPT_SKELETON}

短い出力例:
## プロジェクト概要
営業案件の相談履歴と判断理由をまとめて確認できる社内Webツール。

## 想定ユーザー
- 営業
- PM

## 解決したい課題
相談履歴が Slack とスプレッドシートに分散していて、過去判断を追いにくい。

## 最初に作るべきもの
案件一覧と相談履歴を見られる管理画面。

## 扱うデータ
- 案件名
- 担当者
- 相談メモ

## 外部連携候補
- Slack

## 未確定事項
- 外部API連携を初回スコープに含めるか未確定

## RepoGenesis入力候補
- domain は web が候補
- security は medium を想定`;

const PROMPT_TEMPLATES: Record<ConsultationPromptVariant, string> = {
  new_business: `あなたは新規事業の要件整理アシスタントです。
新しい事業やプロダクトの立ち上げ前提で、非エンジニアでも RepoGenesis に反映しやすいように整理してください。
市場仮説、最初の提供価値、初期ユーザー、検証したいことを優先し、推測は最小化してください。
不明点は「未確定事項」に残してください。

${PROMPT_OUTPUT_RULES}`,
  internal_tool: `あなたは社内ツールの要件整理アシスタントです。
業務改善や情報整理のための社内利用前提で、非エンジニアでも RepoGenesis に反映しやすいように整理してください。
対象部門、現状の非効率、最初に置き換えたい業務、機密情報の扱いを優先し、推測は最小化してください。
不明点は「未確定事項」に残してください。

${PROMPT_OUTPUT_RULES}`,
  client_project: `あなたはクライアント案件の要件整理アシスタントです。
受託開発や提案前提で、非エンジニアでも RepoGenesis に反映しやすいように整理してください。
クライアントの目的、納品範囲、最初の成果物、制約条件、扱う情報の機密性を優先し、推測は最小化してください。
不明点は「未確定事項」に残してください。

${PROMPT_OUTPUT_RULES}`,
  personal_project: `あなたは個人プロジェクトの要件整理アシスタントです。
個人開発、学習用、ポートフォリオ用のプロジェクト前提で、非エンジニアでも RepoGenesis に反映しやすいように整理してください。
作る目的、最初に完成させたい範囲、一人で続けられる運用、公開するかどうかを優先し、推測は最小化してください。
不明点は「未確定事項」に残してください。

${PROMPT_OUTPUT_RULES}`,
};

export const CONSULTATION_PROMPT_OPTIONS: ConsultationPromptOption[] = [
  { id: 'new_business', label: '新規事業', description: '新しい事業やプロダクトの立ち上げを整理する' },
  { id: 'internal_tool', label: '社内ツール', description: '業務改善や社内利用のツールを整理する' },
  { id: 'client_project', label: 'クライアント案件', description: '受託開発や提案案件の整理に使う' },
  { id: 'personal_project', label: '個人プロジェクト', description: '個人開発、学習用、ポートフォリオ用の整理に使う' },
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
  personal_project: {
    title: '個人プロジェクトで先に確認したいこと',
    points: [
      '最初に一人で完成させる範囲が絞れているか',
      '公開前提なのか、個人利用だけなのかが分かれているか',
      '学習目的と実運用目的が混ざったまま大きくなりすぎていないか',
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
    const trimmed = line.trim();
    const headingMatch = trimmed.match(/^(?:#+\s*)?(プロジェクト概要|想定ユーザー|解決したい課題|最初に作るべきもの|扱うデータ|外部連携候補|未確定事項|RepoGenesis入力候補)\s*([:：]\s*(.*))?$/);
    if (headingMatch) {
      current = headingMatch[1].trim();
      if (!sections[current]) sections[current] = [];
      const inlineBody = headingMatch[3]?.trim();
      if (inlineBody) {
        sections[current].push(inlineBody);
      }
      continue;
    }
    if (!current) continue;
    sections[current].push(line);
  }

  return Object.fromEntries(
    Object.entries(sections)
      .filter(([key]) => (ALL_SECTION_KEYS as readonly string[]).includes(key))
      .map(([key, value]) => [key, value.join('\n').trim()]),
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

function toCandidateList(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
}

function inferDomains(text: string): Domain[] {
  const domains: Domain[] = [];
  const normalized = text.trim();

  if (/\bweb\b|webアプリ|ウェブ|サイト|管理画面|ダッシュボード|ブラウザ|画面/i.test(normalized)) domains.push('web');
  if (/\bai\b|\bllm\b|生成ai|生成 ai|機械学習|大規模言語モデル/i.test(normalized)) domains.push('ai');
  if (/\bmobile\b|\bios\b|\bandroid\b|モバイル|スマホ/i.test(normalized)) domains.push('mobile');
  if (/\bunity\b|ユニティ/i.test(normalized)) domains.push('unity');
  if (/\bxr\b|\bvr\b|\bar\b|\bmr\b|空間コンピューティング|仮想現実|拡張現実|mixed reality|spatial/i.test(normalized)) domains.push('xr');
  if (/\binfra\b|\bdevops\b|\baws\b|\bgcp\b|\bazure\b|インフラ|デプロイ/i.test(normalized)) domains.push('infra');
  if (/\bcli\b|コマンドライン|コマンド|ターミナル/i.test(normalized)) domains.push('cli');
  if (/\biot\b|センサー|デバイス|組み込み/i.test(normalized)) domains.push('iot');

  return [...new Set(domains)];
}

function parseExplicitDomainValue(value: string | null): Domain[] {
  if (!value) return [];

  return value
    .split(/[、,\s/]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)
    .flatMap((part): Domain[] => {
      if (part === 'web' || part === 'ウェブ') return ['web'];
      if (part === 'ai' || part === 'llm') return ['ai'];
      if (part === 'mobile' || part === 'モバイル') return ['mobile'];
      if (part === 'unity') return ['unity'];
      if (part === 'xr' || part === 'vr' || part === 'ar' || part === 'mr') return ['xr'];
      if (part === 'infra' || part === 'devops') return ['infra'];
      if (part === 'cli') return ['cli'];
      if (part === 'iot') return ['iot'];
      return [];
    })
    .filter((domain, index, list) => list.indexOf(domain) === index);
}

function inferDomainsFromCandidateInputs(items: string[]): Domain[] {
  const explicitValue = extractCandidateInputValue(items, ['domain', 'domains', '技術ドメイン']);
  return parseExplicitDomainValue(explicitValue);
}

function inferSecurityLevelFromCandidateInputs(items: string[]): SecurityLevel | null {
  const text = items.join('\n').toLowerCase();
  if (/\bhigh\b|高/.test(text)) return 'high';
  if (/\bmedium\b|中/.test(text)) return 'medium';
  if (/\blow\b|低/.test(text)) return 'low';
  return null;
}

function inferRepoTypeFromCandidateInputs(items: string[]): RepoType | null {
  const text = items.join('\n').toLowerCase();
  if (/\bmulti\b|複数リポジトリ/.test(text)) return 'multi';
  if (/\bsingle\b|1リポジトリ|単一リポジトリ/.test(text)) return 'single';
  return null;
}

function inferHasApiKeysFromCandidateInputs(items: string[]): boolean | null {
  const text = items.join('\n').toLowerCase();
  if (/has_api_keys|api keys|apiキー/.test(text)) return true;
  if (/api連携あり|外部連携あり/.test(text)) return true;
  return null;
}

function extractCandidateInputValue(items: string[], keys: string[]): string | null {
  const normalizedKeys = keys.map((key) => key.toLowerCase());

  for (const item of items) {
    const trimmed = item.trim();
    const colonMatch = trimmed.match(/^([^:：]{2,80})[:：]\s*(.+)$/);
    if (colonMatch) {
      const label = colonMatch[1].trim().toLowerCase();
      if (normalizedKeys.includes(label)) {
        return colonMatch[2].trim();
      }
    }

    const waMatch = trimmed.match(/^(.{2,80}?)\s*は\s*(.+)$/u);
    if (waMatch) {
      const label = waMatch[1].trim().toLowerCase();
      if (normalizedKeys.includes(label)) {
        return waMatch[2]
          .trim()
          .replace(/\s*(を|が)?\s*(採用|利用|使用)(する|したい|予定)?$/u, '')
          .replace(/\s*(を|が)?\s*想定(する|したい|です)?$/u, '')
          .replace(/\s*(が|は)\s*候補(です)?$/u, '')
          .replace(/\s*(は|が)\s*未確定(です)?$/u, '')
          .trim();
      }
    }
  }

  return null;
}

function cleanFieldValue(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function normalizeDescriptionText(value: string | null | undefined): string {
  const lines = (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return '';

  const normalizedLines = lines.map((line) => line.replace(/^[-*]\s*/, '').replace(/^\d+[.)]\s*/, '').trim());
  const isListLike = lines.every((line) => /^[-*]\s*/.test(line) || /^\d+[.)]\s*/.test(line));

  if (isListLike) {
    return normalizedLines.join(' / ');
  }

  return normalizedLines.join(' ');
}

function formatRepoTypeLabel(repoType: RepoType): string {
  return repoType === 'single' ? 'シングル' : 'マルチ';
}

const PROJECT_KEYWORD_RULES: ProjectKeywordRule[] = [
  { pattern: /社内/i, label: '社内' },
  { pattern: /会議|ミーティング/i, label: '会議' },
  { pattern: /音声|録音/i, label: '音声' },
  { pattern: /文字起こし/i, label: '文字起こし' },
  { pattern: /議事録/i, label: '議事録' },
  { pattern: /契約書|契約/i, label: '契約書' },
  { pattern: /レビュー/i, label: 'レビュー' },
  { pattern: /依頼/i, label: '依頼' },
  { pattern: /法務/i, label: '法務' },
  { pattern: /来場者/i, label: '来場者' },
  { pattern: /収集/i, label: '収集' },
  { pattern: /工場/i, label: '工場' },
  { pattern: /設備/i, label: '設備' },
  { pattern: /メンテナンス|保守|点検/i, label: 'メンテ' },
  { pattern: /記録/i, label: '記録' },
  { pattern: /大学/i, label: '大学' },
  { pattern: /授業/i, label: '授業' },
  { pattern: /質問/i, label: '質問' },
  { pattern: /ボット/i, label: 'ボット' },
  { pattern: /案件/i, label: '案件' },
  { pattern: /相談/i, label: '相談' },
  { pattern: /進行/i, label: '進行' },
  { pattern: /管理/i, label: '管理' },
  { pattern: /提案/i, label: '提案' },
  { pattern: /営業/i, label: '営業' },
  { pattern: /問い合わせ/i, label: '問い合わせ' },
  { pattern: /制作/i, label: '制作' },
  { pattern: /顧客|クライアント/i, label: '顧客' },
  { pattern: /\bai\b|生成ai|生成 ai|llm/i, label: 'AI' },
];

function firstSentence(text: string): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.split(/[。！？\n]/).find((segment) => segment.trim().length > 0)?.trim() ?? normalized;
}

function detectProjectSuffix(text: string): string {
  if (/管理画面/i.test(text)) return '管理画面';
  if (/ダッシュボード/i.test(text)) return 'ダッシュボード';
  if (/\bsaas\b/i.test(text)) return 'SaaS';
  if (/システム/i.test(text)) return 'システム';
  if (/アプリ/i.test(text)) return 'アプリ';
  if (/サービス/i.test(text)) return 'サービス';
  if (/webツール|web ツール/i.test(text)) return 'Webツール';
  return 'ツール';
}

function normalizeProjectTitleSentence(text: string): string {
  return firstSentence(text)
    .replace(/[「」『』（）()]/g, '')
    .replace(/を(作りたい|構築したい|作成したい|立ち上げたい|導入したい|始めたい|作る|構築する|作成する|立ち上げる|導入する)$/u, '')
    .replace(/^(新しい|新規の)\s*/u, '')
    .trim();
}

function looksLikeProjectTitle(candidate: string): boolean {
  if (/(ツール|システム|アプリ|サービス|ボット|ダッシュボード|管理画面)$/u.test(candidate)) {
    return true;
  }
  const keywordMatches = PROJECT_KEYWORD_RULES.filter((rule) => rule.pattern.test(candidate));
  return keywordMatches.length >= 2;
}

function extractQuotedProjectName(text: string): string | null {
  const matches = text.matchAll(/[「『"]([^「」『』"]{2,40})[」』"]/gu);
  for (const match of matches) {
    const normalized = normalizeProjectTitleSentence(match[1]);
    if (normalized && looksLikeProjectTitle(normalized)) {
      return normalized;
    }
  }
  return null;
}

function compactProjectName(source: string, context: string): string {
  const quotedName = extractQuotedProjectName(source) || extractQuotedProjectName(context);
  if (quotedName) return quotedName;

  const normalized = normalizeProjectTitleSentence(source);
  if (normalized.length <= 24) return normalized;

  const suffix = detectProjectSuffix(context || normalized);
  const keywordLabels = PROJECT_KEYWORD_RULES
    .filter((rule) => rule.pattern.test(context))
    .map((rule) => rule.label)
    .filter((label, index, list) => list.indexOf(label) === index);

  if (keywordLabels.length > 0) {
    const compact = `${keywordLabels.slice(0, 4).join('')}${suffix}`;
    if (compact.length <= 24) return compact;
  }

  const tightened = normalized
    .replace(/向けの?/g, '')
    .replace(/のための/g, '')
    .replace(/まとめて/g, '')
    .replace(/自動で/g, '')
    .replace(/できる/g, '')
    .replace(/して/g, '')
    .replace(/する/g, '')
    .replace(/[、,]/g, '')
    .trim();

  if (tightened.length <= 24) return tightened;
  return `${tightened.slice(0, 25)}...`;
}

function guessProjectName(
  summary: string | null,
  firstDeliverable: string | null,
  problem: string | null,
): string {
  const primary = cleanFieldValue(summary) || cleanFieldValue(firstDeliverable) || cleanFieldValue(problem);
  if (!primary) return '未確定プロジェクト';
  const context = [summary, firstDeliverable, problem].filter(Boolean).join('\n');
  return compactProjectName(primary, context);
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
      return `リポジトリ構成は ${formatRepoTypeLabel(inferredRepoType)} を仮置き`;
    }
    if (item.startsWith('進め方の段階数')) {
      return `進め方の段階数は ${inferredPhasesCount} を仮置き`;
    }
    if (item === '外部APIが必要か') {
      return '外部APIが必要かは未確定のため仮置き';
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

export function deriveDraftSuggestions(
  currentState: FormState,
  extracted: IntakeExtractionInput,
): DraftSuggestions {
  const {
    summary,
    problem,
    firstDeliverable,
    integrations,
    candidateInputs,
    candidateText,
    externalText,
    combinedText,
  } = extracted;

  const explicitName = cleanFieldValue(extractCandidateInputValue(candidateInputs, ['name', 'project name', 'project_name', 'プロジェクト名']));
  const explicitSlug = cleanFieldValue(extractCandidateInputValue(candidateInputs, ['slug', 'project slug', 'project_slug', 'スラッグ']));
  const explicitCandidateDomains = inferDomainsFromCandidateInputs(candidateInputs);
  const inferredDomains = explicitCandidateDomains.length > 0
    ? explicitCandidateDomains
    : inferDomains(combinedText);
  const inferenceSource = [
    summary ?? '',
    problem ?? '',
    firstDeliverable ?? '',
    candidateInputs.join('\n'),
    integrations.join('\n'),
  ].join('\n');
  const projectName = explicitName
    || (cleanFieldValue(summary) || cleanFieldValue(firstDeliverable)
    ? guessProjectName(summary, firstDeliverable, problem)
    : currentState.project.name);
  const projectDescription = normalizeDescriptionText(summary)
    || normalizeDescriptionText(problem)
    || normalizeDescriptionText(currentState.project.description);
  const owner = currentState.project.owner;
  const generatedSlug = explicitSlug || slugify(projectName);
  const shouldPreserveManualSlug = currentState.slugManuallyEdited
    && currentState.project.slug
    && !explicitSlug
    && slugify(currentState.project.name) === generatedSlug;
  const slug = shouldPreserveManualSlug
    ? currentState.project.slug
    : (generatedSlug || 'project-draft');
  const hasUserData = detectHasUserData(combinedText);
  const hasIpSensitive = detectHasIpSensitive(combinedText);
  const candidateHasApiKeys = inferHasApiKeysFromCandidateInputs(candidateInputs);
  const hasApiKeys = candidateHasApiKeys ?? false;
  const candidateRepoType = inferRepoTypeFromCandidateInputs(candidateInputs);
  const inferredRepoType = candidateRepoType ?? inferRepoType(inferenceSource);
  const inferredPhasesCount = inferPhasesCount(inferenceSource, integrations);
  const inferredSecurityLevel = inferSecurityLevelFromCandidateInputs(candidateInputs);
  const minimumSecurityLevel = calculateMinSecurityLevel({
    has_api_keys: hasApiKeys,
    has_user_data: hasUserData,
    has_payment_data: currentState.security.has_payment_data,
    has_ip_sensitive: hasIpSensitive,
    has_credentials: currentState.security.has_credentials,
  });
  const resolvedSecurityLevel = resolveSecurityLevel(
    minimumSecurityLevel,
    inferredSecurityLevel ?? currentState.securityLevelOverride,
    currentState.security.level,
  );

  return {
    projectName,
    inferredDomains,
    inferredRepoType,
    inferredPhasesCount,
    suggestedState: {
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
        domains: inferredDomains,
      },
      security: {
        ...currentState.security,
        level: resolvedSecurityLevel,
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
        phases_count: inferredPhasesCount,
      },
      planning: derivePlanningSuggestions({
        currentState,
        candidateText,
        externalText,
        combinedText,
      }),
      slugManuallyEdited: currentState.slugManuallyEdited,
      securityLevelOverride: resolvedSecurityLevel,
    },
  };
}

export function parseConsultationIntake(input: string, currentState: FormState): IntakeDraft {
  const envelope = createIntakeEnvelope(input);
  const rawText = envelope.normalizedText;
  const sections = parseSections(rawText);
  const summary = sections['プロジェクト概要'] || null;
  const users = toList(sections['想定ユーザー']);
  const problem = sections['解決したい課題'] || null;
  const firstDeliverable = sections['最初に作るべきもの'] || null;
  const dataKinds = toList(sections['扱うデータ']);
  const integrations = toList(sections['外部連携候補']);
  const openQuestions = toList(sections['未確定事項']);
  const candidateInputs = toCandidateList(sections['RepoGenesis入力候補']);
  const inferenceText = [
    summary ?? '',
    users.join('\n'),
    problem ?? '',
    firstDeliverable ?? '',
    dataKinds.join('\n'),
    integrations.join('\n'),
    candidateInputs.join('\n'),
  ].join('\n');
  const suggestions = deriveDraftSuggestions(currentState, {
    summary,
    problem,
    firstDeliverable,
    integrations,
    candidateInputs,
    candidateText: sections['RepoGenesis入力候補'] ?? '',
    externalText: sections['外部連携候補'] ?? '',
    combinedText: inferenceText,
  });

  const confirmed: string[] = [];
  const provisional: string[] = [];
  const unresolved: string[] = [];

  if (summary) confirmed.push('プロジェクト概要');
  if (users.length > 0) confirmed.push('想定ユーザー');
  if (problem) confirmed.push('解決したい課題');
  if (dataKinds.length > 0) confirmed.push('扱うデータ');

  if (suggestions.projectName === '未確定プロジェクト') {
    unresolved.push('プロジェクト名');
  } else if (!currentState.project.name) {
    provisional.push('プロジェクト名');
  }

  if (!suggestions.suggestedState.project.owner) {
    provisional.push('責任者');
  }

  if (suggestions.inferredDomains.length === 0) {
    unresolved.push('技術ドメイン');
  } else {
    provisional.push('技術ドメイン');
  }

  provisional.push(`リポジトリ構成（${formatRepoTypeLabel(suggestions.inferredRepoType)} 仮置き）`);
  provisional.push(`進め方の段階数（${suggestions.inferredPhasesCount} 仮置き）`);
  provisional.push('外部APIが必要か');

  for (const key of REQUIRED_SECTION_KEYS) {
    if (!sections[key]) {
      unresolved.push(`${key}（未入力）`);
    }
  }

  return {
    source: 'pasted_consultation',
    rawText,
    sections,
    review: {
      facts: toFactList(summary, users, problem, firstDeliverable, dataKinds, integrations),
      assumptions: toAssumptionList([...new Set(provisional)], suggestions.inferredRepoType, suggestions.inferredPhasesCount),
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
    suggestedState: suggestions.suggestedState,
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
