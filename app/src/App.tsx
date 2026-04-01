import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { formReducer, initialFormState } from './state/formReducer';
import { validationErrors, canExport } from './state/selectors';
import type { FormState } from './state/actions.ts';
import {
  clearConsultationState,
  clearDraft,
  loadConsultationDraft,
  loadConsultationPromptVariant,
  loadConsultationText,
  loadDraft,
  loadRecommendationDecisions,
  loadSelectedSkills,
  loadUiTestMode,
  saveConsultationDraft,
  saveConsultationPromptVariant,
  saveConsultationText,
  saveDraft,
  saveRecommendationDecisions,
  saveSelectedSkills,
  saveUiTestMode,
} from './utils/storage';
import { IntroSection } from './components/sections/IntroSection';
import { ConsultationSection } from './components/sections/ConsultationSection';
import { WizardChrome } from './components/layout/WizardChrome';
import { ProjectSection } from './components/sections/ProjectSection';
import { TechSection } from './components/sections/TechSection';
import { SecuritySection } from './components/sections/SecuritySection';
import { StructureSection } from './components/sections/StructureSection';
import { WorkflowSection } from './components/sections/WorkflowSection';
import { PlanningSection } from './components/sections/PlanningSection';
import { JsonOutput } from './components/output/JsonOutput';
import { RefinementPromptPanel } from './components/output/RefinementPromptPanel';
import { AuthPanel } from './components/auth/AuthPanel';
import { FeedbackWidget } from './components/feedback/FeedbackWidget';
import { SupportPanel } from './components/support/SupportPanel';
import { getGenerationMode, usesSameOriginOrchestrationProxy } from './utils/generateRepository';
import { canViewSupportPanel } from './utils/supportAccess.ts';
import {
  buildRuntimeLabel,
  formatRuntimeLabelTitle,
  normalizeRuntimeLabelMode,
  shouldShowRuntimeLabel,
} from './utils/runtimeLabel.ts';
import {
  getConsultationPromptTemplate,
  parseConsultationIntake,
  updateDraftOpenQuestions,
  type ConsultationPromptVariant,
  type IntakeDraft,
} from './utils/intakeParser';
import { formatIntakeProviderLabel } from './utils/intakeProvider.ts';
import {
  buildRequirementRefinementPrompt,
  getRequirementRefinementPromptFilename,
} from './utils/refinementPrompt.ts';
import {
  buildProviderGuidedPrompt,
  buildProviderPromptFilename,
  type ExternalPromptProvider,
} from './utils/providerPrompt.ts';
import {
  DEFAULT_RECOMMENDATION_DECISIONS,
  deriveDraftRecommendations,
  type RecommendationDecisions,
  type RecommendationDecisionStatus,
  type RecommendationKey,
} from './utils/recommendations.ts';
import {
  formatSkillProviderNames,
  formatSkillProviderSupportSummary,
  getAutoSelectedSkillIds,
  getRecommendedSkills,
  SKILL_CATALOG,
  SKILL_RISK_LABELS,
  type SkillCatalogItem,
} from './data/skillCatalog.ts';
import { CONSULTATION_TEST_TEMPLATES } from './data/consultationTestTemplates.ts';
import { formatAiToolNames, formatAiToolWrapperFiles } from './constants/enums.ts';
import type { ErrorReportPayload } from './utils/feedback.ts';
import './App.css';

