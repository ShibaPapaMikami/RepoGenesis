import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { formReducer, initialFormState } from './state/formReducer';
import { validationErrors, canExport } from './state/selectors';
import {
  saveDraft,
  loadDraft,
  clearDraft,
  saveConsultationText,
  loadConsultationText,
  saveConsultationDraft,
  loadConsultationDraft,
  saveSimpleIntake,
  loadSimpleIntake,
  saveInputMode,
  loadInputMode,
  clearConsultationState,
} from './utils/storage';
import { ProjectSection } from './components/sections/ProjectSection';
import { TechSection } from './components/sections/TechSection';
import { SecuritySection } from './components/sections/SecuritySection';
import { StructureSection } from './components/sections/StructureSection';
import { WorkflowSection } from './components/sections/WorkflowSection';
import { JsonOutput } from './components/output/JsonOutput';
import { AuthPanel } from './components/auth/AuthPanel';
import { getGenerationMode, getRemoteAuthMode } from './utils/generateRepository';
import { ConsultationSection } from './components/sections/ConsultationSection';
import {
  CONSULTATION_PROMPT_OPTIONS,
  getConsultationPromptTemplate,
  parseConsultationIntake,
  updateDraftOpenQuestions,
  type ConsultationPromptVariant,
  type IntakeDraft,
} from './utils/intakeParser';
import { SimpleInputSection } from './components/sections/SimpleInputSection';
import { buildSimpleIntakeDraft, initialSimpleIntakeState, type SimpleIntakeState } from './utils/simpleIntake';
import './App.css';

declare const __APP_RELEASE__: string;
declare const __APP_COMMIT__: string;

const TEST_FILL_STATE = {
  project: {
    name: 'RepoGenesis Test Project',
    slug: 'repogenesis-test',
    description: 'テスト入力で自動セットされたプロジェクトです',
    owner: 'Gugenka QA',
  },
  tech: {
    domains: ['web'] as const,
    primary_language: 'typescript' as const,
    frameworks: ['React', 'Vite'],
    ai_tools: ['claude_code'] as const,
    ai_tool_detail: '',
  },
  security: {
    level: 'medium' as const,
    has_api_keys: true,
    has_user_data: true,
    has_payment_data: false,
    has_ip_sensitive: false,
    has_credentials: false,
  },
  structure: {
    repo_type: 'single' as const,
    repos: [],
  },
  workflow: {
    phases_count: 3,
  },
  slugManuallyEdited: true,
  securityLevelOverride: null,
};

const TEST_CONSULTATION_INPUTS: Record<ConsultationPromptVariant, string> = {
  internal_tool: `## プロジェクト概要
社内の案件相談と進行管理をまとめる AI 活用ツールを作りたい

## 想定ユーザー
- 営業
- PM
- 制作進行

## 解決したい課題
案件ごとの相談履歴、タスク、判断ログが Slack とスプレッドシートに分散している

## 最初に作るべきもの
案件一覧、相談履歴、担当者別の確認状況を見られる Web 画面

## 扱うデータ
- 案件名
- 担当者
- 顧客名
- 相談メモ

## 外部連携候補
- Slack
- Google Drive

## 未確定事項
- 外部APIが本当に必要かは未確定
- 1リポジトリで十分かは未確定

## RepoGenesis入力候補
- domain は web と ai が候補
- 機密情報を扱う前提で security は medium 以上を想定`,
  new_business: `## プロジェクト概要
法人向けに AI で案件提案を支援する新規 SaaS を立ち上げたい

## 想定ユーザー
- 企画担当
- 営業責任者
- 先行導入企業

## 解決したい課題
提案準備の質と速度が担当者依存で、初回商談までの仮説整理に時間がかかる

## 最初に作るべきもの
案件情報を入力すると提案のたたき台を出す PoC 画面

## 扱うデータ
- 企業名
- 案件概要
- 提案メモ
- 社内の提案テンプレート

## 外部連携候補
- HubSpot
- Notion

## 未確定事項
- 最初は single repo で十分かは未確定
- 顧客ごとの権限管理を初期から入れるか未確定

## RepoGenesis入力候補
- domain は web と ai が候補
- security は medium を想定
- PoC と本番の境界をあとで見直す`,
  client_project: `## プロジェクト概要
クライアント向けに、問い合わせから制作進行まで見える管理画面を構築したい

## 想定ユーザー
- クライアント担当者
- 制作ディレクター
- 開発メンバー

## 解決したい課題
依頼内容、決定事項、進行状況がメールとチャットに散らばっていて、責任分界が曖昧

## 最初に作るべきもの
案件ごとの問い合わせ履歴と進行ステータスを見られる管理画面

## 扱うデータ
- 案件名
- クライアント担当者
- 契約範囲メモ
- 進行ログ

## 外部連携候補
- Backlog
- Google Drive

## 未確定事項
- 納品物と運用機能を同じ repo に置くべきか未確定
- 外部API連携を初回スコープに含めるか未確定

## RepoGenesis入力候補
- domain は web が中心
- クライアント情報を扱うので security は medium 以上
- 納品範囲と将来拡張を分けて考える必要がある`,
};

