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
    planning: {
      tech_decisions: [],
      external_dependencies: [],
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

## 参考実装・関連リンク
- https://github.com/example/internal-sales-dashboard

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
  assert.deepEqual(draft.extracted.referenceLinks, ['https://github.com/example/internal-sales-dashboard']);
  assert.equal(draft.review.facts.some((item) => item.includes('概要: 社内向けのAI活用案件管理ツールを作りたい')), true);
  assert.equal(draft.review.openQuestions.some((item) => item.includes('1リポジトリで十分かは未確定')), true);
});

test('parseConsultationIntake should derive planning suggestions from input candidates and integrations', () => {
  const input = `## プロジェクト概要
AI で契約を要約する社内ツール

## 想定ユーザー
- 契約管理担当

## 解決したい課題
契約の要点確認に時間がかかる

## 最初に作るべきもの
契約PDFを登録して要約を保存する画面

## 扱うデータ
- 契約PDF

## 外部連携候補
- Slack
- Supabase Auth

## 未確定事項
- 通知は Slack かメールか未確定

## RepoGenesis入力候補
- 採用するAI API: OpenAI API
- 採用するモデル: gpt-5.4
- 採用する外部OSS / GitHubリポジトリ / npm package: opendataloader-pdf
- DB/Storage は Supabase を採用
- まだ決めきっていない項目: OCR対応`;

  const draft = parseConsultationIntake(input, makeState());

  assert.equal(
    draft.suggestedState.planning.tech_decisions.some((item) =>
      item.topic === 'AI API' && item.choice === 'OpenAI API' && item.status === 'adopted'),
    true,
  );
  assert.equal(
    draft.suggestedState.planning.tech_decisions.some((item) =>
      item.choice === 'gpt-5.4'),
    true,
  );
  assert.equal(
    draft.suggestedState.planning.external_dependencies.some((item) =>
      item.name === 'OpenAI API' && item.env_vars.includes('OPENAI_API_KEY')),
    true,
  );
  assert.equal(
    draft.suggestedState.planning.external_dependencies.some((item) =>
      item.name === 'Slack' && item.category === 'notification'),
    true,
  );
  assert.equal(
    draft.suggestedState.planning.external_dependencies.some((item) =>
      item.name === 'Supabase Auth' && item.category === 'auth'),
    true,
  );
  assert.equal(
    draft.suggestedState.planning.external_dependencies.some((item) =>
      item.name === 'Supabase' && item.category === 'database' && item.status === 'adopted'),
    true,
  );
  assert.equal(
    draft.suggestedState.planning.external_dependencies.some((item) =>
      item.name === 'Supabase Storage' && item.category === 'storage' && item.status === 'adopted'),
    true,
  );
});

test('parseConsultationIntake should retain reference links and convert GitHub URLs into planning dependencies', () => {
  const input = `## プロジェクト概要
社内向けFAQ整備ツール

## 想定ユーザー
- CS

## 解決したい課題
回答テンプレートが散在している

## 最初に作るべきもの
FAQ一覧と編集画面

## 扱うデータ
- FAQ本文

## 外部連携候補
- Slack

## 参考実装・関連リンク
- https://github.com/example/faq-starter
- https://example.com/how-to-build-faq

## 未確定事項
- 権限管理を初回から入れるか未確定`;

  const draft = parseConsultationIntake(input, makeState());

  assert.deepEqual(draft.extracted.referenceLinks, [
    'https://github.com/example/faq-starter',
    'https://example.com/how-to-build-faq',
  ]);
  assert.equal(
    draft.suggestedState.planning.external_dependencies.some((item) =>
      item.name === 'example/faq-starter' && item.category === 'github_repo' && item.source === 'https://github.com/example/faq-starter'),
    true,
  );
});

