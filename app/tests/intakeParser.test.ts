import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assessIntakeReadiness,
  CONSULTATION_PROMPT_OPTIONS,
  deriveDraftSuggestions,
  getConsultationPromptTemplate,
  getConsultationReviewHints,
  parseConsultationIntake,
  updateDraftOpenQuestions,
} from '../src/utils/intakeParser.ts';
import { createIntakeEnvelope } from '../src/utils/intakeProvider.ts';
import type { FormState } from '../src/state/actions.ts';
import { getConsultationTestTemplate } from './fixtures/consultationTemplates.ts';
import { validate } from '../src/utils/validation.ts';
import { CONSULTATION_TEST_TEMPLATES } from '../src/data/consultationTestTemplates.ts';

function makeState(): FormState {
  return {
    project: {
      name: '',
      slug: '',
      description: '',
      owner: '',
    },
    tech: {
      domains: [],
      primary_language: 'typescript',
      frameworks: [],
      ai_tools: ['claude_code'],
      ai_tool_detail: '',
    },
    security: {
      level: 'low',
      has_api_keys: false,
      has_user_data: false,
      has_payment_data: false,
      has_ip_sensitive: false,
      has_credentials: false,
    },
    structure: {
      repo_type: 'single',
      repos: [],
    },
    workflow: {
      phases_count: 3,
    },
    slugManuallyEdited: false,
    securityLevelOverride: null,
  };
}

const SAMPLE_INPUT = `## プロジェクト概要
社内向けのAI活用案件管理ツールを作りたい

## 想定ユーザー
- 営業
- PM

## 解決したい課題
案件ごとの相談履歴と進行状況が分散している

## 最初に作るべきもの
案件一覧と相談履歴を見られる画面

## 扱うデータ
案件名、担当者、顧客情報

## 外部連携候補
Slack
Google Drive

## 未確定事項
1リポジトリで十分かは未確定
外部APIが本当に必要かは未確定`;

test('parseConsultationIntake should extract core sections into a draft', () => {
  const draft = parseConsultationIntake(SAMPLE_INPUT, makeState());

  assert.equal(draft.extracted.summary, '社内向けのAI活用案件管理ツールを作りたい');
  assert.deepEqual(draft.extracted.users, ['営業', 'PM']);
  assert.equal(draft.extracted.problem, '案件ごとの相談履歴と進行状況が分散している');
  assert.equal(draft.extracted.firstDeliverable, '案件一覧と相談履歴を見られる画面');
  assert.deepEqual(draft.extracted.integrations, ['Slack', 'Google Drive']);
  assert.equal(draft.review.facts.some((item) => item.includes('概要: 社内向けのAI活用案件管理ツールを作りたい')), true);
  assert.equal(draft.review.openQuestions.some((item) => item.includes('1リポジトリで十分かは未確定')), true);
});

test('parseConsultationIntake should create provisional state without changing schema shape', () => {
  const draft = parseConsultationIntake(SAMPLE_INPUT, makeState());

  assert.equal(draft.suggestedState.project.name.length > 0, true);
  assert.equal(draft.suggestedState.project.slug.length > 0, true);
  assert.equal(draft.suggestedState.tech.domains.includes('web'), true);
  assert.equal(draft.suggestedState.tech.domains.includes('ai'), true);
  assert.equal(draft.suggestedState.security.has_user_data, true);
  assert.equal(draft.certainty.provisional.includes('リポジトリ構成（シングル 仮置き）'), true);
  assert.equal(draft.certainty.provisional.includes('進め方の段階数（4 仮置き）'), true);
  assert.equal(draft.suggestedState.workflow.phases_count, 4);
  assert.equal(draft.review.assumptions.some((item) => item.includes('リポジトリ構成は シングル を仮置き')), true);
});

test('parseConsultationIntake should mark missing required sections as unresolved', () => {
  const draft = parseConsultationIntake('## プロジェクト概要\nテスト', makeState());

  assert.equal(draft.certainty.unresolved.includes('想定ユーザー（未入力）'), true);
  assert.equal(draft.certainty.unresolved.includes('解決したい課題（未入力）'), true);
  assert.equal(draft.certainty.unresolved.includes('扱うデータ（未入力）'), true);
  assert.equal(draft.certainty.unresolved.includes('未確定事項（未入力）'), true);
});

test('parseConsultationIntake should accept heading lines without markdown markers', () => {
  const input = `プロジェクト概要
社内ミーティング音声を文字起こしして保存する社内ツール

想定ユーザー
経営・マネジメント
プロジェクトマネージャー

解決したい課題
議事録作成に時間がかかり、会議内容の共有漏れが起きやすい

最初に作るべきもの
音声ファイルを入力して文字起こし結果を確認できる画面

扱うデータ
会議音声
文字起こしテキスト

外部連携候補
未定

未確定事項
ローカル処理で十分な精度を出せるか未確定

RepoGenesis入力候補
domain は web が候補`;
  const draft = parseConsultationIntake(input, makeState());

  assert.equal(draft.review.facts.length > 0, true);
  assert.equal(draft.extracted.summary?.includes('文字起こしして保存する社内ツール'), true);
  assert.equal(draft.extracted.users.includes('経営・マネジメント'), true);
  assert.equal(draft.extracted.problem?.includes('議事録作成に時間がかかり'), true);
});

