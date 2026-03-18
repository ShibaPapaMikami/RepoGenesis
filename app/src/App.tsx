import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { formReducer, initialFormState } from './state/formReducer';
import { validationErrors, canExport } from './state/selectors';
import {
  clearConsultationState,
  clearDraft,
  loadConsultationDraft,
  loadConsultationPromptVariant,
  loadConsultationText,
  loadDraft,
  loadSelectedSkills,
  loadUiTestMode,
  saveConsultationDraft,
  saveConsultationPromptVariant,
  saveConsultationText,
  saveDraft,
  saveSelectedSkills,
  saveUiTestMode,
} from './utils/storage';
import { IntroSection } from './components/sections/IntroSection';
import { ConsultationSection } from './components/sections/ConsultationSection';
import { ProjectSection } from './components/sections/ProjectSection';
import { TechSection } from './components/sections/TechSection';
import { SecuritySection } from './components/sections/SecuritySection';
import { StructureSection } from './components/sections/StructureSection';
import { WorkflowSection } from './components/sections/WorkflowSection';
import { JsonOutput } from './components/output/JsonOutput';
import { AuthPanel } from './components/auth/AuthPanel';
import { FeedbackWidget } from './components/feedback/FeedbackWidget';
import { getGenerationMode, getRemoteAuthMode } from './utils/generateRepository';
import {
  getConsultationPromptTemplate,
  parseConsultationIntake,
  updateDraftOpenQuestions,
  type ConsultationPromptVariant,
  type IntakeDraft,
} from './utils/intakeParser';
import {
  formatSkillProviderNames,
  formatSkillProviderSupportSummary,
  getRecommendedSkills,
  SKILL_CATALOG,
  SKILL_RISK_LABELS,
  type SkillCatalogItem,
} from './data/skillCatalog.ts';
import { CONSULTATION_TEST_TEMPLATES } from './data/consultationTestTemplates.ts';
import type { ErrorReportPayload } from './utils/feedback.ts';
import './App.css';

declare const __APP_RELEASE__: string;
declare const __APP_COMMIT__: string;

type GuidedStep = 'intro' | 'paste' | 'draft' | 'options' | 'detail' | 'review' | 'result';
type SaveState = 'idle' | 'saving' | 'saved';

const WIZARD_STEPS: Array<{ id: GuidedStep; label: string }> = [
  { id: 'intro', label: '趣旨' },
  { id: 'paste', label: '相談内容' },
  { id: 'draft', label: 'ドラフト' },
  { id: 'options', label: 'オプション' },
  { id: 'detail', label: '詳細調整' },
  { id: 'review', label: '最終確認' },
  { id: 'result', label: 'ZIP生成' },
];

function hasFormProgress(savedFormDraft: ReturnType<typeof loadDraft>): boolean {
  if (!savedFormDraft) return false;
  return Boolean(
    savedFormDraft.project.name
      || savedFormDraft.project.description
      || savedFormDraft.project.slug
      || savedFormDraft.project.owner
      || savedFormDraft.tech.domains.length
      || savedFormDraft.tech.frameworks.length
      || savedFormDraft.tech.ai_tools.length
      || savedFormDraft.tech.primary_language !== initialFormState.tech.primary_language
      || savedFormDraft.structure.repo_type !== initialFormState.structure.repo_type
      || savedFormDraft.workflow.phases_count !== initialFormState.workflow.phases_count,
  );
}

function deriveInitialWizardState(
  savedFormDraft: ReturnType<typeof loadDraft>,
  savedText: string,
  savedConsultationDraft: IntakeDraft | null,
): { step: GuidedStep; draftApplied: boolean; hasProgress: boolean } {
  const hasProgress = Boolean(savedText.trim().length > 0 || savedConsultationDraft || hasFormProgress(savedFormDraft));
  if (savedFormDraft) return { step: 'review', draftApplied: true, hasProgress };
  if (savedConsultationDraft) return { step: 'draft', draftApplied: false, hasProgress };
  if (savedText.trim().length > 0) return { step: 'paste', draftApplied: false, hasProgress };
  return { step: 'intro', draftApplied: false, hasProgress };
}

function formatSaveLabel(state: SaveState, lastSavedAt: string | null): string {
  if (state === 'saving') return '自動保存中...';
  if (lastSavedAt) return `保存済み ${lastSavedAt}`;
  return '自動保存は有効です';
}

