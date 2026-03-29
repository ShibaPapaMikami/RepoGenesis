import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProjectSpec, stringifyProjectSpec } from '../src/utils/buildProjectSpec.ts';
import { PROJECT_SPEC_FILENAME, SUPPORTED_SPEC_VERSION } from '../src/constants/spec.ts';
import { parseConsultationIntake } from '../src/utils/intakeParser.ts';
import { buildSimpleIntakeDraft, initialSimpleIntakeState } from '../src/utils/simpleIntake.ts';
import type { FormState } from '../src/state/actions.ts';
import { getConsultationTestTemplate } from './fixtures/consultationTemplates.ts';
import bundledGenerator from '../src/vendor/generateFromSpec.js';

const generateFromSpec = bundledGenerator.generateFromSpec as (input: unknown, options?: unknown) => Map<string, string>;

function makeState(): FormState {
  return {
    project: {
      name: 'RepoGenesis',
      slug: 'repogenesis',
      description: 'Repository structure generator',
      owner: 'Gugenka',
    },
    tech: {
      domains: ['web'],
      primary_language: 'typescript',
      frameworks: ['React', 'Vite'],
      ai_tools: ['claude_code'],
      ai_tool_detail: '',
    },
    security: {
      level: 'medium',
      has_api_keys: true,
      has_user_data: true,
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
    planning: {
      tech_decisions: [],
      external_dependencies: [],
    },
    slugManuallyEdited: false,
    securityLevelOverride: null,
  };
}

test('buildProjectSpec should always include supported specVersion', () => {
  const spec = buildProjectSpec(makeState());
  assert.equal(spec.specVersion, SUPPORTED_SPEC_VERSION);
});

test('buildProjectSpec should map form state to ProjectSpec shape', () => {
  const state = makeState();
  state.planning.tech_decisions.push({
    topic: 'AI API',
    choice: 'OpenAI API',
    status: 'adopted',
    rationale: 'Use hosted summaries',
    decision_date: '2026-03-19',
    notes: '',
  });
  state.planning.external_dependencies.push({
    name: 'OpenAI API',
    category: 'ai_api',
    status: 'adopted',
    purpose: 'Generate summaries',
    owner: 'AI team',
    source: 'https://platform.openai.com/',
    license: 'Commercial',
    env_vars: ['OPENAI_API_KEY'],
    data_outbound: true,
    notes: '',
  });
  const spec = buildProjectSpec(state);

  assert.equal(spec.project.slug, state.project.slug);
  assert.equal(spec.structure.repo_type, state.structure.repo_type);
  assert.equal(spec.workflow.phases_count, state.workflow.phases_count);
  assert.equal(Array.isArray(spec.tech.frameworks), true);
  assert.deepEqual(spec.tech.ai_tools, ['claude_code']);
  assert.equal(spec.tech.ai_tool, 'claude_cli');
  assert.equal(spec.planning.tech_decisions[0].choice, 'OpenAI API');
  assert.deepEqual(spec.planning.external_dependencies[0].env_vars, ['OPENAI_API_KEY']);
});

test('buildProjectSpec should preserve codex in ai_tools', () => {
  const state = makeState();
  state.tech.ai_tools = ['codex', 'claude_code'];
  const spec = buildProjectSpec(state);

  assert.deepEqual(spec.tech.ai_tools, ['codex', 'claude_code']);
  assert.equal(spec.tech.ai_tool, 'claude_cli');
  assert.equal(spec.tech.ai_tool_detail.includes('Codex'), true);
});

test('buildProjectSpec should set ISO created_at timestamp', () => {
  const spec = buildProjectSpec(makeState());
  assert.ok(spec.project.created_at);
  assert.equal(Number.isNaN(Date.parse(spec.project.created_at as string)), false);
});

test('stringifyProjectSpec should place specVersion as first top-level key', () => {
  const json = stringifyProjectSpec(makeState());
  assert.equal(json.startsWith('{\n  "specVersion":'), true);
});

test('project spec download filename should be fixed', () => {
  assert.equal(PROJECT_SPEC_FILENAME, 'project_spec.json');
});

test('buildProjectSpec should deterministically map consultation draft state into spec', () => {
  const intake = `## プロジェクト概要
社内の案件相談と進行管理をまとめるAI活用ツール

## 想定ユーザー
- 営業
- PM

## 解決したい課題
相談履歴と判断ログが Slack とスプレッドシートに分散している

## 最初に作るべきもの
案件一覧と相談履歴を見られる Web 画面

## 扱うデータ
- 案件名
- 担当者
- 顧客情報

## 外部連携候補
- Slack

## 未確定事項
- 権限管理を初期から入れるか未確定

## RepoGenesis入力候補
- domain は web と ai が候補
- security は medium を想定
- single repo を想定`;

  const draft = parseConsultationIntake(intake, {
    ...makeState(),
    project: {
      name: 'Old Project',
      slug: 'old-project',
      description: '古い説明',
      owner: 'Gugenka BizOps',
    },
  });
  const spec = buildProjectSpec(draft.suggestedState);

  assert.equal(spec.project.name, '社内の案件相談と進行管理をまとめるAI活用ツール');
  assert.equal(spec.project.description, '社内の案件相談と進行管理をまとめるAI活用ツール');
  assert.equal(spec.project.owner, 'Gugenka BizOps');
  assert.deepEqual(spec.tech.domains, ['web', 'ai']);
  assert.equal(spec.security.level, 'medium');
  assert.equal(spec.structure.repo_type, 'single');
  assert.equal(spec.workflow.phases_count, 4);
});

test('buildProjectSpec should deterministically map simple intake draft state into spec', () => {
  const draft = buildSimpleIntakeDraft({
    ...initialSimpleIntakeState,
    variant: 'client_project',
    summary: 'クライアント向けの問い合わせ・制作進行管理画面',
    usersText: 'クライアント担当者\n制作ディレクター',
    problem: '依頼内容と進行状況がメールとチャットに散らばっている',
    firstDeliverable: '案件ごとの問い合わせ履歴と進行ステータスを見られる画面',
    dataKindsText: '案件名\nクライアント担当者\n進行ログ',
    integrationStatus: 'yes',
    integrationNotes: 'Backlog, Google Drive',
    owner: 'Gugenka Delivery',
    dataSensitivity: 'personal',
    repoConfidence: 'multi',
  }, makeState());
  const spec = buildProjectSpec(draft.suggestedState);

  assert.equal(spec.project.owner, 'Gugenka Delivery');
  assert.equal(spec.security.has_api_keys, true);
  assert.equal(spec.security.has_user_data, true);
  assert.equal(spec.structure.repo_type, 'multi');
  assert.deepEqual(
    spec.structure.repos.map((repo) => repo.name),
    ['frontend', 'backend'],
  );
  assert.equal(spec.workflow.phases_count, 4);
});

test('buildProjectSpec should support the named meeting transcription template', () => {
  const draft = parseConsultationIntake(getConsultationTestTemplate('meeting_transcription_internal_tool'), {
    ...makeState(),
    project: {
      name: '',
      slug: '',
      description: '',
      owner: 'Gugenka Ops',
    },
    tech: {
      ...makeState().tech,
      domains: ['web', 'cli'],
    },
  });
  const spec = buildProjectSpec(draft.suggestedState);

  assert.equal(spec.project.name, '社内会議音声文字起こしツール');
  assert.equal(spec.project.owner, 'Gugenka Ops');
  assert.equal(spec.structure.repo_type, 'single');
  assert.equal(spec.workflow.phases_count, 4);
  assert.equal(spec.security.has_ip_sensitive, true);
  assert.equal(spec.security.level, 'medium');
  assert.deepEqual(spec.tech.domains, []);
});

test('buildProjectSpec should raise security level to the minimum required by flags', () => {
  const state = makeState();
  state.security.level = 'low';
  state.security.has_ip_sensitive = true;
  state.securityLevelOverride = null;

  const spec = buildProjectSpec(state);
  assert.equal(spec.security.level, 'medium');
});

test('buildProjectSpec should feed TTS-style intake into generator-specific docs without stale defaults', () => {
  const intake = `## プロジェクト概要
日本語TTS音声を人間らしい演技表現に変換する社内ツール。既存TTSで生成した音声に対し、感情・揺らぎ・息・声の崩れを後処理で付与し、XRやNPC、配信用途で利用可能な品質にする。

## 想定ユーザー
- XRコンテンツ制作チーム
- Unityエンジニア

## 解決したい課題
- TTS音声が平坦で演技用途に使えない

## 最初に作るべきもの
テキスト入力から加工済み音声（wav）を出力するCLIツール。感情パラメータ生成→TTS生成→音声後処理までを一括実行する最小構成。

## 扱うデータ
- 入力テキスト
- 感情パラメータ（emotion, pitch, speed, breath, break）
- 生成音声データ（wav）

## 外部連携候補
- GitHub上のIrodori-TTSリポジトリ
- Unity

## 参考実装・関連リンク
- https://github.com/Aratako/Irodori-TTS

## 未確定事項
- Irodori-TTSのローカル実行か他方式での利用か
- 感情パラメータ生成をルールベースかLLMか
- Unity連携の方法（ファイル連携かAPIか）

## RepoGenesis入力候補
- domain は ai（将来的に unity を追加）
- primary_language は Python
- dependency に GitHub上の Irodori-TTS を含む
- 実行形態は CLI`;

  const draft = parseConsultationIntake(intake, makeState());
  const spec = buildProjectSpec(draft.suggestedState);
  const files = generateFromSpec(spec);
  const requirements = files.get('docs/REQUIREMENTS.md') ?? '';
  const roadmap = files.get('docs/ROADMAP.md') ?? '';

  assert.deepEqual(spec.tech.domains, ['ai', 'unity', 'cli']);
  assert.equal(spec.tech.primary_language, 'python');
  assert.deepEqual(spec.tech.frameworks, []);
  assert.equal(
    spec.planning.external_dependencies.some((item) =>
      item.name === 'Aratako/Irodori-TTS' && item.status === 'adopted'),
    true,
  );
  assert.equal(requirements.includes('R4: Provide a stable operator-facing CLI contract'), true);
  assert.equal(requirements.includes('R5: Integrate adopted external dependencies intentionally'), true);
  assert.equal(requirements.includes('Aratako/Irodori-TTS'), true);
  assert.equal(roadmap.includes('Resolve the highest-risk open planning items'), true);
  assert.equal(roadmap.includes('Integrate adopted dependencies needed for the first workflow: Aratako/Irodori-TTS.'), true);
});
