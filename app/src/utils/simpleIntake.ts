import type { FormState } from '../state/actions.ts';
import { parseConsultationIntake, type ConsultationPromptVariant, type IntakeDraft } from './intakeParser.ts';

export type SimpleIntegrationStatus = 'unknown' | 'none' | 'maybe' | 'yes';
export type SimpleDataSensitivity = 'none' | 'internal' | 'personal';
export type SimpleRepoConfidence = 'unknown' | 'single' | 'multi';

export interface SimpleIntakeState {
  variant: ConsultationPromptVariant;
  summary: string;
  usersText: string;
  problem: string;
  firstDeliverable: string;
  dataKindsText: string;
  integrationStatus: SimpleIntegrationStatus;
  integrationNotes: string;
  owner: string;
  dataSensitivity: SimpleDataSensitivity;
  repoConfidence: SimpleRepoConfidence;
  unresolvedNotes: string;
}

export const initialSimpleIntakeState: SimpleIntakeState = {
  variant: 'internal_tool',
  summary: '',
  usersText: '',
  problem: '',
  firstDeliverable: '',
  dataKindsText: '',
  integrationStatus: 'unknown',
  integrationNotes: '',
  owner: '',
  dataSensitivity: 'internal',
  repoConfidence: 'unknown',
  unresolvedNotes: '',
};

function toBulletLines(text: string): string {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .flatMap((line) => line.split(/[、,]/).map((part) => part.trim()))
    .filter(Boolean);

  if (lines.length === 0) return '- 未記入';
  return lines.map((line) => `- ${line}`).join('\n');
}

function buildUnresolvedLines(input: SimpleIntakeState): string {
  const items: string[] = [];

  if (input.repoConfidence === 'unknown') {
    items.push('1リポジトリで十分かは未確定');
  } else if (input.repoConfidence === 'single') {
    items.push('single repo 前提で進めるが、将来 multi に分ける必要があるかは未確定');
  } else {
    items.push('multi repo 前提で考えるが、最初から分けるべきかは未確定');
  }

  if (input.integrationStatus === 'unknown') {
    items.push('外部APIが本当に必要かは未確定');
  } else if (input.integrationStatus === 'maybe') {
    items.push('外部API連携を初回スコープに含めるかは未確定');
  }

  if (input.unresolvedNotes.trim()) {
    items.push(...input.unresolvedNotes.split('\n').map((line) => line.trim()).filter(Boolean));
  }

  return items.map((item) => `- ${item}`).join('\n');
}

function buildCandidateInputs(input: SimpleIntakeState): string {
  const candidates: string[] = [];

  if (input.variant === 'new_business') {
    candidates.push('- domain は web と ai が候補');
  } else if (input.variant === 'client_project') {
    candidates.push('- domain は web が中心候補');
  } else {
    candidates.push('- domain は web が候補');
  }

  if (input.dataSensitivity === 'personal') {
    candidates.push('- 個人情報や顧客情報を扱う前提で security は medium 以上を想定');
  } else if (input.dataSensitivity === 'internal') {
    candidates.push('- 社内情報を扱う前提で security は medium を検討');
  } else {
    candidates.push('- 機密情報が少ない前提で security は low から開始を検討');
  }

  if (input.integrationStatus === 'yes') {
    candidates.push('- 外部連携あり前提で has_api_keys を想定');
  }

  return candidates.join('\n');
}

export function buildSimpleIntakeMarkdown(input: SimpleIntakeState): string {
  const integrations = input.integrationStatus === 'none'
    ? '- なし'
    : toBulletLines(input.integrationNotes);

  return `## プロジェクト概要
${input.summary.trim()}

## 想定ユーザー
${toBulletLines(input.usersText)}

## 解決したい課題
${input.problem.trim()}

## 最初に作るべきもの
${input.firstDeliverable.trim()}

## 扱うデータ
${toBulletLines(input.dataKindsText)}

## 外部連携候補
${integrations}

## 未確定事項
${buildUnresolvedLines(input)}

## RepoGenesis入力候補
${buildCandidateInputs(input)}`;
}

export function applySimpleIntakeOverrides(
  suggestedState: FormState,
  input: SimpleIntakeState,
): FormState {
  return {
    ...suggestedState,
    project: {
      ...suggestedState.project,
      owner: input.owner.trim() || suggestedState.project.owner,
    },
    security: {
      ...suggestedState.security,
      has_user_data: input.dataSensitivity === 'personal' || suggestedState.security.has_user_data,
      has_ip_sensitive: input.dataSensitivity !== 'none' || suggestedState.security.has_ip_sensitive,
      has_api_keys: input.integrationStatus === 'yes' || suggestedState.security.has_api_keys,
    },
  };
}

export function buildSimpleIntakeDraft(input: SimpleIntakeState, currentState: FormState): IntakeDraft {
  const draft = parseConsultationIntake(buildSimpleIntakeMarkdown(input), currentState);

  return {
    ...draft,
    source: 'pasted_consultation',
    suggestedState: applySimpleIntakeOverrides(draft.suggestedState, input),
  };
}