test('assessIntakeReadiness should separate blocking items from warnings', () => {
  const draft = parseConsultationIntake('## プロジェクト概要\nテスト', makeState());
  const readiness = assessIntakeReadiness(draft);

  assert.equal(readiness.blocking.includes('想定ユーザー（未入力）'), true);
  assert.equal(readiness.blocking.includes('解決したい課題（未入力）'), true);
  assert.equal(readiness.warnings.includes('リポジトリ構成（シングル 仮置き）'), true);
  assert.equal(readiness.warnings.includes('外部APIが必要か'), true);
});

test('assessIntakeReadiness should treat unresolved domains as warnings', () => {
  const draft = parseConsultationIntake(getConsultationTestTemplate('meeting_transcription_internal_tool'), makeState());
  const readiness = assessIntakeReadiness(draft);

  assert.equal(readiness.blocking.includes('技術ドメイン'), false);
  assert.equal(readiness.warnings.includes('技術ドメイン'), true);
});

test('parseConsultationIntake should infer multi repo when deliverable mentions ui and api parts', () => {
  const input = `## プロジェクト概要
テスト

## 想定ユーザー
- 開発者

## 解決したい課題
管理画面と API を分けて整理したい

## 最初に作るべきもの
管理画面と API を先に作る

## 扱うデータ
- 案件情報

## 未確定事項
- なし`;
  const draft = parseConsultationIntake(input, makeState());

  assert.equal(draft.suggestedState.structure.repo_type, 'multi');
  assert.deepEqual(
    draft.suggestedState.structure.repos.map((repo) => repo.name),
    ['frontend-admin', 'backend'],
  );
  assert.equal(draft.certainty.provisional.includes('リポジトリ構成（マルチ 仮置き）'), true);
});

test('parseConsultationIntake should prefer consultation-derived project fields over stale form values', () => {
  const state = makeState();
  state.project.name = 'Old Test Project';
  state.project.slug = 'old-test-project';
  state.project.description = '以前の説明';
  state.project.owner = '';
  state.slugManuallyEdited = false;

  const input = `## プロジェクト概要
社内ミーティングの音声を文字起こしして保存する社内ツール

## 想定ユーザー
- 経営

## 解決したい課題
議事録作成に時間がかかる

## 扱うデータ
- 会議音声

## 未確定事項
- ローカル処理の精度は未確定`;
  const draft = parseConsultationIntake(input, state);

  assert.equal(draft.suggestedState.project.name.includes('文字起こし'), true);
  assert.equal(draft.suggestedState.project.name.length <= 24, true);
  assert.notEqual(draft.suggestedState.project.name, 'Old Test Project');
  assert.equal(draft.suggestedState.project.slug, 'internal-meeting-audio-transcription-tool');
  assert.equal(draft.suggestedState.project.description, '議事録作成に時間がかかる');
  assert.equal(draft.suggestedState.project.owner, '');
});

test('parseConsultationIntake should prefer quoted project titles from fixed templates', () => {
  const contractReview = CONSULTATION_TEST_TEMPLATES.find((template) => template.id === 'test_contract_review');
  assert.ok(contractReview);

  const draft = parseConsultationIntake(contractReview.content, makeState());

  assert.equal(draft.suggestedState.project.name, '契約書レビュー依頼管理システム');
  assert.equal(draft.suggestedState.project.slug, 'contract-review-request-management-system');
});

test('parseConsultationIntake should drop stale manual slug when the pasted project changes', () => {
  const contractReview = CONSULTATION_TEST_TEMPLATES.find((template) => template.id === 'test_contract_review');
  assert.ok(contractReview);

  const state = makeState();
  state.project.name = 'AI議事録整理ツール';
  state.project.slug = 'g-minutes';
  state.slugManuallyEdited = true;

  const draft = parseConsultationIntake(contractReview.content, state);

  assert.equal(draft.suggestedState.project.name, '契約書レビュー依頼管理システム');
  assert.equal(draft.suggestedState.project.slug, 'contract-review-request-management-system');
});

test('parseConsultationIntake should avoid false positive domains for calendar and transcription text', () => {
  const input = getConsultationTestTemplate('meeting_transcription_internal_tool');
  const state = makeState();
  state.tech.domains = ['web', 'cli'];
  const draft = parseConsultationIntake(input, state);

  assert.deepEqual(draft.suggestedState.tech.domains, []);
  assert.equal(draft.suggestedState.tech.domains.includes('xr'), false);
  assert.equal(draft.suggestedState.tech.domains.includes('cli'), false);
  assert.equal(draft.suggestedState.tech.domains.includes('ai'), false);
  assert.equal(draft.suggestedState.project.name.includes('文字起こし'), true);
  assert.equal(draft.extracted.integrations.includes('Google Calendar（会議と議事録の紐付け）'), true);
  assert.equal(draft.review.openQuestions.some((item) => item.includes('ツールのUI形式')), true);
});