test('parseConsultationIntake should prefer explicit key-value planning hints and normalize dependencies', () => {
  const input = `## プロジェクト概要
締結済み契約を社内で保管し、AIで要約する社内Webツール

## 想定ユーザー
- 契約管理担当者

## 解決したい課題
契約の要点確認に時間がかかる

## 最初に作るべきもの
契約PDFの登録と一覧画面

## 扱うデータ
- 契約PDF

## 外部連携候補
- Slack

## 未確定事項
- メール通知を初期スコープに含めるか

## RepoGenesis入力候補
- name: 契約台帳・期限管理ツール
- slug: contract-ledger-deadline-manager
- domains: web
- framework: Next.js
- database: Supabase
- storage: Supabase Storage
- auth: Supabase Auth
- ai_api: OpenAI API
- ai_model: gpt-5.4
- pdf_extractor: opendataloader-pdf
- notification: Slack first, email later
- repo_style: single`;

  const draft = parseConsultationIntake(input, makeState());
  const deps = draft.suggestedState.planning.external_dependencies;

  assert.equal(draft.suggestedState.project.name, '契約台帳・期限管理ツール');
  assert.equal(draft.suggestedState.project.slug, 'contract-ledger-deadline-manager');
  assert.equal(
    deps.some((item) => item.name === 'OpenAI API' && item.category === 'ai_api' && item.status === 'adopted'),
    true,
  );
  assert.equal(
    deps.some((item) => item.name === 'Supabase' && item.category === 'database' && item.status === 'adopted'),
    true,
  );
  assert.equal(
    deps.some((item) => item.name === 'Supabase Storage' && item.category === 'storage' && item.status === 'adopted'),
    true,
  );
  assert.equal(
    deps.some((item) => item.name === 'Supabase Auth' && item.category === 'auth' && item.status === 'adopted'),
    true,
  );
  assert.equal(
    deps.some((item) => item.name === 'opendataloader-pdf' && item.category === 'npm_package' && item.status === 'adopted'),
    true,
  );
  assert.equal(
    deps.filter((item) => item.name === 'Slack' && item.category === 'notification').length,
    1,
  );
  assert.equal(
    deps.some((item) => item.name === 'Slack' && item.category === 'notification' && item.status === 'adopted'),
    true,
  );
  assert.equal(
    deps.some((item) => item.name === 'Email provider' && item.category === 'notification' && item.status === 'candidate'),
    true,
  );
  assert.deepEqual(draft.suggestedState.tech.domains, ['web']);
  assert.equal(
    deps.some((item) => item.name === 'single'),
    false,
  );
  assert.equal(
    draft.suggestedState.planning.tech_decisions.some((item) =>
      item.topic === 'Notification' && item.choice === 'Slack' && item.status !== 'adopted'),
    false,
  );
  assert.equal(
    draft.suggestedState.planning.tech_decisions.some((item) =>
      item.topic === 'Notification' && item.choice === 'Email provider'),
    false,
  );
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
  assert.equal(draft.suggestedState.project.description, '社内ミーティングの音声を文字起こしして保存する社内ツール');
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

test('parseConsultationIntake should treat explicit candidate inputs as authoritative for TTS-style briefs', () => {
  const state = makeState();
  state.tech.domains = ['web'];
  state.tech.primary_language = 'typescript';
  state.tech.frameworks = ['React', 'Vite'];

  const input = `## プロジェクト概要
日本語TTS音声を人間らしい演技表現に変換する社内ツール。既存TTSで生成した音声に対し、感情・揺らぎ・息・声の崩れを後処理で付与し、XRやNPC、配信用途で利用可能な品質にする。

## 想定ユーザー
- XRコンテンツ制作チーム
- Unityエンジニア
- テクニカルアーティスト
- 企画・演出担当

## 解決したい課題
- TTS音声が平坦で演技用途に使えない
- ボイス収録コストが高く、差し替えや量産が非効率

## 最初に作るべきもの
テキスト入力から加工済み音声（wav）を出力するCLIツール。感情パラメータ生成→TTS生成→音声後処理までを一括実行する最小構成。

## 扱うデータ
- 入力テキスト
- 感情パラメータ（emotion, pitch, speed, breath, break）
- 生成音声データ（wav）
- 加工後音声データ

## 外部連携候補
- GitHub上のIrodori-TTSリポジトリ
- Unity
- VRChat

## 参考実装・関連リンク
- https://github.com/Aratako/Irodori-TTS

## 未確定事項
- Irodori-TTSのローカル実行か他方式での利用か
- 感情パラメータ生成をルールベースかLLMか
- リアルタイム処理を初期スコープに含めるか
- Unity連携の方法（ファイル連携かAPIか）
- 商用利用時のライセンス整理
- UIの有無と優先度
- 機密情報の扱い範囲（社内限定か外部展開を想定するか）

## RepoGenesis入力候補
- domain は ai（将来的に unity を追加）
- primary_language は Python
- framework は Typer
- environment は local（Mac想定）
- dependency に GitHub上の Irodori-TTS を含む
- audio processing に librosa / numpy / soundfile を含む
- architecture は text → emotion parameter generation → TTS synthesis → audio post-processing → wav output
- core feature は emotion parameter layer と audio post-processing
- 実行形態は CLI
- 将来API化する場合は FastAPI が候補
- security は low〜medium（社内利用想定）`;

  const draft = parseConsultationIntake(input, state);
  const planning = draft.suggestedState.planning;

  assert.deepEqual(draft.suggestedState.tech.domains, ['ai', 'unity', 'cli']);
  assert.equal(draft.suggestedState.tech.primary_language, 'python');
  assert.deepEqual(draft.suggestedState.tech.frameworks, ['Typer']);
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.topic === 'Primary language' && item.choice === 'python' && item.status === 'adopted'),
    true,
  );
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.topic === 'Framework' && item.choice === 'Typer' && item.status === 'adopted'),
    true,
  );
  assert.equal(
    planning.tech_decisions.some((item) => item.choice === 'typescript'),
    false,
  );
  assert.equal(
    planning.external_dependencies.some((item) =>
      item.name === 'Aratako/Irodori-TTS'
      && item.category === 'github_repo'
      && item.status === 'adopted'
      && item.source === 'https://github.com/Aratako/Irodori-TTS'),
    true,
  );
  assert.equal(
    planning.external_dependencies.some((item) =>
      item.name === 'librosa'
      && item.category === 'oss'
      && item.status === 'adopted'
      && item.source === 'https://librosa.org/'
      && item.license === 'ISC'),
    true,
  );
  assert.equal(
    planning.external_dependencies.some((item) =>
      item.name === 'numpy'
      && item.category === 'oss'
      && item.status === 'adopted'
      && item.source === 'https://numpy.org/'
      && item.license === 'BSD-3-Clause'),
    true,
  );
  assert.equal(
    planning.external_dependencies.some((item) =>
      item.name === 'soundfile'
      && item.category === 'oss'
      && item.status === 'adopted'
      && item.source === 'https://python-soundfile.readthedocs.io/'
      && item.license === 'BSD-3-Clause'),
    true,
  );
  assert.equal(
    planning.tech_decisions.filter((item) => item.topic === 'Audio processing stack').length,
    1,
  );
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.topic === 'Audio processing stack'
      && item.choice === 'librosa, numpy, soundfile'
      && item.status === 'adopted'),
    true,
  );
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.topic === 'Core workflow architecture'
      && item.choice === 'text -> emotion parameter generation -> TTS synthesis -> audio post-processing -> wav output'
      && item.status === 'adopted'),
    true,
  );
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.topic === 'Core feature' && item.choice === 'emotion parameter layer' && item.status === 'adopted'),
    true,
  );
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.topic === 'Core feature' && item.choice === 'audio post-processing' && item.status === 'adopted'),
    true,
  );
  assert.equal(
    planning.tech_decisions.some((item) => item.status === 'open' && item.topic === 'Unity handoff'),
    true,
  );
  assert.equal(
    planning.tech_decisions.some((item) => item.status === 'open' && item.topic === 'Licensing'),
    true,
  );
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.topic === 'Execution environment' && item.choice === 'local（Mac想定）' && item.status === 'candidate'),
    true,
  );
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.topic === 'API framework' && item.choice === 'FastAPI' && item.status === 'candidate'),
    true,
  );
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.status === 'open' && item.topic === 'Data sensitivity boundary'),
    true,
  );
  assert.equal(draft.suggestedState.security.level, 'medium');
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.topic === 'Security level' && item.choice === 'medium'),
    true,
  );
});