type GuidedStep = 'prompt' | 'paste' | 'draft' | 'options' | 'review' | 'result';

const GUIDED_STEPS: { id: GuidedStep; label: string; title: string; description: string }[] = [
  { id: 'prompt', label: '1', title: 'AI相談を始める', description: '相談用プロンプトをコピーして外部AIで壁打ちします。' },
  { id: 'paste', label: '2', title: '整理結果を貼る', description: 'AIの整理結果を貼り付けて draft を作成します。' },
  { id: 'draft', label: '3', title: 'ドラフト確認', description: 'facts・assumptions・open questions を確認します。' },
  { id: 'options', label: '4', title: 'おすすめオプション', description: 'repo 構成や security 方針を軽く調整します。' },
  { id: 'review', label: '5', title: '最終確認', description: '必要なら詳細調整を開き、生成前の内容を確定します。' },
  { id: 'result', label: '6', title: 'ZIP生成と結果', description: 'ZIP 生成、request id、ダウンロード導線を確認します。' },
];

function deriveInitialGuidedStep(
  savedMode: 'consultation' | 'simple' | 'detail',
  savedText: string,
  savedDraft: IntakeDraft | null,
): GuidedStep {
  if (savedMode === 'detail') return 'review';
  if (savedDraft) return 'draft';
  if (savedText.trim().length > 0) return 'paste';
  return 'prompt';
}