test('validate should allow missing owner and domains for consultation-driven drafts', () => {
  const draft = parseConsultationIntake(getConsultationTestTemplate('meeting_transcription_internal_tool'), makeState());
  const errors = validate(draft.suggestedState);

  assert.equal(errors['project.owner'], undefined);
  assert.equal(errors['tech.domains'], undefined);
});

test('parseConsultationIntake should apply candidate inputs for domain security and repo hints', () => {
  const input = `## プロジェクト概要
社内の相談記録をまとめるツール

## 想定ユーザー
- 営業

## 解決したい課題
相談履歴の確認に時間がかかる

## 扱うデータ
- 顧客情報

## 未確定事項
- 初回スコープは未確定

## RepoGenesis入力候補
- domain は web と ai が候補
- security は medium を想定
- single repo を想定
- has_api_keys を想定`;
  const draft = parseConsultationIntake(input, makeState());

  assert.deepEqual(draft.suggestedState.tech.domains, ['web', 'ai']);
  assert.equal(draft.suggestedState.security.level, 'medium');
  assert.equal(draft.suggestedState.security.has_api_keys, true);
  assert.equal(draft.suggestedState.structure.repo_type, 'single');
});

test('deriveDraftSuggestions should build provider-independent suggested state', () => {
  const suggestions = deriveDraftSuggestions(makeState(), {
    summary: '社内の案件相談を整理するツール',
    problem: 'Slack とスプレッドシートに情報が散らばっている',
    firstDeliverable: '案件一覧と相談履歴を見られる Web 画面',
    integrations: ['Slack'],
    candidateInputs: ['domain は web と ai が候補', 'security は medium を想定', 'single repo を想定'],
    combinedText: '社内の案件相談を整理するツール\nSlack とスプレッドシートに情報が散らばっている\n案件一覧と相談履歴を見られる Web 画面',
  });

  assert.equal(suggestions.suggestedState.project.name, '社内の案件相談を整理するツール');
  assert.equal(suggestions.suggestedState.project.description, 'Slack とスプレッドシートに情報が散らばっている');
  assert.deepEqual(suggestions.suggestedState.tech.domains, ['web', 'ai']);
  assert.equal(suggestions.suggestedState.security.level, 'medium');
  assert.equal(suggestions.suggestedState.structure.repo_type, 'single');
  assert.equal(suggestions.suggestedState.workflow.phases_count, 4);
});

test('createIntakeEnvelope should normalize provider-agnostic intake input', () => {
  const envelope = createIntakeEnvelope('## プロジェクト概要\r\nテスト\r\n', {
    provider: 'chatgpt',
    model: 'gpt-x',
    promptVersion: 'v1',
  });

  assert.equal(envelope.source, 'provider_markdown');
  assert.equal(envelope.normalizedText, '## プロジェクト概要\nテスト');
  assert.equal(envelope.provider.provider, 'chatgpt');
  assert.equal(envelope.provider.model, 'gpt-x');
});

test('getConsultationPromptTemplate should return variant-specific guidance', () => {
  const internalPrompt = getConsultationPromptTemplate('internal_tool');
  const businessPrompt = getConsultationPromptTemplate('new_business');

  assert.equal(CONSULTATION_PROMPT_OPTIONS.length, 3);
  assert.equal(/社内ツール/.test(internalPrompt), true);
  assert.equal(/新規事業/.test(businessPrompt), true);
  assert.equal(/## プロジェクト概要/.test(internalPrompt), true);
});

test('getConsultationReviewHints should return variant-specific review points', () => {
  const internalHints = getConsultationReviewHints('internal_tool');
  const clientHints = getConsultationReviewHints('client_project');

  assert.equal(/社内ツール/.test(internalHints.title), true);
  assert.equal(internalHints.points.length > 0, true);
  assert.equal(/クライアント案件/.test(clientHints.title), true);
});

test('updateDraftOpenQuestions should update review and extracted open questions', () => {
  const draft = parseConsultationIntake(SAMPLE_INPUT, makeState());
  const updated = updateDraftOpenQuestions(draft, '権限管理を初期から入れるか\nsingle repo で十分か');

  assert.deepEqual(updated.review.openQuestions, ['権限管理を初期から入れるか', 'single repo で十分か']);
  assert.deepEqual(updated.extracted.openQuestions, ['権限管理を初期から入れるか', 'single repo で十分か']);
  assert.equal(updated.sections['未確定事項'].includes('権限管理を初期から入れるか'), true);
});
