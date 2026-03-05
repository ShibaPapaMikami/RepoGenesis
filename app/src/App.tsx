import { useReducer, useEffect, useRef, useCallback } from 'react';
import { formReducer, initialFormState } from './state/formReducer';
import { validationErrors, canExport } from './state/selectors';
import { saveDraft, loadDraft, clearDraft } from './utils/storage';
import { ProjectSection } from './components/sections/ProjectSection';
import { TechSection } from './components/sections/TechSection';
import { SecuritySection } from './components/sections/SecuritySection';
import { StructureSection } from './components/sections/StructureSection';
import { WorkflowSection } from './components/sections/WorkflowSection';
import { JsonOutput } from './components/output/JsonOutput';
import './App.css';

declare const __APP_VERSION__: string;

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
  const initialized = useRef(false);

  // localStorage からドラフト復元（起動時のみ）
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const draft = loadDraft();
    if (draft) {
      dispatch({ type: 'RESTORE_DRAFT', payload: draft });
    }
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

  const errors = validationErrors(state);
  const exportable = canExport(state);

  function handleReset() {
    clearDraft();
    dispatch({ type: 'RESET' });
  }

  function handleApplyTestInput() {
    dispatch({ type: 'RESTORE_DRAFT', payload: TEST_FILL_STATE });
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>RepoGenesis</h1>
        <p>AI対応リポジトリ構造ジェネレータ</p>
        <p className="app-version">デプロイ版: {__APP_VERSION__}</p>
      </header>

      <main className="app-main">
        <ProjectSection state={state} dispatch={dispatch} errors={errors} />
        <TechSection state={state} dispatch={dispatch} errors={errors} />
        <SecuritySection state={state} dispatch={dispatch} />
        <StructureSection state={state} dispatch={dispatch} errors={errors} />
        <WorkflowSection state={state} dispatch={dispatch} errors={errors} />
        <JsonOutput state={state} canExport={exportable} errors={errors} />

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