test('parseConsultationIntake should parse bullet-style framework hints and dedupe model decisions for distributed audio web briefs', () => {
  const input = `## プロジェクト概要
ローカル推論（Windows RTX4090）で動作するTTS・リアルタイム会話を統合したWebUI。Macからブラウザ操作可能。音声収録・参照音声・生成音声の管理とノイズ処理を一体化。

## 想定ユーザー
• 音声制作チーム
• 演出担当

## 解決したい課題
• 高品質な音声生成と後処理を1つの画面で扱いたい

## 最初に作るべきもの
ブラウザからWindows推論機へ指示を送り、生成音声とノイズ処理結果を確認できるWebUI。

## 扱うデータ
• 入力テキスト
• 参照音声
• 生成音声

## 外部連携候補
• https://github.com/rikorose/deepfilternet
• https://github.com/modelscope/ClearerVoice-Studio

## 未確定事項
• 商用利用可否（CC BY-NC制約の扱い）
• LLMのローカル or API選択
• リアルタイム会話の遅延許容値

## RepoGenesis入力候補
• domain は web と ai と xr が候補
• framework は Next.js + FastAPI 想定
• model は Qwen
• security は medium を想定`;

  const draft = parseConsultationIntake(input, makeState());
  const planning = draft.suggestedState.planning;

  assert.deepEqual(draft.suggestedState.tech.frameworks, ['Next.js', 'FastAPI']);
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.topic === 'Framework' && item.choice === 'Next.js, FastAPI'),
    true,
  );
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.topic === 'Model' && item.choice === 'self-hosted Qwen'),
    true,
  );
  assert.equal(
    planning.tech_decisions.some((item) =>
      item.topic === 'Model' && item.choice === 'Qwen'),
    false,
  );
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
  assert.equal(suggestions.suggestedState.project.description, '社内の案件相談を整理するツール');
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