declare const __APP_RELEASE__: string;
declare const __APP_COMMIT__: string;
declare const __APP_DEPLOYED_AT__: string;
declare const __APP_RUNTIME_LABEL_MODE__: string;

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

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function scrollToStepTop() {
  window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

function buildSkillRecommendationContext(state: FormState) {
  return {
    aiTools: state.tech.ai_tools,
    domains: state.tech.domains,
    frameworks: state.tech.frameworks,
    repoType: state.structure.repo_type,
    planningHints: [
      state.project.description,
      ...state.planning.tech_decisions.map((item) => [item.topic, item.choice, item.notes].filter(Boolean).join(' ')),
      ...state.planning.external_dependencies.map((item) => [item.name, item.purpose, item.source, item.notes].filter(Boolean).join(' ')),
    ].filter((item) => item.trim().length > 0),
  };
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
  const [promptProvider, setPromptProvider] = useState<ExternalPromptProvider>('chatgpt');
  const [recommendationDecisions, setRecommendationDecisions] = useState<RecommendationDecisions>(() => loadRecommendationDecisions());
  const [skillSelectionTouched, setSkillSelectionTouched] = useState(false);
  const [guidedStep, setGuidedStep] = useState<GuidedStep>('intro');
  const [draftApplied, setDraftApplied] = useState<boolean>(() =>
    deriveInitialWizardState(loadDraft(), loadConsultationText(), loadConsultationDraft()).draftApplied);
  const [resumeTargetStep, setResumeTargetStep] = useState<GuidedStep>(() =>
    deriveInitialWizardState(loadDraft(), loadConsultationText(), loadConsultationDraft()).step);
  const [hasSavedProgress, setHasSavedProgress] = useState<boolean>(() =>
    deriveInitialWizardState(loadDraft(), loadConsultationText(), loadConsultationDraft()).hasProgress);
  const [, setResultPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [latestErrorReport, setLatestErrorReport] = useState<ErrorReportPayload | null>(null);
  const [authSession, setAuthSession] = useState<{ authenticated: boolean; email: string | null }>({
    authenticated: false,
    email: null,
  });
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [supportPanelOpen, setSupportPanelOpen] = useState(false);

  const initialized = useRef(false);
  const promptCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const outputRef = useRef<HTMLElement | null>(null);
  const mainRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldFocusMainRef = useRef(false);

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
    saveRecommendationDecisions(recommendationDecisions);
  }, [recommendationDecisions]);

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

  useEffect(() => {
    if (!supportPanelOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setSupportPanelOpen(false);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [supportPanelOpen]);

  useEffect(() => {
    if (!initialized.current || !shouldFocusMainRef.current) return;
    shouldFocusMainRef.current = false;
    mainRef.current?.focus({ preventScroll: true });
  }, [guidedStep]);

  const errors = validationErrors(state);
  const exportable = canExport(state);
  const generationMode = getGenerationMode();
  const requiresRemoteLogin = generationMode === 'remote' && usesSameOriginOrchestrationProxy();
  const showSupportPanel = requiresRemoteLogin
    && authSession.authenticated
    && canViewSupportPanel(authSession.email);
  const runtimeLabelMode = normalizeRuntimeLabelMode(__APP_RUNTIME_LABEL_MODE__);
  const showRuntimeLabel = shouldShowRuntimeLabel(runtimeLabelMode, showSupportPanel);
  const activeStep = guidedStep;
  const suggestedRepoType = consultationDraft?.suggestedState.structure.repo_type ?? state.structure.repo_type;
  const suggestedSecurity = consultationDraft?.suggestedState.securityLevelOverride ?? state.security.level;
  const suggestedPhasesCount = consultationDraft?.suggestedState.workflow.phases_count ?? state.workflow.phases_count;
  const summaryProjectName = state.project.name || consultationDraft?.suggestedState.project.name || '未確定';
  const summaryDescription = state.project.description || consultationDraft?.suggestedState.project.description || '未確定';
  const summaryDomains = state.tech.domains.length > 0
    ? state.tech.domains.join(', ')
    : consultationDraft?.suggestedState.tech.domains.join(', ') || '未確定';
  const skillRecommendationContext = buildSkillRecommendationContext(state);
  const recommendedSkills = getRecommendedSkills(skillRecommendationContext);
  const autoSelectedSkillIds = getAutoSelectedSkillIds(skillRecommendationContext);
  const starterSkills = recommendedSkills.filter((skill) => skill.selectionStage === 'first');
  const laterSkills = recommendedSkills.filter((skill) => skill.selectionStage === 'later');
  const selectedSkills = SKILL_CATALOG.filter((item) => selectedSkillIds.includes(item.id));
  const autoSelectedSkills = SKILL_CATALOG.filter((item) => autoSelectedSkillIds.includes(item.id));
  const activeAiToolNames = formatAiToolNames(state.tech.ai_tools) || 'AI ツール';
  const activeWrapperFiles = formatAiToolWrapperFiles(state.tech.ai_tools);
  const skillLead = generationMode === 'remote'
    ? `Skill（スキル）はアプリ機能ではなく、生成後に ${activeAiToolNames} へ「この repo をどう進めるか」を頼む時の補助ガイドです。選んだ Skill のファイルは ZIP に一緒に入り、${activeWrapperFiles ? `生成された ${activeWrapperFiles} と同じく repo 内 guidance として参照されます` : 'repo 内 guidance として参照されます'}が、自動では動きません。`
    : `Skill（スキル）は、生成後に ${activeAiToolNames} と一緒に作業する時の補助ガイドです。${activeWrapperFiles ? `まず生成された ${activeWrapperFiles} を入口として読み、必要な Skill を後から足します。` : ''} このモードでは ZIP への自動同梱はまだないため、必要になった時だけ後から追加します。`;
  const adoptedTechDecisions = state.planning.tech_decisions.filter((item) => item.status === 'adopted' && item.topic.trim() && item.choice.trim());
  const adoptedExternalDependencies = state.planning.external_dependencies.filter((item) => item.status === 'adopted' && item.name.trim());
  const draftRecommendations = consultationDraft
    ? deriveDraftRecommendations(state, consultationDraft, recommendationDecisions)
    : [];
  const repoTypeRecommendation = draftRecommendations.find((item) => item.key === 'repo_type');
  const securityRecommendation = draftRecommendations.find((item) => item.key === 'security_level');
  const phasesRecommendation = draftRecommendations.find((item) => item.key === 'phases_count');
  const suggestedDomainsLabel = consultationDraft?.suggestedState.tech.domains.join(', ') || '未確定';
  const suggestedLanguageLabel = consultationDraft?.suggestedState.tech.primary_language ?? state.tech.primary_language;
  const suggestedFrameworksLabel = consultationDraft?.suggestedState.tech.frameworks.join(', ') || '未確定';
  const planningPreviewTech = state.planning.tech_decisions
    .filter((item) => item.topic.trim() && item.choice.trim())
    .slice(0, 4)
    .map((item) => `${item.topic}: ${item.choice} (${item.status})`);
  const planningPreviewDependencies = state.planning.external_dependencies
    .filter((item) => item.name.trim())
    .slice(0, 4)
    .map((item) => `${item.name} (${item.status})`);
  const skillActivationExample = selectedSkills.length > 0
    ? `「PROJECT.md${activeWrapperFiles ? ` と ${activeWrapperFiles}` : ''} を読んで、${selectedSkills[0].name} を使って最初に進めるべきタスクを整理して」`
    : `「PROJECT.md${activeWrapperFiles ? ` と ${activeWrapperFiles}` : ''} を読んで、このプロジェクトで最初に使うべき Skill を選んで」`;
  const recommendationStatusLabels: Record<RecommendationDecisionStatus, string> = {
    pending: '未確認',
    accepted: '採用',
    overridden: '上書き済み',
  };
  const saveLabel = formatSaveLabel(saveState, lastSavedAt);
  const guidedConsultationPrompt = buildProviderGuidedPrompt(
    getConsultationPromptTemplate(consultationPromptVariant),
    promptProvider,
    'consultation',
  );
  const draftRefinementPrompt = consultationDraft
    ? buildProviderGuidedPrompt(
      buildRequirementRefinementPrompt(
        consultationDraft.suggestedState,
        consultationDraft,
        consultationPromptVariant,
      ),
      promptProvider,
      'refinement',
    )
    : null;
  const reviewRefinementPrompt = consultationDraft
    ? buildProviderGuidedPrompt(
      buildRequirementRefinementPrompt(
        state,
        consultationDraft,
        consultationPromptVariant,
      ),
      promptProvider,
      'refinement',
    )
    : null;
  const draftRefinementPromptFilename = buildProviderPromptFilename(
    getRequirementRefinementPromptFilename(
      consultationDraft?.suggestedState.project.slug || consultationDraft?.suggestedState.project.name || undefined,
    ),
    promptProvider,
  );
  const reviewRefinementPromptFilename = buildProviderPromptFilename(
    getRequirementRefinementPromptFilename(
      state.project.slug || state.project.name || undefined,
    ),
    promptProvider,
  );
  const activeStepLabel = WIZARD_STEPS.find((step) => step.id === activeStep)?.label ?? activeStep;

  useEffect(() => {
    if (showSupportPanel) return;
    setSupportPanelOpen(false);
  }, [showSupportPanel]);

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
    shouldFocusMainRef.current = true;
    setGuidedStep(step);
    scrollToStepTop();
  }

  function toggleSkillSelection(skillId: string) {
    setSkillSelectionTouched(true);
    setSelectedSkillIds((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId],
    );
  }

  function setRecommendationStatus(key: RecommendationKey, status: RecommendationDecisionStatus) {
    setRecommendationDecisions((current) => ({
      ...current,
      [key]: status,
    }));
  }

  function applySuggestedRecommendation(key: RecommendationKey) {
    if (!consultationDraft) return;
    switch (key) {
      case 'repo_type':
        dispatch({ type: 'SET_REPO_TYPE', payload: suggestedRepoType });
        break;
      case 'security_level':
        dispatch({ type: 'SET_SECURITY_LEVEL_OVERRIDE', payload: suggestedSecurity });
        break;
      case 'phases_count':
        dispatch({ type: 'SET_PHASES_COUNT', payload: suggestedPhasesCount });
        break;
      default:
        return;
    }
    setRecommendationStatus(key, 'accepted');
  }

  function handleRepoTypeChange(value: typeof suggestedRepoType) {
    dispatch({ type: 'SET_REPO_TYPE', payload: value });
    setRecommendationStatus('repo_type', value === suggestedRepoType ? 'accepted' : 'overridden');
  }

  function handleSecurityChange(value: typeof suggestedSecurity) {
    dispatch({ type: 'SET_SECURITY_LEVEL_OVERRIDE', payload: value });
    setRecommendationStatus('security_level', value === suggestedSecurity ? 'accepted' : 'overridden');
  }

  function handlePhasesChange(value: number) {
    dispatch({ type: 'SET_PHASES_COUNT', payload: value });
    setRecommendationStatus('phases_count', value === suggestedPhasesCount ? 'accepted' : 'overridden');
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
    setRecommendationDecisions(DEFAULT_RECOMMENDATION_DECISIONS);
    setSelectedSkillIds([]);
    setSkillSelectionTouched(false);
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
    try {
      await navigator.clipboard.writeText(guidedConsultationPrompt);
      setConsultationMessage('相談用プロンプトをコピーしました。AI で整理した結果を次に貼り付けてください。');
      setPromptCopied(true);
      if (promptCopyTimerRef.current) clearTimeout(promptCopyTimerRef.current);
      promptCopyTimerRef.current = setTimeout(() => setPromptCopied(false), 2400);
    } catch {
      setConsultationMessage('プロンプトのコピーに失敗しました。HTTPS 環境または対応ブラウザで再試行してください。');
      setPromptCopied(false);
    }
  }

  function handleBuildConsultationDraft() {
    setPromptCopied(false);
    const draft = parseConsultationIntake(consultationText, state, {
      provider: promptProvider,
      promptVersion: consultationPromptVariant,
    });
    if (draft.review.facts.length === 0) {
      setConsultationDraft(null);
      setConsultationMessage(
        'ドラフトを作成できませんでした。見出し付きの相談結果を貼り付けてください。少なくとも「プロジェクト概要」「想定ユーザー」「解決したい課題」の本文が必要です。',
      );
      setGuidedStep('paste');
      return;
    }
    setConsultationDraft(draft);
    setRecommendationDecisions(DEFAULT_RECOMMENDATION_DECISIONS);
    setSelectedSkillIds([]);
    setSkillSelectionTouched(false);
    setConsultationMessage('ドラフトを作成しました。内容を確認して次へ進んでください。');
    setGuidedStep('draft');
    scrollToStepTop();
    setDraftApplied(false);
    setResultPhase('idle');
  }

  function handleApplyConsultationTestTemplate() {
    const template = CONSULTATION_TEST_TEMPLATES.find((item) => item.id === selectedTestTemplateId);
    if (!template) return;
    setConsultationPromptVariant(template.variant);
    setConsultationText(template.content);
    setConsultationDraft(null);
    setRecommendationDecisions(DEFAULT_RECOMMENDATION_DECISIONS);
    setSelectedSkillIds([]);
    setSkillSelectionTouched(false);
    setConsultationMessage(`固定テスト文章「${template.label}」を貼り付け欄に反映しました。`);
    setGuidedStep('paste');
    scrollToStepTop();
    setResumeTargetStep('paste');
    setHasSavedProgress(true);
    setDraftApplied(false);
  }

  function handleStartFresh() {
    handleReset();
    setGuidedStep('paste');
    scrollToStepTop();
  }

  function handleResumeSavedProgress() {
    goToStep(resumeTargetStep);
  }

  function applyConsultationDraft(nextStep: 'options' | 'detail' | 'review') {
    if (!consultationDraft) return;
    const restoredState = consultationDraft.suggestedState;
    dispatch({ type: 'RESTORE_DRAFT', payload: restoredState });
    setRecommendationDecisions(DEFAULT_RECOMMENDATION_DECISIONS);
    if (!skillSelectionTouched) {
      const autoSkills = getAutoSelectedSkillIds(buildSkillRecommendationContext(restoredState));
      setSelectedSkillIds(autoSkills);
    }
    setConsultationMessage(
      nextStep === 'options'
        ? 'ドラフトをフォームへ反映しました。次に、必要なオプションだけ確認してください。'
        : nextStep === 'detail'
          ? 'ドラフトをフォームへ反映しました。詳細調整で必要な項目だけ確認してください。'
          : 'ドラフトをフォームへ反映しました。最終確認へ進みます。',
    );
    setGuidedStep(nextStep);
    setDraftApplied(true);
    scrollToStepTop();
  }

  function handleChangeDraftOpenQuestions(value: string) {
    setConsultationDraft((current) => {
      if (!current) return current;
      return updateDraftOpenQuestions(current, value);
    });
  }

  const releaseLabel = __APP_RELEASE__.startsWith('v') ? __APP_RELEASE__ : `v${__APP_RELEASE__}`;
  const runtimeLabel = showRuntimeLabel
    ? buildRuntimeLabel(releaseLabel, __APP_COMMIT__, __APP_DEPLOYED_AT__)
    : null;
  const runtimeLabelTitle = runtimeLabel
    ? formatRuntimeLabelTitle(__APP_DEPLOYED_AT__)
    : undefined;

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">メインコンテンツへ移動</a>
      <p className="sr-only" role="status" aria-live="polite">
        現在のステップ: {activeStepLabel}
      </p>
      <WizardChrome
        saveLabel={saveLabel}
        requiresRemoteLogin={requiresRemoteLogin}
        testMode={testMode}
        onToggleTestMode={setTestMode}
        runtimeLabel={runtimeLabel}
        runtimeLabelTitle={runtimeLabelTitle}
        authControls={requiresRemoteLogin ? (
          <AuthPanel
            enabled={requiresRemoteLogin}
            onSessionChange={setAuthSession}
            compact
            inline
          />
        ) : null}
        showDeveloperTools={showSupportPanel}
        onOpenSupportPanel={() => setSupportPanelOpen(true)}
        activeStep={activeStep}
        steps={WIZARD_STEPS}
        canVisitStep={canVisitStep}
        onGoToStep={goToStep}
      />

      <main id="main-content" className="app-main" ref={mainRef} tabIndex={-1}>
        {guidedStep === 'intro' && (
          <IntroSection
            onResume={handleResumeSavedProgress}
            hasSavedProgress={hasSavedProgress}
            resumeStepLabel={WIZARD_STEPS.find((step) => step.id === resumeTargetStep)?.label ?? '途中のステップ'}
            saveLabel={saveLabel}
            requiresLoginForRemoteZip={requiresRemoteLogin}
          />
        )}

        {guidedStep === 'paste' && (
          <ConsultationSection
            mode="paste"
            showTestTools={testMode}
            promptVariant={consultationPromptVariant}
            onChangePromptVariant={setConsultationPromptVariant}
            promptProvider={promptProvider}
            onChangePromptProvider={setPromptProvider}
            selectedTestTemplateId={selectedTestTemplateId}
            onChangeTestTemplateId={setSelectedTestTemplateId}
            onApplyTestTemplate={handleApplyConsultationTestTemplate}
            intakeText={consultationText}
            onChangeText={setConsultationText}
            onCopyPrompt={handleCopyConsultationPrompt}
            promptCopied={promptCopied}
            onBuildDraft={handleBuildConsultationDraft}
            onBackToPaste={() => goToStep('paste')}
            onContinueToOptions={() => applyConsultationDraft('options')}
            onChangeOpenQuestions={handleChangeDraftOpenQuestions}
            draft={consultationDraft}
            message={consultationMessage}
          />
        )}

        {guidedStep === 'draft' && consultationDraft && (
          <>
            <ConsultationSection
              mode="draft"
              showTestTools={testMode}
              promptVariant={consultationPromptVariant}
              onChangePromptVariant={setConsultationPromptVariant}
              promptProvider={promptProvider}
              onChangePromptProvider={setPromptProvider}
              selectedTestTemplateId={selectedTestTemplateId}
              onChangeTestTemplateId={setSelectedTestTemplateId}
              onApplyTestTemplate={handleApplyConsultationTestTemplate}
              intakeText={consultationText}
              onChangeText={setConsultationText}
              onCopyPrompt={handleCopyConsultationPrompt}
              promptCopied={promptCopied}
              onBuildDraft={handleBuildConsultationDraft}
              onBackToPaste={() => goToStep('paste')}
              onContinueToOptions={() => applyConsultationDraft('options')}
              onChangeOpenQuestions={handleChangeDraftOpenQuestions}
              draft={consultationDraft}
              message={consultationMessage}
            />
            {draftRefinementPrompt && (
              <RefinementPromptPanel
                title="外部AIで要件をもう一段詰める"
                lead="この draft と仮置き設定を Markdown で持ち出せます。ChatGPT / Claude / Gemini などで整理し直したら、相談内容のステップへ戻って貼り付けてください。"
                promptText={draftRefinementPrompt}
                filename={draftRefinementPromptFilename}
                provider={promptProvider}
                onChangeProvider={setPromptProvider}
              />
            )}
          </>
        )}

        {guidedStep === 'options' && draftApplied && (
          <section className="form-section options-section">
            <p className="section-kicker">Step 4</p>
            <h2>おすすめオプション</h2>
            <p className="consultation-lead">
              ここでは generator に既にある設定だけに絞って、repo 構成や security を軽く調整します。迷う場合は推奨値のままで進めます。
            </p>

            <div className="consultation-guidance">
              <h4>この画面の見方</h4>
              <ul>
                <li>この画面の「現在」は、ドラフト反映時にフォームへ入った仮置き値です。</li>
                <li>多くの場合、現在値は AI / parser が提案した値と同じです。</li>
                <li>`AI推奨: 未確認` は「まだ人が確認していない」という意味で、未採用という意味ではありません。</li>
              </ul>
            </div>

            <div className="consultation-columns options-grid">
              <div className="consultation-card">
                <h4>リポジトリ構成</h4>
                {repoTypeRecommendation && (
                  <>
                    <span className={`recommendation-badge recommendation-badge-${repoTypeRecommendation.status}`}>
                      AI推奨: {recommendationStatusLabels[repoTypeRecommendation.status]}
                    </span>
                    <p className="option-callout">
                      推奨: <strong>{repoTypeRecommendation.suggestedLabel}</strong> / 現在: <strong>{repoTypeRecommendation.currentLabel}</strong>
                    </p>
                    <p className="recommendation-rationale">{repoTypeRecommendation.rationale}</p>
                    <div className="recommendation-actions">
                      <button type="button" className="btn-secondary" onClick={() => applySuggestedRecommendation('repo_type')}>
                        この推奨を採用
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setRecommendationStatus('repo_type', 'overridden')}>
                        別の値で進める
                      </button>
                    </div>
                  </>
                )}
                <div className="toggle-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="guidedRepoType"
                      checked={state.structure.repo_type === 'single'}
                      onChange={() => handleRepoTypeChange('single')}
                    />
                    シングル
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="guidedRepoType"
                      checked={state.structure.repo_type === 'multi'}
                      onChange={() => handleRepoTypeChange('multi')}
                    />
                    マルチ
                  </label>
                </div>
              </div>

              <div className="consultation-card">
                <h4>security 水準</h4>
                {securityRecommendation && (
                  <>
                    <span className={`recommendation-badge recommendation-badge-${securityRecommendation.status}`}>
                      AI推奨: {recommendationStatusLabels[securityRecommendation.status]}
                    </span>
                    <p className="option-callout">
                      推奨: <strong>{securityRecommendation.suggestedLabel}</strong> / 現在: <strong>{securityRecommendation.currentLabel}</strong>
                    </p>
                    <p className="recommendation-rationale">{securityRecommendation.rationale}</p>
                    <div className="recommendation-actions">
                      <button type="button" className="btn-secondary" onClick={() => applySuggestedRecommendation('security_level')}>
                        この推奨を採用
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setRecommendationStatus('security_level', 'overridden')}>
                        別の値で進める
                      </button>
                    </div>
                  </>
                )}
                <div className="toggle-group">
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <label key={level} className="radio-label">
                      <input
                        type="radio"
                        name="guidedSecurity"
                        checked={state.security.level === level}
                        onChange={() => handleSecurityChange(level)}
                      />
                      {level}
                    </label>
                  ))}
                </div>
              </div>

              <div className="consultation-card">
                <h4>進め方の段階数</h4>
                {phasesRecommendation && (
                  <>
                    <span className={`recommendation-badge recommendation-badge-${phasesRecommendation.status}`}>
                      AI推奨: {recommendationStatusLabels[phasesRecommendation.status]}
                    </span>
                    <p className="option-callout">
                      推奨: <strong>{phasesRecommendation.suggestedLabel}</strong> / 現在: <strong>{phasesRecommendation.currentLabel}</strong>
                    </p>
                    <p className="recommendation-rationale">{phasesRecommendation.rationale}</p>
                    <div className="recommendation-actions">
                      <button type="button" className="btn-secondary" onClick={() => applySuggestedRecommendation('phases_count')}>
                        この推奨を採用
                      </button>
                      <button type="button" className="btn-secondary" onClick={() => setRecommendationStatus('phases_count', 'overridden')}>
                        別の値で進める
                      </button>
                    </div>
                  </>
                )}
                <div className="toggle-group">
                  {[2, 3, 4, 5].map((count) => (
                    <label key={count} className="radio-label">
                      <input
                        type="radio"
                        name="guidedPhases"
                        checked={state.workflow.phases_count === count}
                        onChange={() => handlePhasesChange(count)}
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
              <p className="consultation-lead">{skillLead}</p>
              <p className="hint">
                最初に入れておくべき Skill は project 内容に合わせて自動選定し、初回は自動でチェックします。不要なら外せます。
              </p>
              <ul className="skill-selection-notes">
                <li>ZIP に入るのは「Skill（スキル）のファイルが一緒に入る」という意味です。</li>
                <li>解凍後に対応する AI でその project を開くと、その Skill（スキル）を参照しながら作業できます。</li>
                <li>何もしなくても勝手に動くものではなく、AI に頼む時の補助になります。</li>
                <li>迷う場合は、まず `Repo Readiness Review` だけ選べば十分です。</li>
              </ul>
              {autoSelectedSkills.length > 0 && (
                <div className="consultation-guidance skill-activation-guide">
                  <h4>自動でチェックする Skill</h4>
                  <p>{autoSelectedSkills.map((skill) => skill.name).join(', ')}</p>
                </div>
              )}
              <div className="consultation-guidance skill-activation-guide">
                <h4>Skill の使い方</h4>
                <ul>
                  <li>生成した repo を対応する AI で開き、最初に `PROJECT.md` と {activeWrapperFiles || 'tool wrapper'} を読ませます。</li>
                  <li>そのうえで、使いたい Skill 名を入れて依頼します。</li>
                  <li>依頼文例: {skillActivationExample}</li>
                </ul>
              </div>
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
              <div className="consultation-guidance">
                <h4>詳細調整の考え方</h4>
                <ul>
                  <li>技術ドメイン、主要言語、フレームワークは相談結果から仮置きされています。</li>
                  <li>技術判断と外部依存も、相談結果から拾えたものは自動で入ります。</li>
                  <li>空欄のままでも進められます。非エンジニアの場合、確実に分かる項目だけ直せば十分です。</li>
                </ul>
              </div>

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
              <div className="consultation-columns detail-guidance-grid">
                <div className="consultation-card">
                  <h4>AIが仮置きした技術情報</h4>
                  <ul>
                    <li>技術ドメイン原案: {suggestedDomainsLabel}</li>
                    <li>主要言語原案: {suggestedLanguageLabel}</li>
                    <li>フレームワーク原案: {suggestedFrameworksLabel}</li>
                  </ul>
                  <p className="hint">現在フォームに入っている値を必要な分だけ直せば大丈夫です。</p>
                </div>
                <div className="consultation-card consultation-card-wide">
                  <h4>自動で入りやすい技術判断と外部依存</h4>
                  <p><strong>技術判断:</strong> {planningPreviewTech.length}件 / <strong>外部依存:</strong> {planningPreviewDependencies.length}件</p>
                  {planningPreviewTech.length > 0 ? (
                    <ul>
                      {planningPreviewTech.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  ) : (
                    <p className="hint">まだ自動入力はありません。未確定なら無理に追加しなくて大丈夫です。</p>
                  )}
                  {planningPreviewDependencies.length > 0 && (
                    <ul>
                      {planningPreviewDependencies.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  )}
                  <p className="hint">API / OSS / GitHub リポジトリなどが分かっている時だけ編集してください。</p>
                </div>
              </div>
              <ProjectSection state={state} dispatch={dispatch} errors={errors} />
              <TechSection state={state} dispatch={dispatch} errors={errors} />
              <SecuritySection state={state} dispatch={dispatch} />
              <StructureSection state={state} dispatch={dispatch} errors={errors} />
              <WorkflowSection state={state} dispatch={dispatch} errors={errors} />
              <PlanningSection state={state} dispatch={dispatch} />
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
              {consultationDraft && (
                <p><strong>相談に使ったAI:</strong> {formatIntakeProviderLabel(consultationDraft.provider)}</p>
              )}
              <p><strong>説明候補:</strong> {summaryDescription}</p>
            </div>

            {draftRecommendations.length > 0 && (
              <div className="consultation-summary">
                <p><strong>AI recommendation の扱い</strong></p>
                <ul>
                  {draftRecommendations.map((recommendation) => (
                    <li key={recommendation.key}>
                      <strong>{recommendation.title}:</strong> 推奨 {recommendation.suggestedLabel} / 現在 {recommendation.currentLabel} / 状態 {recommendationStatusLabels[recommendation.status]}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="review-summary-grid review-planning-grid">
              <div className="consultation-card">
                <h4>adopted decisions</h4>
                {adoptedTechDecisions.length > 0 ? (
                  <ul>
                    {adoptedTechDecisions.map((item) => (
                      <li key={`${item.topic}-${item.choice}`}>
                        <strong>{item.topic}:</strong> {item.choice}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>まだ採用済みの技術判断はありません。</p>
                )}
              </div>
              <div className="consultation-card consultation-card-wide">
                <h4>adopted dependencies</h4>
                {adoptedExternalDependencies.length > 0 ? (
                  <ul>
                    {adoptedExternalDependencies.map((item) => (
                      <li key={`${item.category}-${item.name}`}>
                        <strong>{item.name}</strong> ({item.category})
                        {item.env_vars.length > 0 ? ` / env: ${item.env_vars.join(', ')}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>まだ採用済みの外部依存はありません。</p>
                )}
              </div>
            </div>

            <div className="consultation-summary">
              <p><strong>選択した Skill（スキル）:</strong> {selectedSkills.length > 0 ? selectedSkills.map((skill) => skill.name).join(', ') : 'なし'}</p>
              {selectedSkills.length > 0 && (
                <p className="consultation-lead">選んだ Skill（スキル）は ZIP に一緒に入りますが、自動実行はされません。解凍後に対応する AI でこの project を開いた時に使います。</p>
              )}
            </div>

            {reviewRefinementPrompt && (
              <RefinementPromptPanel
                title="この状態で外部AIに再相談する"
                lead="詳細調整まで含めた現在の設定をそのまま持ち出せます。要件を追加で詰めたい場合だけ使い、整理し直した内容を Step 2 へ戻して反映してください。"
                promptText={reviewRefinementPrompt}
                filename={reviewRefinementPromptFilename}
                provider={promptProvider}
                onChangeProvider={setPromptProvider}
              />
            )}

            <div className="output-actions">
              <button type="button" onClick={() => goToStep('detail')} className="btn-secondary">
                詳細調整へ戻る
              </button>
              <button
                type="button"
                onClick={() => {
                  shouldFocusMainRef.current = true;
                  setGuidedStep('result');
                  setResultPhase('idle');
                  requestAnimationFrame(() => {
                    outputRef.current?.scrollIntoView({
                      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                      block: 'start',
                    });
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

        <div className="app-footer-bar" aria-label="フッター操作">
          <div className="app-footer-actions-left">
            {guidedStep === 'intro' && (
              <button
                type="button"
                onClick={hasSavedProgress ? handleReset : handleStartFresh}
                className="btn-primary"
              >
                {hasSavedProgress ? 'リセット' : '新規に始める'}
              </button>
            )}
            {guidedStep === 'intro' && hasSavedProgress && (
              <button type="button" onClick={handleResumeSavedProgress} className="btn-reset">
                づづきから始める
              </button>
            )}
          </div>
          <div className="app-footer-actions-right">
            <FeedbackWidget state={state} errorReport={latestErrorReport} inline />
          </div>
        </div>
      </main>

      {showSupportPanel && supportPanelOpen && (
        <div
          className="support-modal-backdrop"
          role="presentation"
          onClick={() => setSupportPanelOpen(false)}
        >
          <section
            className="support-modal"
            role="dialog"
            aria-modal="true"
            aria-label="運用ログ"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="support-modal-header">
              <div>
                <p className="section-kicker">Internal Support</p>
                <h3>運用ログ</h3>
                <p className="consultation-lead">
                  管理者向けの read-only ログです。通常の作業フローからは切り離しています。
                </p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setSupportPanelOpen(false)}
              >
                閉じる
              </button>
            </div>
            <SupportPanel enabled={showSupportPanel} sessionEmail={authSession.email} embedded />
          </section>
        </div>
      )}
    </div>
  );
}

export default App;