function App() {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const [consultationText, setConsultationText] = useState(() => loadConsultationText());
  const [consultationDraft, setConsultationDraft] = useState<IntakeDraft | null>(() => loadConsultationDraft());
  const [consultationPromptVariant, setConsultationPromptVariant] = useState<ConsultationPromptVariant>(() => loadConsultationPromptVariant());
  const [testMode, setTestMode] = useState(() => loadUiTestMode());
  const [selectedTestTemplateId, setSelectedTestTemplateId] = useState('');
  const [consultationMessage, setConsultationMessage] = useState<string | null>(null);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(() => loadSelectedSkills());
  const [promptCopied, setPromptCopied] = useState(false);
  const [guidedStep, setGuidedStep] = useState<GuidedStep>('intro');
  const [draftApplied, setDraftApplied] = useState<boolean>(() =>
    deriveInitialWizardState(loadDraft(), loadConsultationText(), loadConsultationDraft()).draftApplied);
  const [resumeTargetStep, setResumeTargetStep] = useState<GuidedStep>(() =>
    deriveInitialWizardState(loadDraft(), loadConsultationText(), loadConsultationDraft()).step);
  const [hasSavedProgress, setHasSavedProgress] = useState<boolean>(() =>
    deriveInitialWizardState(loadDraft(), loadConsultationText(), loadConsultationDraft()).hasProgress);
  const [resultPhase, setResultPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [latestErrorReport, setLatestErrorReport] = useState<ErrorReportPayload | null>(null);
  const [authSession, setAuthSession] = useState<{ authenticated: boolean; email: string | null }>({
    authenticated: false,
    email: null,
  });
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const initialized = useRef(false);
  const promptCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outputRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaved = useCallback(() => {
    setSaveState('saved');
    setLastSavedAt(
      new Date().toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    );
  }, []);

  const debouncedSave = useCallback((nextState: typeof state) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveState('saving');
    timerRef.current = setTimeout(() => {
      saveDraft(nextState);
      markSaved();
    }, 400);
  }, [markSaved]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const restoredDraft = loadDraft();
    const restoredText = loadConsultationText();
    const restoredConsultationDraft = loadConsultationDraft();
    const restored = deriveInitialWizardState(restoredDraft, restoredText, restoredConsultationDraft);

    if (restoredDraft) {
      dispatch({ type: 'RESTORE_DRAFT', payload: restoredDraft });
    }
    setConsultationText(restoredText);
    setConsultationDraft(restoredConsultationDraft);
    setConsultationPromptVariant(loadConsultationPromptVariant());
    setTestMode(loadUiTestMode());
    setDraftApplied(restored.draftApplied);
    setResumeTargetStep(restored.step);
    setHasSavedProgress(restored.hasProgress);
    setGuidedStep('intro');
    if (restoredDraft || restoredText || restoredConsultationDraft) {
      setSaveState('saved');
      setLastSavedAt('復元済み');
    }
  }, []);

  useEffect(() => {
    if (!initialized.current) return;
    debouncedSave(state);
  }, [state, debouncedSave]);

  useEffect(() => {
    if (!initialized.current) return;
    setSaveState('saving');
    saveConsultationText(consultationText);
    markSaved();
  }, [consultationText, markSaved]);

  useEffect(() => {
    if (!initialized.current) return;
    setSaveState('saving');
    saveConsultationDraft(consultationDraft);
    markSaved();
  }, [consultationDraft, markSaved]);

  useEffect(() => {
    if (!initialized.current) return;
    setSaveState('saving');
    saveSelectedSkills(selectedSkillIds);
    markSaved();
  }, [selectedSkillIds, markSaved]);

  useEffect(() => {
    if (!initialized.current) return;
    saveConsultationPromptVariant(consultationPromptVariant);
  }, [consultationPromptVariant]);

  useEffect(() => {
    if (!initialized.current) return;
    saveUiTestMode(testMode);
  }, [testMode]);

  useEffect(() => () => {
    if (promptCopyTimerRef.current) clearTimeout(promptCopyTimerRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const errors = validationErrors(state);
  const exportable = canExport(state);
  const generationMode = getGenerationMode();
  const requiresCookieSession = generationMode === 'remote' && getRemoteAuthMode() === 'cookie_session';
  const activeStep = guidedStep;
  const suggestedRepoType = consultationDraft?.suggestedState.structure.repo_type ?? state.structure.repo_type;
  const suggestedSecurity = consultationDraft?.suggestedState.securityLevelOverride ?? state.security.level;
  const summaryProjectName = state.project.name || consultationDraft?.suggestedState.project.name || '未確定';
  const summaryDescription = state.project.description || consultationDraft?.suggestedState.project.description || '未確定';
  const summaryDomains = state.tech.domains.length > 0
    ? state.tech.domains.join(', ')
    : consultationDraft?.suggestedState.tech.domains.join(', ') || '未確定';
  const recommendedSkills = getRecommendedSkills(state.tech.ai_tools);
  const starterSkills = recommendedSkills.filter((skill) => skill.selectionStage === 'first');
  const laterSkills = recommendedSkills.filter((skill) => skill.selectionStage === 'later');
  const selectedSkills = SKILL_CATALOG.filter((item) => selectedSkillIds.includes(item.id));
  const saveLabel = formatSaveLabel(saveState, lastSavedAt);

  const recommendationNotes = [
    suggestedRepoType === 'multi'
      ? '機能の境界が分かれそうなので、マルチ構成のまま進める方が安全です。'
      : 'まずはシングル構成で早く動かし、必要になった時点で分割する進め方が合っています。',
    suggestedSecurity === 'high'
      ? '機密性の高い情報を扱う前提なので、high 相当の運用前提で生成内容を確認してください。'
      : suggestedSecurity === 'medium'
        ? '社内データや顧客データの取り扱いがありそうなので、medium を基準に見るのが自然です。'
        : '低リスク寄りですが、認証や API key の有無に応じて security は再確認してください。',
    consultationDraft?.extracted.integrations.length
      ? `外部連携候補: ${consultationDraft.extracted.integrations.join(', ')}`
      : '外部連携は未確定です。生成後に別タスクとして切り出しても進められます。',
  ];

  function canVisitStep(step: GuidedStep): boolean {
    switch (step) {
      case 'intro':
      case 'paste':
        return true;
      case 'draft':
        return Boolean(consultationDraft);
      case 'options':
      case 'detail':
      case 'review':
      case 'result':
        return draftApplied;
      default:
        return false;
    }
  }

  function goToStep(step: GuidedStep) {
    if (!canVisitStep(step)) return;
    setGuidedStep(step);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function toggleSkillSelection(skillId: string) {
    setSelectedSkillIds((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId],
    );
  }

  function renderSkillCard(skill: SkillCatalogItem) {
    const selected = selectedSkillIds.includes(skill.id);
    return (
      <label key={skill.id} className={`skill-card${selected ? ' skill-card-selected' : ''}`}>
        <div className="skill-card-header">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => toggleSkillSelection(skill.id)}
          />
          <div>
            <strong>{skill.name}</strong>
            <p className="skill-when-to-use">向いている場面: {skill.whenToUse}</p>
            <p>{skill.description}</p>
          </div>
        </div>
        <p className="skill-provider-line"><strong>使えるAI:</strong> {formatSkillProviderNames(skill)}</p>
        <p className="skill-meta">
          提供形態: {formatSkillProviderSupportSummary(skill)} / 提供元: {skill.sourceLabel} / risk: {SKILL_RISK_LABELS[skill.riskLevel]}
          {skill.sourceUrl ? (
            <>
              {' / '}
              <a href={skill.sourceUrl} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()}>
                公式ソース
              </a>
            </>
          ) : null}
        </p>
      </label>
    );
  }

  function handleReset() {
    clearDraft();
    clearConsultationState();
    dispatch({ type: 'RESET' });
    setConsultationText('');
    setConsultationDraft(null);
    setSelectedSkillIds([]);
    setSelectedTestTemplateId('');
    setConsultationMessage(null);
    setPromptCopied(false);
    setGuidedStep('intro');
    setResumeTargetStep('paste');
    setHasSavedProgress(false);
    setDraftApplied(false);
    setResultPhase('idle');
    setSaveState('idle');
    setLastSavedAt(null);
  }

  async function handleCopyConsultationPrompt() {
    await navigator.clipboard.writeText(getConsultationPromptTemplate(consultationPromptVariant));
    setConsultationMessage('相談用プロンプトをコピーしました。AI で整理した結果を次に貼り付けてください。');
    setPromptCopied(true);
    if (promptCopyTimerRef.current) clearTimeout(promptCopyTimerRef.current);
    promptCopyTimerRef.current = setTimeout(() => setPromptCopied(false), 2400);
  }

  function handleBuildConsultationDraft() {
    setPromptCopied(false);
    const draft = parseConsultationIntake(consultationText, state);
    if (draft.review.facts.length === 0) {
      setConsultationDraft(null);
      setConsultationMessage(
        'ドラフトを作成できませんでした。見出し付きの相談結果を貼り付けてください。少なくとも「プロジェクト概要」「想定ユーザー」「解決したい課題」の本文が必要です。',
      );
      setGuidedStep('paste');
      return;
    }
    setConsultationDraft(draft);
    setConsultationMessage('ドラフトを作成しました。内容を確認して次へ進んでください。');
    setGuidedStep('draft');
    setDraftApplied(false);
    setResultPhase('idle');
  }

  function handleApplyConsultationTestTemplate() {
    const template = CONSULTATION_TEST_TEMPLATES.find((item) => item.id === selectedTestTemplateId);
    if (!template) return;
    setConsultationPromptVariant(template.variant);
    setConsultationText(template.content);
    setConsultationDraft(null);
    setConsultationMessage(`固定テスト文章「${template.label}」を貼り付け欄に反映しました。`);
    setGuidedStep('paste');
    setResumeTargetStep('paste');
    setHasSavedProgress(true);
    setDraftApplied(false);
  }

  function handleStartFresh() {
    handleReset();
    setGuidedStep('paste');
  }

  function handleResumeSavedProgress() {
    goToStep(resumeTargetStep);
  }

  function applyConsultationDraft(nextStep: 'options' | 'detail' | 'review') {
    if (!consultationDraft) return;
    dispatch({ type: 'RESTORE_DRAFT', payload: consultationDraft.suggestedState });
    setConsultationMessage(
      nextStep === 'options'
        ? 'ドラフトをフォームへ反映しました。次に、必要なオプションだけ確認してください。'
        : nextStep === 'detail'
          ? 'ドラフトをフォームへ反映しました。詳細調整で必要な項目だけ確認してください。'
          : 'ドラフトをフォームへ反映しました。最終確認へ進みます。',
    );
    setGuidedStep(nextStep);
    setDraftApplied(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleChangeDraftOpenQuestions(value: string) {
    setConsultationDraft((current) => {
      if (!current) return current;
      return updateDraftOpenQuestions(current, value);
    });
  }

  const releaseLabel = __APP_RELEASE__.startsWith('v') ? __APP_RELEASE__ : `v${__APP_RELEASE__}`;
  const buildLabel = `${releaseLabel} (${__APP_COMMIT__})`;

  return (
    <div className="app">
      <header className="app-header app-header-public">
        <div className="app-topbar">
          <div className="app-topbar-copy">
            <span className="app-save-status">{saveLabel}</span>
            <span className="app-save-note">
              {requiresCookieSession ? 'ログインは ZIP 生成時だけ必要です' : 'ログインなしで最後まで試せます'}
            </span>
          </div>
          <label className="app-utility-toggle">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(event) => setTestMode(event.target.checked)}
            />
            テストモード
          </label>
        </div>

        <h1>RepoGenesis</h1>
        <p>AI対応リポジトリ構造ジェネレータ</p>
        <p className="app-version">{buildLabel}</p>
      </header>

      <AuthPanel enabled={requiresCookieSession} onSessionChange={setAuthSession} compact />

      <nav className="wizard-nav" aria-label="作業ステップ">
        {WIZARD_STEPS.map((step, index) => {
          const available = canVisitStep(step.id);
          const current = activeStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              className={`wizard-step${current ? ' wizard-step-current' : ''}${available ? '' : ' wizard-step-locked'}`}
              onClick={() => goToStep(step.id)}
              disabled={!available}
            >
              <span className="wizard-step-index">{index + 1}</span>
              <span>{step.label}</span>
            </button>
          );
        })}
      </nav>

      <main className="app-main">
        {guidedStep === 'intro' && (
          <IntroSection
            onStart={handleStartFresh}
            onResume={handleResumeSavedProgress}
            hasSavedProgress={hasSavedProgress}
            resumeStepLabel={WIZARD_STEPS.find((step) => step.id === resumeTargetStep)?.label ?? '途中のステップ'}
            saveLabel={saveLabel}
            requiresLoginForRemoteZip={requiresCookieSession}
          />
        )}

        {guidedStep === 'paste' && (
          <ConsultationSection
            mode="paste"
            showTestTools={testMode}
            promptVariant={consultationPromptVariant}
            onChangePromptVariant={setConsultationPromptVariant}
            selectedTestTemplateId={selectedTestTemplateId}
            onChangeTestTemplateId={setSelectedTestTemplateId}
            onApplyTestTemplate={handleApplyConsultationTestTemplate}
            intakeText={consultationText}
            onChangeText={setConsultationText}
            onCopyPrompt={handleCopyConsultationPrompt}
            promptCopied={promptCopied}
            onBuildDraft={handleBuildConsultationDraft}
            onContinueToOptions={() => applyConsultationDraft('options')}
            onChangeOpenQuestions={handleChangeDraftOpenQuestions}
            draft={consultationDraft}
            message={consultationMessage}
          />
        )}

        {guidedStep === 'draft' && consultationDraft && (
          <ConsultationSection
            mode="draft"
            showTestTools={testMode}
            promptVariant={consultationPromptVariant}
            onChangePromptVariant={setConsultationPromptVariant}
            selectedTestTemplateId={selectedTestTemplateId}
            onChangeTestTemplateId={setSelectedTestTemplateId}
            onApplyTestTemplate={handleApplyConsultationTestTemplate}
            intakeText={consultationText}
            onChangeText={setConsultationText}
            onCopyPrompt={handleCopyConsultationPrompt}
            promptCopied={promptCopied}
            onBuildDraft={handleBuildConsultationDraft}
            onContinueToOptions={() => applyConsultationDraft('options')}
            onChangeOpenQuestions={handleChangeDraftOpenQuestions}
            draft={consultationDraft}
            message={consultationMessage}
          />
        )}

        {guidedStep === 'options' && draftApplied && (
          <section className="form-section options-section">
            <p className="section-kicker">Step 4</p>
            <h2>おすすめオプション</h2>
            <p className="consultation-lead">
              ここでは generator に既にある設定だけに絞って、repo 構成や security を軽く調整します。迷う場合は推奨値のままで進めます。
            </p>

            <div className="consultation-columns options-grid">
              <div className="consultation-card">
                <h4>リポジトリ構成</h4>
                <p className="option-callout">推奨: <strong>{suggestedRepoType === 'single' ? 'シングル' : 'マルチ'}</strong></p>
                <div className="toggle-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="guidedRepoType"
                      checked={state.structure.repo_type === 'single'}
                      onChange={() => dispatch({ type: 'SET_REPO_TYPE', payload: 'single' })}
                    />
                    シングル
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="guidedRepoType"
                      checked={state.structure.repo_type === 'multi'}
                      onChange={() => dispatch({ type: 'SET_REPO_TYPE', payload: 'multi' })}
                    />
                    マルチ
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
                <h4>進め方の段階数</h4>
                <p className="option-callout">現在値: <strong>{state.workflow.phases_count}段階</strong></p>
                <div className="toggle-group">
                  {[2, 3, 4, 5].map((count) => (
                    <label key={count} className="radio-label">
                      <input
                        type="radio"
                        name="guidedPhases"
                        checked={state.workflow.phases_count === count}
                        onChange={() => dispatch({ type: 'SET_PHASES_COUNT', payload: count })}
                      />
                      {count}段階
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

            <div className="consultation-summary skill-selection">
              <p><strong>Skill（スキル）</strong></p>
              <p className="consultation-lead">
                {generationMode === 'remote'
                  ? 'Skill（スキル）はアプリ機能ではなく、生成後に Codex / Claude Code / Gemini CLI へ「この repo をどう進めるか」を頼む時の補助ガイドです。選んだ Skill のファイルは ZIP に一緒に入りますが、自動では動きません。'
                  : 'Skill（スキル）は、生成後に AI と一緒に作業する時の補助ガイドです。このモードでは ZIP への自動同梱はまだないため、必要になった時だけ後から追加します。'}
              </p>
              <ul className="skill-selection-notes">
                <li>ZIP に入るのは「Skill（スキル）のファイルが一緒に入る」という意味です。</li>
                <li>解凍後に対応する AI でその project を開くと、その Skill（スキル）を参照しながら作業できます。</li>
                <li>何もしなくても勝手に動くものではなく、AI に頼む時の補助になります。</li>
                <li>迷う場合は、まず `Repo Readiness Review` だけ選べば十分です。</li>
              </ul>
              {recommendedSkills.length > 0 ? (
                <>
                  {starterSkills.length > 0 && (
                    <div className="skill-group">
                      <p><strong>最初に入れておくとよい Skill（スキル）</strong></p>
                      <div className="skill-grid">
                        {starterSkills.map(renderSkillCard)}
                      </div>
                    </div>
                  )}
                  {laterSkills.length > 0 && (
                    <div className="skill-group">
                      <p><strong>困った時に追加する Skill（スキル）</strong></p>
                      <div className="skill-grid">
                        {laterSkills.map(renderSkillCard)}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="skill-grid">
                  <p className="consultation-lead">現在の AI tool 設定に一致する curated skill はまだありません。</p>
                </div>
              )}
            </div>

            <div className="output-actions">
              <button type="button" onClick={() => goToStep('draft')} className="btn-secondary">
                ドラフトへ戻る
              </button>
              <button type="button" onClick={() => goToStep('detail')} className="btn-primary">
                詳細調整へ進む
              </button>
            </div>
          </section>
        )}

        {guidedStep === 'detail' && draftApplied && (
          <section className="form-section detail-section">
            <p className="section-kicker">Step 5</p>
            <h2>詳細調整</h2>
            <p className="consultation-lead">
              必要に応じて project / tech / security / repo 構成をここで調整します。迷う場合は大きく変えずに次へ進んで問題ありません。
            </p>

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
                          placeholder={'例:\n外部APIが本当に必要か\nシングル構成で十分か'}
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

            <div className="output-actions">
              <button type="button" onClick={() => goToStep('options')} className="btn-secondary">
                オプションへ戻る
              </button>
              <button type="button" onClick={() => goToStep('review')} className="btn-primary">
                最終確認へ進む
              </button>
            </div>
          </section>
        )}

        {guidedStep === 'review' && draftApplied && (
          <section className="form-section final-review-section">
            <p className="section-kicker">Step 6</p>
            <h2>最終確認</h2>
            <p className="consultation-lead">
              生成前の要点だけを確認します。ここでは読むことに集中して、問題があれば前のステップへ戻って調整します。
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
                <p><strong>段階数:</strong> {state.workflow.phases_count}</p>
              </div>
            </div>

            <div className="consultation-summary">
              <p><strong>説明候補:</strong> {summaryDescription}</p>
            </div>

            <div className="consultation-summary">
              <p><strong>選択した Skill（スキル）:</strong> {selectedSkills.length > 0 ? selectedSkills.map((skill) => skill.name).join(', ') : 'なし'}</p>
              {selectedSkills.length > 0 && (
                <p className="consultation-lead">選んだ Skill（スキル）は ZIP に一緒に入りますが、自動実行はされません。解凍後に対応する AI でこの project を開いた時に使います。</p>
              )}
            </div>

            <div className="output-actions">
              <button type="button" onClick={() => goToStep('detail')} className="btn-secondary">
                詳細調整へ戻る
              </button>
              <button
                type="button"
                onClick={() => {
                  setGuidedStep('result');
                  setResultPhase('idle');
                  requestAnimationFrame(() => {
                    outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  });
                }}
                className="btn-primary"
              >
                ZIP生成へ進む
              </button>
            </div>
          </section>
        )}

        {guidedStep === 'result' && draftApplied && (
          <>
            <JsonOutput
              sectionRef={outputRef}
              title="Step 7. ZIP生成と結果"
              lead="最後に JSON と ZIP 生成結果を確認します。request id やダウンロード導線もここに集約します。"
              collapseJsonByDefault
              showJsonTools={testMode}
              onGenerationStateChange={setResultPhase}
              onErrorReportChange={setLatestErrorReport}
              state={state}
              canExport={exportable}
              errors={errors}
              authSession={authSession}
              consultationDraft={consultationDraft}
              consultationPromptVariant={consultationPromptVariant}
              selectedSkills={selectedSkills}
            />
            <div className="output-actions page-actions">
              <button type="button" onClick={() => goToStep('review')} className="btn-secondary">
                最終確認へ戻る
              </button>
            </div>
          </>
        )}

        <div className="app-actions">
          <button type="button" onClick={handleReset} className="btn-reset">
            リセットして始めから
          </button>
        </div>
      </main>

      <FeedbackWidget state={state} errorReport={latestErrorReport} />
    </div>
  );
}

export default App;