test('parseConsultationIntake should preserve provider metadata in the draft envelope', () => {
  const draft = parseConsultationIntake(
    SAMPLE_INPUT,
    makeState(),
    { provider: 'claude', promptVersion: 'internal_tool' },
  );

  assert.equal(draft.source, 'provider_consultation');
  assert.equal(draft.provider.provider, 'claude');
  assert.equal(draft.provider.promptVersion, 'internal_tool');
});

test('getConsultationPromptTemplate should return variant-specific guidance', () => {
  const internalPrompt = getConsultationPromptTemplate('internal_tool');
  const businessPrompt = getConsultationPromptTemplate('new_business');
  const personalPrompt = getConsultationPromptTemplate('personal_project');

  assert.equal(CONSULTATION_PROMPT_OPTIONS.length, 4);
  assert.equal(/社内ツール/.test(internalPrompt), true);
  assert.equal(/新規事業/.test(businessPrompt), true);
  assert.equal(/個人プロジェクト/.test(personalPrompt), true);
  assert.equal(/## プロジェクト概要/.test(internalPrompt), true);
  assert.equal(/## 参考実装・関連リンク/.test(internalPrompt), true);
});

test('getConsultationReviewHints should return variant-specific review points', () => {
  const internalHints = getConsultationReviewHints('internal_tool');
  const clientHints = getConsultationReviewHints('client_project');
  const personalHints = getConsultationReviewHints('personal_project');

  assert.equal(/社内ツール/.test(internalHints.title), true);
  assert.equal(internalHints.points.length > 0, true);
  assert.equal(/クライアント案件/.test(clientHints.title), true);
  assert.equal(/個人プロジェクト/.test(personalHints.title), true);
});

test('updateDraftOpenQuestions should update review and extracted open questions', () => {
  const draft = parseConsultationIntake(SAMPLE_INPUT, makeState());
  const updated = updateDraftOpenQuestions(draft, '権限管理を初期から入れるか\nsingle repo で十分か');

  assert.deepEqual(updated.review.openQuestions, ['権限管理を初期から入れるか', 'single repo で十分か']);
  assert.deepEqual(updated.extracted.openQuestions, ['権限管理を初期から入れるか', 'single repo で十分か']);
  assert.equal(updated.sections['未確定事項'].includes('権限管理を初期から入れるか'), true);
});
