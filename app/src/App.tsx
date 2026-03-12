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
import { getConsultationPromptTemplate, parseConsultationIntake, updateDraftOpenQuestions, type ConsultationPromptVariant, type IntakeDraft } from './utils/intakeParser';
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

function App() {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const [inputMode, setInputMode] = useState<'consultation' | 'simple' | 'detail'>(loadInputMode());
  const [consultationText, setConsultationText] = useState(loadConsultationText());
  const [consultationDraft, setConsultationDraft] = useState<IntakeDraft | null>(loadConsultationDraft());
  const [simpleInput, setSimpleInput] = useState<SimpleIntakeState>(loadSimpleIntake() ?? initialSimpleIntakeState);
  const [consultationPromptVariant, setConsultationPromptVariant] = useState<ConsultationPromptVariant>('internal_tool');
  const [consultationMessage, setConsultationMessage] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<{ authenticated: boolean; email: string | null }>({
    authenticated: false,
    email: null,
  });
  const initialized = useRef(false);
  const outputRef = useRef<HTMLElement | null>(null);

  // localStorage からドラフト復元（起動時のみ）
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
    setInputMode(restoredMode);
    setConsultationText(restoredText);
    setConsultationDraft(restoredConsultationDraft);
    if (restoredSimpleInput) setSimpleInput(restoredSimpleInput);
  }, []);

  // state 変更時にデバウンス保存（500ms）
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
    saveInputMode(inputMode);
  }, [inputMode]);

  const errors = validationErrors(state);
  const exportable = canExport(state);
  const requiresCookieSession = getGenerationMode() === 'remote' && getRemoteAuthMode() === 'cookie_session';

  function handleReset() {
    clearDraft();
    clearConsultationState();
    dispatch({ type: 'RESET' });
    setInputMode('consultation');
    setConsultationText('');
    setConsultationDraft(null);
    setSimpleInput(initialSimpleIntakeState);
    setConsultationMessage(null);
  }

  function handleApplyTestInput() {
    dispatch({ type: 'RESTORE_DRAFT', payload: TEST_FILL_STATE });
    setInputMode('detail');
  }

  function handleApplyConsultationTestInput() {
    setConsultationText(TEST_CONSULTATION_INPUTS[consultationPromptVariant]);
    setConsultationDraft(null);
    setConsultationMessage(`相談結果のテスト入力を反映しました（${consultationPromptVariant}）。必要ならそのまま draft を作成してください。`);
    setInputMode('consultation');
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
    setInputMode('simple');
  }

  async function handleCopyConsultationPrompt() {
    await navigator.clipboard.writeText(getConsultationPromptTemplate(consultationPromptVariant));
    setConsultationMessage('相談用プロンプトをコピーしました。壁打ち結果をこの画面に貼り付けてください。');
  }

  function handleBuildConsultationDraft() {
    const draft = parseConsultationIntake(consultationText, state);
    if (draft.review.facts.length === 0) {
      setConsultationDraft(null);
      setConsultationMessage(
        'draft を作成できませんでした。見出し付きの相談結果を貼り付けてください。少なくとも「プロジェクト概要」「想定ユーザー」「解決したい課題」の本文が必要です。',
      );
      return;
    }
    setConsultationDraft(draft);
    setConsultationMessage('draft を作成しました。仮置き項目と未確定事項を確認してください。');
  }

  function handleApplyConsultationDraft() {
    if (!consultationDraft) return;
    dispatch({ type: 'RESTORE_DRAFT', payload: consultationDraft.suggestedState });
    setInputMode('detail');
    setConsultationMessage('draft をフォームに反映しました。詳細入力で微調整してください。');
  }

  function handleApplyConsultationDraftAndReviewOutput() {
    if (!consultationDraft) return;
    dispatch({ type: 'RESTORE_DRAFT', payload: consultationDraft.suggestedState });
    setInputMode('detail');
    setConsultationMessage('draft をフォームに反映しました。生成前チェックへ移動します。');
    requestAnimationFrame(() => {
      outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
    setInputMode('consultation');
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>RepoGenesis</h1>
        <p>AI対応リポジトリ構造ジェネレータ</p>
        <p className="app-version">リリース: {__APP_RELEASE__} / コミット: {__APP_COMMIT__}</p>
      </header>

      <main className="app-main">
        <section className="form-section mode-switcher">
          <h2>入力モード</h2>
          <div className="toggle-group">
            <label className="radio-label">
              <input
                type="radio"
                name="inputMode"
                checked={inputMode === 'consultation'}
                onChange={() => setInputMode('consultation')}
              />
              相談結果を反映
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="inputMode"
                checked={inputMode === 'simple'}
                onChange={() => setInputMode('simple')}
              />
              かんたん入力
            </label>
            <label className="radio-label">
              <input
                type="radio"
                name="inputMode"
                checked={inputMode === 'detail'}
                onChange={() => setInputMode('detail')}
              />
              詳細入力
            </label>
          </div>
          <p className="hint">推奨: 先に AI で壁打ちした結果を貼り付け、draft を作ってから詳細入力で調整します。</p>
        </section>

        <AuthPanel
          enabled={requiresCookieSession}
          onSessionChange={setAuthSession}
        />

        {inputMode === 'consultation' && (
          <ConsultationSection
            promptVariant={consultationPromptVariant}
            onChangePromptVariant={setConsultationPromptVariant}
            intakeText={consultationText}
            onChangeText={setConsultationText}
            onApplyTestInput={handleApplyConsultationTestInput}
            onCopyPrompt={handleCopyConsultationPrompt}
            onBuildDraft={handleBuildConsultationDraft}
            onApplyDraft={handleApplyConsultationDraft}
            onApplyDraftAndReviewOutput={handleApplyConsultationDraftAndReviewOutput}
            onSwitchToDetail={() => setInputMode('detail')}
            onChangeOpenQuestions={handleChangeDraftOpenQuestions}
            draft={consultationDraft}
            message={consultationMessage}
          />
        )}

        {inputMode === 'simple' && (
          <SimpleInputSection
            state={simpleInput}
            onChange={handleChangeSimpleInput}
            onApplyTestInput={handleApplySimpleTestInput}
            onBuildDraft={handleBuildSimpleDraft}
            message={consultationMessage}
          />
        )}

        {inputMode === 'detail' && (
          <>
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
                <div className="output-actions">
                  <button type="button" onClick={() => setInputMode('consultation')} className="btn-secondary">
                    相談結果へ戻る
                  </button>
                </div>
              </section>
            )}
            <ProjectSection state={state} dispatch={dispatch} errors={errors} />
            <TechSection state={state} dispatch={dispatch} errors={errors} />
            <SecuritySection state={state} dispatch={dispatch} />
            <StructureSection state={state} dispatch={dispatch} errors={errors} />
            <WorkflowSection state={state} dispatch={dispatch} errors={errors} />
          </>
        )}

        <JsonOutput
          sectionRef={outputRef}
          state={state}
          canExport={exportable}
          errors={errors}
          authSession={authSession}
          consultationDraft={consultationDraft}
          consultationPromptVariant={consultationPromptVariant}
        />

        <div className="app-actions">
          {inputMode === 'detail' && (
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