function App() {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const [consultationText, setConsultationText] = useState(loadConsultationText());
  const [consultationDraft, setConsultationDraft] = useState<IntakeDraft | null>(loadConsultationDraft());
  const [simpleInput, setSimpleInput] = useState<SimpleIntakeState>(loadSimpleIntake() ?? initialSimpleIntakeState);
  const [consultationPromptVariant, setConsultationPromptVariant] = useState<ConsultationPromptVariant>('internal_tool');
  const [consultationMessage, setConsultationMessage] = useState<string | null>(null);
  const [guidedStep, setGuidedStep] = useState<GuidedStep>(() => deriveInitialGuidedStep(loadInputMode(), loadConsultationText(), loadConsultationDraft()));
  const [showSimpleFallback, setShowSimpleFallback] = useState(() => loadInputMode() === 'simple');
  const [showAdvancedDetail, setShowAdvancedDetail] = useState(() => loadInputMode() === 'detail');
  const [draftApplied, setDraftApplied] = useState(() => loadInputMode() === 'detail');
  const [resultPhase, setResultPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [authSession, setAuthSession] = useState<{ authenticated: boolean; email: string | null }>({
    authenticated: false,
    email: null,
  });
  const initialized = useRef(false);
  const outputRef = useRef<HTMLElement | null>(null);
  const optionsRef = useRef<HTMLElement | null>(null);
  const reviewRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const draft = loadDraft();
    if (draft) {
      dispatch({ type: 'RESTORE_DRAFT', payload: draft });
    }
    const restoredMode = loadInputMode();
    const restoredText = loadConsultationText();
    const restoredConsultationDraft = loadConsultationDraft();
    const restoredSimpleInput = loadSimpleIntake();
    setConsultationText(restoredText);
    setConsultationDraft(restoredConsultationDraft);
    if (restoredSimpleInput) setSimpleInput(restoredSimpleInput);
    setShowSimpleFallback(restoredMode === 'simple');
    setShowAdvancedDetail(restoredMode === 'detail');
    setDraftApplied(restoredMode === 'detail');
    setGuidedStep(deriveInitialGuidedStep(restoredMode, restoredText, restoredConsultationDraft));
  }, []);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSave = useCallback((s: typeof state) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveDraft(s), 500);
  }, []);

  useEffect(() => {
    if (initialized.current) {
      debouncedSave(state);
    }
  }, [state, debouncedSave]);

  useEffect(() => {
    saveConsultationText(consultationText);
  }, [consultationText]);

  useEffect(() => {
    saveConsultationDraft(consultationDraft);
  }, [consultationDraft]);

  useEffect(() => {
    saveSimpleIntake(simpleInput);
  }, [simpleInput]);

  useEffect(() => {
    saveInputMode(showSimpleFallback ? 'simple' : showAdvancedDetail ? 'detail' : 'consultation');
  }, [showAdvancedDetail, showSimpleFallback]);

  const errors = validationErrors(state);
  const exportable = canExport(state);
  const requiresCookieSession = getGenerationMode() === 'remote' && getRemoteAuthMode() === 'cookie_session';
  const activeStep = resultPhase === 'idle' ? guidedStep : 'result';
  const activeStepIndex = GUIDED_STEPS.findIndex((step) => step.id === activeStep);
  const promptVariantLabel = CONSULTATION_PROMPT_OPTIONS.find((option) => option.id === consultationPromptVariant)?.label ?? '相談テンプレート';
  const suggestedRepoType = consultationDraft?.suggestedState.structure.repo_type ?? state.structure.repo_type;
  const suggestedSecurity = consultationDraft?.suggestedState.securityLevelOverride ?? state.security.level;
  const summaryProjectName = state.project.name || consultationDraft?.suggestedState.project.name || '未確定';
  const summaryDescription = state.project.description || consultationDraft?.suggestedState.project.description || '未確定';
  const summaryDomains = state.tech.domains.length > 0 ? state.tech.domains.join(', ') : consultationDraft?.suggestedState.tech.domains.join(', ') || '未確定';
  const showOutputSection = draftApplied && (guidedStep === 'review' || resultPhase !== 'idle');

  const recommendationNotes = [
    suggestedRepoType === 'multi'
      ? '機能の境界が分かれそうなので、multi repo のまま進める方が安全です。'
      : 'まずは single repo で早く動かし、必要になった時点で分割する進め方が合っています。',
    suggestedSecurity === 'high'
      ? '機密性の高い情報を扱う前提なので、high 相当の運用前提で生成内容を確認してください。'
      : suggestedSecurity === 'medium'
        ? '社内データや顧客データの取り扱いがありそうなので、medium を基準に見るのが自然です。'
        : '低リスク寄りですが、認証や API key の有無に応じて security は再確認してください。',
    consultationDraft?.extracted.integrations.length
      ? `外部連携候補: ${consultationDraft.extracted.integrations.join(', ')}`
      : '外部連携は未確定です。生成後に別タスクとして切り出しても進められます。',
  ];

  function scrollToSection(ref: { current: HTMLElement | null }) {
    requestAnimationFrame(() => {
      ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleReset() {
    clearDraft();
    clearConsultationState();
    dispatch({ type: 'RESET' });
    setConsultationText('');
    setConsultationDraft(null);
    setSimpleInput(initialSimpleIntakeState);
    setConsultationMessage(null);
    setGuidedStep('prompt');
    setShowSimpleFallback(false);
    setShowAdvancedDetail(false);
    setDraftApplied(false);
    setResultPhase('idle');
  }

  function handleApplyTestInput() {
    dispatch({ type: 'RESTORE_DRAFT', payload: TEST_FILL_STATE });
    setGuidedStep('review');
    setShowSimpleFallback(false);
    setShowAdvancedDetail(true);
    setDraftApplied(true);
    setResultPhase('idle');
  }

  function handleApplyConsultationTestInput() {
    setConsultationText(TEST_CONSULTATION_INPUTS[consultationPromptVariant]);
    setConsultationDraft(null);
    setConsultationMessage(`相談結果のテスト入力を反映しました（${consultationPromptVariant}）。必要ならそのまま draft を作成してください。`);
    setGuidedStep('paste');
    setShowSimpleFallback(false);
    setShowAdvancedDetail(false);
    setDraftApplied(false);
    setResultPhase('idle');
  }

  function handleApplySimpleTestInput() {
    const sampleMap: Record<ConsultationPromptVariant, Partial<SimpleIntakeState>> = {
      internal_tool: {
        variant: 'internal_tool',
        summary: '社内の案件相談と進行管理をまとめるAI活用ツール',
        usersText: '営業\nPM\n制作進行',
        problem: '相談履歴と判断ログが Slack とスプレッドシートに分散している',
        firstDeliverable: '案件一覧と相談履歴を見られる Web 画面',
        dataKindsText: '案件名\n担当者\n顧客情報\n相談メモ',
        integrationStatus: 'maybe',
        integrationNotes: 'Slack, Google Drive',
        owner: 'Gugenka QA',
        dataSensitivity: 'internal',
        repoConfidence: 'unknown',
        unresolvedNotes: '権限管理を初期から入れるか',
      },
      new_business: {
        variant: 'new_business',
        summary: '法人向けに AI で案件提案を支援する新規 SaaS',
        usersText: '企画担当\n営業責任者\n先行導入企業',
        problem: '提案準備の質と速度が担当者依存で、仮説整理に時間がかかる',
        firstDeliverable: '案件情報を入力すると提案のたたき台を出す PoC 画面',
        dataKindsText: '企業名\n案件概要\n提案メモ',
        integrationStatus: 'maybe',
        integrationNotes: 'HubSpot, Notion',
        owner: 'Gugenka QA',
        dataSensitivity: 'personal',
        repoConfidence: 'single',
        unresolvedNotes: '顧客ごとの権限管理を初期から入れるか',
      },
      client_project: {
        variant: 'client_project',
        summary: 'クライアント向けの問い合わせ・制作進行管理画面',
        usersText: 'クライアント担当者\n制作ディレクター\n開発メンバー',
        problem: '依頼内容と進行状況がメールとチャットに散らばっている',
        firstDeliverable: '案件ごとの問い合わせ履歴と進行ステータスを見られる画面',
        dataKindsText: '案件名\nクライアント担当者\n進行ログ',
        integrationStatus: 'yes',
        integrationNotes: 'Backlog, Google Drive',
        owner: 'Gugenka QA',
        dataSensitivity: 'personal',
        repoConfidence: 'multi',
        unresolvedNotes: '納品範囲と運用機能を同じ repo に置くべきか',
      },
    };

    setSimpleInput({
      ...initialSimpleIntakeState,
      ...sampleMap[simpleInput.variant],
    });
    setConsultationDraft(null);
    setConsultationMessage(`かんたん入力のテスト入力を反映しました（${simpleInput.variant}）。必要ならそのまま draft を作成してください。`);
    setShowSimpleFallback(true);
    setShowAdvancedDetail(false);
    setDraftApplied(false);
    setResultPhase('idle');
  }

  async function handleCopyConsultationPrompt() {
    await navigator.clipboard.writeText(getConsultationPromptTemplate(consultationPromptVariant));
    setConsultationMessage('相談用プロンプトをコピーしました。壁打ち結果をこの画面に貼り付けてください。');
    setGuidedStep('paste');
    setShowSimpleFallback(false);
  }

  function handleBuildConsultationDraft() {
    const draft = parseConsultationIntake(consultationText, state);
    if (draft.review.facts.length === 0) {
      setConsultationDraft(null);
      setConsultationMessage(
        'draft を作成できませんでした。見出し付きの相談結果を貼り付けてください。少なくとも「プロジェクト概要」「想定ユーザー」「解決したい課題」の本文が必要です。',
      );
      setGuidedStep('paste');
      return;
    }
    setConsultationDraft(draft);
    setConsultationMessage('draft を作成しました。仮置き項目と未確定事項を確認してください。');
    setGuidedStep('draft');
    setShowSimpleFallback(false);
    setShowAdvancedDetail(false);
    setDraftApplied(false);
    setResultPhase('idle');
  }

  function applyConsultationDraft(nextStep: 'options' | 'review', openAdvancedDetail = false) {
    if (!consultationDraft) return;
    dispatch({ type: 'RESTORE_DRAFT', payload: consultationDraft.suggestedState });
    setConsultationMessage(
      nextStep === 'options'
        ? 'draft をフォームに反映しました。おすすめオプションを確認してください。'
        : openAdvancedDetail
          ? 'draft をフォームに反映しました。詳細調整を開きます。'
          : 'draft をフォームに反映しました。最終確認へ進みます。',
    );
    setGuidedStep(nextStep);
    setShowSimpleFallback(false);
    setShowAdvancedDetail(openAdvancedDetail);
    setDraftApplied(true);
    if (nextStep === 'options') {
      scrollToSection(optionsRef);
      return;
    }
    scrollToSection(reviewRef);
  }

  function handleChangeDraftOpenQuestions(value: string) {
    setConsultationDraft((current) => {
      if (!current) return current;
      return updateDraftOpenQuestions(current, value);
    });
  }

  function handleChangeSimpleInput<K extends keyof SimpleIntakeState>(key: K, value: SimpleIntakeState[K]) {
    setSimpleInput((current) => {
      const next = { ...current, [key]: value };
      if (key === 'variant') {
        setConsultationPromptVariant(value as ConsultationPromptVariant);
      }
      return next;
    });
  }

  function handleBuildSimpleDraft() {
    const draft = buildSimpleIntakeDraft(simpleInput, state);
    setConsultationPromptVariant(simpleInput.variant);
    setConsultationDraft(draft);
    setConsultationMessage('かんたん入力から draft を作成しました。仮置き項目と未確定事項を確認してください。');
    setShowSimpleFallback(false);
    setShowAdvancedDetail(false);
    setDraftApplied(false);
    setGuidedStep('draft');
    setResultPhase('idle');
  }

  const releaseLabel = __APP_RELEASE__.startsWith('v') ? __APP_RELEASE__ : `v${__APP_RELEASE__}`;
  const buildLabel = `${releaseLabel} (${__APP_COMMIT__})`;

  return (
    <div className="app">
      <header className="app-header">
        <h1>RepoGenesis</h1>
        <p>AI対応リポジトリ構造ジェネレータ</p>
        <p className="app-version">{buildLabel}</p>
      </header>

      <main className="app-main">
        <section className="form-section flow-overview">
          <p className="section-kicker">Primary Flow</p>
          <h2>AI起点で、相談から ZIP 生成まで進める</h2>
          <p className="consultation-lead">
            このアプリでは `相談用プロンプト` → `壁打ち結果の貼り付け` → `draft 確認` → `おすすめオプション` → `最終確認` → `ZIP生成` の順で進みます。
          </p>

          <ol className="guided-steps" aria-label="RepoGenesis guided flow">
            {GUIDED_STEPS.map((step, index) => (
              <li
                key={step.id}
                className={[
                  'guided-step',
                  index < activeStepIndex ? 'guided-step-complete' : '',
                  index === activeStepIndex ? 'guided-step-current' : '',
                ].filter(Boolean).join(' ')}
              >
                <span className="guided-step-index">{step.label}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="flow-callout">
            <p><strong>現在の相談テンプレート:</strong> {promptVariantLabel}</p>
            <p className="hint">相談の種類は次のステップで切り替えられます。まずはこのテンプレートでプロンプトをコピーしてください。</p>
          </div>

          <div className="output-actions">
            <button type="button" onClick={handleCopyConsultationPrompt} className="btn-primary">
              相談用プロンプトをコピー
            </button>
            <button
              type="button"
              onClick={() => {
                setShowSimpleFallback(true);
                setShowAdvancedDetail(false);
                setResultPhase('idle');
              }}
              className="btn-secondary"
            >
              AIを使わずに始める
            </button>
          </div>
        </section>

        <AuthPanel
          enabled={requiresCookieSession}
          onSessionChange={setAuthSession}
        />

        {showSimpleFallback ? (
          <>
            <section className="form-section fallback-entry">
              <p className="section-kicker">Fallback</p>
              <h2>AIを使わずに始める</h2>
              <p className="consultation-lead">
                まずは短い回答だけで draft を作る fallback ルートです。作成後は同じドラフト確認フローへ戻れます。
              </p>
              <div className="output-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowSimpleFallback(false);
                    setGuidedStep(consultationDraft ? 'draft' : consultationText.trim() ? 'paste' : 'prompt');
                  }}
                  className="btn-secondary"
                >
                  AI相談フローへ戻る
                </button>
              </div>
            </section>

            <SimpleInputSection
              state={simpleInput}
              onChange={handleChangeSimpleInput}
              onApplyTestInput={handleApplySimpleTestInput}
              onBuildDraft={handleBuildSimpleDraft}
              message={consultationMessage}
            />
          </>
        ) : (
          <ConsultationSection
            promptVariant={consultationPromptVariant}
            onChangePromptVariant={setConsultationPromptVariant}
            intakeText={consultationText}
            onChangeText={setConsultationText}
            onApplyTestInput={handleApplyConsultationTestInput}
            onCopyPrompt={handleCopyConsultationPrompt}
            onBuildDraft={handleBuildConsultationDraft}
            onContinueToOptions={() => applyConsultationDraft('options')}
            onSkipToReview={() => applyConsultationDraft('review')}
            onOpenAdvancedDetail={() => applyConsultationDraft('review', true)}
            onChangeOpenQuestions={handleChangeDraftOpenQuestions}
            draft={consultationDraft}
            message={consultationMessage}
          />
        )}

        {draftApplied && (
          <section ref={optionsRef} className="form-section options-section">
            <p className="section-kicker">Step 4</p>
            <h2>おすすめオプション</h2>
            <p className="consultation-lead">
              ここでは generator に既にある設定だけに絞って、repo 構成や security を軽く調整します。迷う場合は推奨値のままで進めます。
            </p>

            <div className="consultation-columns options-grid">
              <div className="consultation-card">
                <h4>repo 構成</h4>
                <p className="option-callout">推奨: <strong>{suggestedRepoType}</strong></p>
                <div className="toggle-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="guidedRepoType"
                      checked={state.structure.repo_type === 'single'}
                      onChange={() => dispatch({ type: 'SET_REPO_TYPE', payload: 'single' })}
                    />
                    single
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="guidedRepoType"
                      checked={state.structure.repo_type === 'multi'}
                      onChange={() => dispatch({ type: 'SET_REPO_TYPE', payload: 'multi' })}
                    />
                    multi
                  </label>
                </div>
              </div>

              <div className="consultation-card">
                <h4>security 水準</h4>
                <p className="option-callout">推奨: <strong>{suggestedSecurity}</strong></p>
                <div className="toggle-group">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <label key={level} className="radio-label">
                      <input
                        type="radio"
                        name="guidedSecurity"
                        checked={state.security.level === level}
                        onChange={() => dispatch({ type: 'SET_SECURITY_LEVEL_OVERRIDE', payload: level })}
                      />
                      {level}
                    </label>
                  ))}
                </div>
              </div>

              <div className="consultation-card">
                <h4>フェーズ数</h4>
                <p className="option-callout">現在値: <strong>{state.workflow.phases_count}</strong></p>
                <div className="toggle-group">
                  {[2, 3, 4, 5].map((count) => (
                    <label key={count} className="radio-label">
                      <input
                        type="radio"
                        name="guidedPhases"
                        checked={state.workflow.phases_count === count}
                        onChange={() => dispatch({ type: 'SET_PHASES_COUNT', payload: count })}
                      />
                      {count}フェーズ
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="consultation-summary">
              <p><strong>おすすめメモ</strong></p>
              <ul>
                {recommendationNotes.map((note) => <li key={note}>{note}</li>)}
              </ul>
            </div>

            <div className="output-actions">
              <button
                type="button"
                onClick={() => {
                  setGuidedStep('review');
                  scrollToSection(reviewRef);
                }}
                className="btn-primary"
              >
                この設定で最終確認へ進む
              </button>
              <button
                type="button"
                onClick={() => {
                  setGuidedStep('review');
                  scrollToSection(reviewRef);
                }}
                className="btn-secondary"
              >
                スキップして進む
              </button>
            </div>
          </section>
        )}

        {draftApplied && (
          <section ref={reviewRef} className="form-section final-review-section">
            <p className="section-kicker">Step 5</p>
            <h2>最終確認</h2>
            <p className="consultation-lead">
              生成前の要点だけを先に確認し、必要になった時だけ詳細調整を開く導線に変えています。
            </p>

            <div className="review-summary-grid">
              <div className="consultation-card">
                <h4>project</h4>
                <p><strong>名前:</strong> {summaryProjectName}</p>
                <p><strong>slug:</strong> {state.project.slug || '未確定'}</p>
                <p><strong>owner:</strong> {state.project.owner || '未確定'}</p>
              </div>
              <div className="consultation-card">
                <h4>tech</h4>
                <p><strong>domain:</strong> {summaryDomains}</p>
                <p><strong>言語:</strong> {state.tech.primary_language}</p>
                <p><strong>frameworks:</strong> {state.tech.frameworks.join(', ') || '未確定'}</p>
              </div>
              <div className="consultation-card">
                <h4>delivery</h4>
                <p><strong>security:</strong> {state.security.level}</p>
                <p><strong>repo:</strong> {state.structure.repo_type}</p>
                <p><strong>phases:</strong> {state.workflow.phases_count}</p>
              </div>
            </div>

            <div className="consultation-summary">
              <p><strong>説明候補:</strong> {summaryDescription}</p>
            </div>

            <div className="output-actions">
              <button
                type="button"
                onClick={() => {
                  setGuidedStep('review');
                  scrollToSection(outputRef);
                }}
                className="btn-primary"
              >
                ZIP生成セクションへ進む
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedDetail((current) => !current)}
                className="btn-secondary"
              >
                {showAdvancedDetail ? '詳細調整を閉じる' : '詳細調整を開く'}
              </button>
            </div>

            {showAdvancedDetail && (
              <div className="advanced-detail-stack">
                {consultationDraft && (
                  <section className="form-section consultation-followup">
                    <h2>相談結果からの確認事項</h2>
                    <p className="consultation-lead">
                      相談結果から仮置きした内容と未確定事項です。必要に応じて下の詳細入力で調整してください。
                    </p>
                    <div className="consultation-columns">
                      <div className="consultation-card">
                        <h4>仮置きした内容</h4>
                        <ul>
                          {consultationDraft.certainty.provisional.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                      </div>
                      <div className="consultation-card consultation-card-wide">
                        <h4>未確定事項</h4>
                        <ul>
                          {consultationDraft.certainty.unresolved.map((item) => <li key={item}>{item}</li>)}
                        </ul>
                        <div className="form-row consultation-inline-editor">
                          <label htmlFor="detailOpenQuestionsEditor">open questions を整理</label>
                          <textarea
                            id="detailOpenQuestionsEditor"
                            rows={4}
                            value={consultationDraft.review.openQuestions.join('\n')}
                            onChange={(e) => handleChangeDraftOpenQuestions(e.target.value)}
                            placeholder={'例:\n外部APIが本当に必要か\nsingle repo で十分か'}
                          />
                        </div>
                      </div>
                    </div>
                  </section>
                )}
                <ProjectSection state={state} dispatch={dispatch} errors={errors} />
                <TechSection state={state} dispatch={dispatch} errors={errors} />
                <SecuritySection state={state} dispatch={dispatch} />
                <StructureSection state={state} dispatch={dispatch} errors={errors} />
                <WorkflowSection state={state} dispatch={dispatch} errors={errors} />
              </div>
            )}
          </section>
        )}

        {showOutputSection && (
          <JsonOutput
            sectionRef={outputRef}
            title="Step 6. ZIP生成と結果"
            lead="JSONプレビューは最後にまとめ、ZIP 生成と request id の確認をこのセクションへ集約します。"
            showFeedback={resultPhase !== 'idle'}
            collapseJsonByDefault
            onGenerationStateChange={setResultPhase}
            state={state}
            canExport={exportable}
            errors={errors}
            authSession={authSession}
            consultationDraft={consultationDraft}
            consultationPromptVariant={consultationPromptVariant}
          />
        )}

        <div className="app-actions">
          {showAdvancedDetail && (
            <button type="button" onClick={handleApplyTestInput} className="btn-secondary">
              詳細入力のテスト入力を適用
            </button>
          )}
          <button type="button" onClick={handleReset} className="btn-reset">
            Reset
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
