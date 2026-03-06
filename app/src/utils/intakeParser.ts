import { slugify } from './slugify.ts';
import type { FormState } from '../state/actions.ts';
import type { Domain } from '../constants/enums.ts';

export interface IntakeReadiness {
  blocking: string[];
  warnings: string[];
}

export interface IntakeDraft {
  source: 'pasted_consultation';
  rawText: string;
  sections: Record<string, string>;
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

const PROMPT_TEMPLATE = `あなたは新規プロジェクトの要件整理アシスタントです。
以下の形式で、非エンジニアでも RepoGenesis に反映しやすいように整理してください。
推測は最小化し、不明点は「未確定事項」に残してください。

## プロジェクト概要

## 想定ユーザー

## 解決したい課題

## 最初に作るべきもの

## 扱うデータ

## 外部連携候補

## 未確定事項

## RepoGenesis入力候補`;

export function getConsultationPromptTemplate(): string {
  return PROMPT_TEMPLATE;
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

  const projectName = currentState.project.name || guessProjectName(summary);
  const projectDescription = currentState.project.description || problem || summary || '';
  const owner = currentState.project.owner || '未設定';
  const slug = currentState.project.slug || slugify(projectName);
  const hasUserData = currentState.security.has_user_data || detectHasUserData(combined);
  const hasIpSensitive = currentState.security.has_ip_sensitive || detectHasIpSensitive(combined);
  const hasApiKeys = currentState.security.has_api_keys;

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

  provisional.push('リポジトリ構成');
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
      repo_type: currentState.structure.repo_type || 'single',
    },
    workflow: {
      ...currentState.workflow,
      phases_count: currentState.workflow.phases_count || 3,
    },
    slugManuallyEdited: Boolean(currentState.project.slug),
    securityLevelOverride: currentState.securityLevelOverride,
  };

  return {
    source: 'pasted_consultation',
    rawText,
    sections,
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
