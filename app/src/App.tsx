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
import { getConsultationPromptTemplate, parseConsultationIntake, type IntakeDraft } from './utils/intakeParser';
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
    ai_tool: 'claude_cli' as const,
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

function App() {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const [inputMode, setInputMode] = useState<'consultation' | 'detail'>(loadInputMode());
  const [consultationText, setConsultationText] = useState(loadConsultationText());
  const [consultationDraft, setConsultationDraft] = useState<IntakeDraft | null>(loadConsultationDraft());
  const [consultationMessage, setConsultationMessage] = useState<string | null>(null);
  const [authSession, setAuthSession] = useState<{ authenticated: boolean; email: string | null }>({
    authenticated: false,
    email: null,
  });
  const initialized = useRef(false);

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
    setInputMode(restoredMode);
    setConsultationText(restoredText);
    setConsultationDraft(restoredConsultationDraft);
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
    setConsultationMessage(null);
  }

  function handleApplyTestInput() {
    dispatch({ type: 'RESTORE_DRAFT', payload: TEST_FILL_STATE });
    setInputMode('detail');
  }

  async function handleCopyConsultationPrompt() {
    await navigator.clipboard.writeText(getConsultationPromptTemplate());
    setConsultationMessage('相談用プロンプトをコピーしました。壁打ち結果をこの画面に貼り付けてください。');
  }

  function handleBuildConsultationDraft() {
    const draft = parseConsultationIntake(consultationText, state);
    setConsultationDraft(draft);
    setConsultationMessage('draft を作成しました。仮置き項目と未確定事項を確認してください。');
  }

  function handleApplyConsultationDraft() {
    if (!consultationDraft) return;
    dispatch({ type: 'RESTORE_DRAFT', payload: consultationDraft.suggestedState });
    setInputMode('detail');
    setConsultationMessage('draft をフォームに反映しました。詳細入力で微調整してください。');
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
            intakeText={consultationText}
            onChangeText={setConsultationText}
            onCopyPrompt={handleCopyConsultationPrompt}
            onBuildDraft={handleBuildConsultationDraft}
            onApplyDraft={handleApplyConsultationDraft}
            onSwitchToDetail={() => setInputMode('detail')}
            draft={consultationDraft}
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
          state={state}
          canExport={exportable}
          errors={errors}
          authSession={authSession}
        />

        <div className="app-actions">
          <button type="button" onClick={handleApplyTestInput} className="btn-secondary">
            テスト入力を適用
          </button>
          <button type="button" onClick={handleReset} className="btn-reset">
            Reset
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
