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
  clearConsultationState,
  loadSelectedSkills,
  saveSelectedSkills,
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
  getConsultationPromptTemplate,
  parseConsultationIntake,
  updateDraftOpenQuestions,
  type ConsultationPromptVariant,
  type IntakeDraft,
} from './utils/intakeParser';
import { getRecommendedSkills, SKILL_CATALOG } from './data/skillCatalog.ts';
import './App.css';

declare const __APP_RELEASE__: string;
declare const __APP_COMMIT__: string;

type GuidedStep = 'prompt' | 'paste' | 'draft' | 'options' | 'review' | 'result';

function deriveInitialGuidedStep(savedText: string, savedDraft: IntakeDraft | null): GuidedStep {
  if (savedDraft) return 'draft';
  if (savedText.trim().length > 0) return 'paste';
  return 'prompt';
}

function App() {
  const [state, dispatch] = useReducer(formReducer, initialFormState);
  const [consultationText, setConsultationText] = useState(loadConsultationText());
  const [consultationDraft, setConsultationDraft] = useState<IntakeDraft | null>(loadConsultationDraft());
  const [consultationPromptVariant, setConsultationPromptVariant] = useState<ConsultationPromptVariant>('internal_tool');
  const [consultationMessage, setConsultationMessage] = useState<string | null>(null);
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>(loadSelectedSkills());
  const [promptCopied, setPromptCopied] = useState(false);
  const [guidedStep, setGuidedStep] = useState<GuidedStep>(() => deriveInitialGuidedStep(loadConsultationText(), loadConsultationDraft()));
  const [showAdvancedDetail, setShowAdvancedDetail] = useState(false);
  const [draftApplied, setDraftApplied] = useState(false);
  const [resultPhase, setResultPhase] = useState<'idle' | 'running' | 'done'>('idle');
  const [authSession, setAuthSession] = useState<{ authenticated: boolean; email: string | null }>({
    authenticated: false,
    email: null,
  });
  const initialized = useRef(false);
  const promptCopyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    const restoredText = loadConsultationText();
    const restoredConsultationDraft = loadConsultationDraft();
    setConsultationText(restoredText);
    setConsultationDraft(restoredConsultationDraft);
    setShowAdvancedDetail(false);
    setDraftApplied(false);
    setGuidedStep(deriveInitialGuidedStep(restoredText, restoredConsultationDraft));
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
    saveSelectedSkills(selectedSkillIds);
  }, [selectedSkillIds]);

  useEffect(() => () => {
    if (promptCopyTimerRef.current) {
      clearTimeout(promptCopyTimerRef.current);
    }
  }, []);

  const errors = validationErrors(state);
  const exportable = canExport(state);
  const generationMode = getGenerationMode();
  const requiresCookieSession = generationMode === 'remote' && getRemoteAuthMode() === 'cookie_session';
  const activeStep = guidedStep === 'result' || resultPhase !== 'idle' ? 'result' : guidedStep;
  const suggestedRepoType = consultationDraft?.suggestedState.structure.repo_type ?? state.structure.repo_type;
  const suggestedSecurity = consultationDraft?.suggestedState.securityLevelOverride ?? state.security.level;
  const summaryProjectName = state.project.name || consultationDraft?.suggestedState.project.name || '未確定';
  const summaryDescription = state.project.description || consultationDraft?.suggestedState.project.description || '未確定';
  const summaryDomains = state.tech.domains.length > 0 ? state.tech.domains.join(', ') : consultationDraft?.suggestedState.tech.domains.join(', ') || '未確定';
  const showConsultationSection = guidedStep === 'prompt' || guidedStep === 'paste' || guidedStep === 'draft';
  const showOptionsSection = draftApplied && guidedStep === 'options';
  const showReviewSection = draftApplied && guidedStep === 'review';
  const showOutputSection = draftApplied && activeStep === 'result';
  const recommendedSkills = getRecommendedSkills(state.tech.ai_tools);
  const selectedSkills = SKILL_CATALOG.filter((item) => selectedSkillIds.includes(item.id));

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

  function toggleSkillSelection(skillId: string) {
    setSelectedSkillIds((current) =>
      current.includes(skillId)
        ? current.filter((id) => id !== skillId)
        : [...current, skillId],
    );
  }

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
    setConsultationMessage(null);
    setPromptCopied(false);
    setGuidedStep('prompt');
    setShowAdvancedDetail(false);
    setDraftApplied(false);
    setResultPhase('idle');
  }

  async function handleCopyConsultationPrompt() {
    await navigator.clipboard.writeText(getConsultationPromptTemplate(consultationPromptVariant));
    setConsultationMessage('相談用プロンプトをコピーしました。壁打ち結果をこの画面に貼り付けてください。');
    setPromptCopied(true);
    if (promptCopyTimerRef.current) clearTimeout(promptCopyTimerRef.current);
    promptCopyTimerRef.current = setTimeout(() => setPromptCopied(false), 2400);
    setGuidedStep('paste');
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
    setConsultationMessage('ドラフトを作成しました。確認できたこと、仮置きした内容、未確定事項を確認してください。');
    setGuidedStep('draft');
    setShowAdvancedDetail(false);
    setDraftApplied(false);
    setResultPhase('idle');
  }

  function applyConsultationDraft(nextStep: 'options' | 'review', openAdvancedDetail = false) {
    if (!consultationDraft) return;
    dispatch({ type: 'RESTORE_DRAFT', payload: consultationDraft.suggestedState });
    setConsultationMessage(
      nextStep === 'options'
        ? 'ドラフトをフォームに反映しました。おすすめオプションを確認してください。'
        : openAdvancedDetail
          ? 'ドラフトをフォームに反映しました。詳細調整を開きます。'
          : 'ドラフトをフォームに反映しました。最終確認へ進みます。',
    );
    setGuidedStep(nextStep);
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

  const releaseLabel = __APP_RELEASE__.startsWith('v') ? __APP_RELEASE__ : `v${__APP_RELEASE__}`;
  const buildLabel = `${releaseLabel} (${__APP_COMMIT__})`;

  return (
    <div className="app">
      <AuthPanel
        enabled={requiresCookieSession}
        onSessionChange={setAuthSession}
        compact
      />

      <header className="app-header">
        <h1>RepoGenesis</h1>
        <p>AI対応リポジトリ構造ジェネレータ</p>
        <p className="app-version">{buildLabel}</p>
      </header>

      <main className="app-main">
        {
          <>
            {showConsultationSection ? (
              <ConsultationSection
                promptVariant={consultationPromptVariant}
                onChangePromptVariant={setConsultationPromptVariant}
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
            ) : (
              <section className="form-section step-summary">
                <p className="section-kicker">{consultationDraft ? 'Step 2' : 'Step 1'}</p>
                <h2>{consultationDraft ? 'ドラフト確認' : '相談準備と貼り付け'}</h2>
                <p className="consultation-lead">
                  {consultationDraft
                    ? `プロジェクト名候補は「${consultationDraft.suggestedState.project.name || '未確定'}」です。必要ならここを開いて確認できます。`
                    : consultationText.trim()
                      ? '相談結果は入力済みです。必要なら貼り付け欄を開いて編集できます。'
                      : 'まず相談用プロンプトをコピーし、その後で AI の整理結果を貼り付けます。'}
                </p>
                <div className="output-actions">
                  <button
                    type="button"
                    onClick={() => setGuidedStep(consultationDraft ? 'draft' : 'paste')}
                    className="btn-secondary"
                  >
                    {consultationDraft ? 'ドラフト確認を開く' : '貼り付け欄を開く'}
                  </button>
                </div>
              </section>
            )}
          </>
        }

        {!draftApplied && (
          <>
            <section className="form-section step-summary step-summary-locked">
              <p className="section-kicker">Step 3</p>
              <h2>おすすめオプション</h2>
              <p className="consultation-lead">ドラフト確定後に、リポジトリ構成・security・進め方の段階数を確認します。</p>
            </section>
            <section className="form-section step-summary step-summary-locked">
              <p className="section-kicker">Step 4</p>
              <h2>最終確認</h2>
              <p className="consultation-lead">プロジェクト要点と JSON プレビューは、この後の確認ステップでまとめて表示します。</p>
            </section>
            <section className="form-section step-summary step-summary-locked">
              <p className="section-kicker">Step 5</p>
              <h2>ZIP生成と結果</h2>
              <p className="consultation-lead">ZIP 生成、request id、ダウンロード導線は最後にだけ表示します。</p>
            </section>
          </>
        )}

        {draftApplied && showOptionsSection && (
          <section ref={optionsRef} className="form-section options-section">
            <p className="section-kicker">Step 3</p>
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
              <p><strong>推奨 Skill</strong></p>
              <p className="consultation-lead">
                {generationMode === 'remote'
                  ? 'このプロジェクトに合う curated skill を選びます。選んだ Skill は生成 ZIP に同梱されるため、ダウンロード後すぐ確認できます。'
                  : 'このプロジェクトに後から追加しやすい curated skill を選びます。ローカル ZIP では install script も一緒に出力します。'}
              </p>
              <div className="skill-grid">
                {recommendedSkills.length > 0 ? recommendedSkills.map((skill) => {
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
                          <p>{skill.description}</p>
                        </div>
                      </div>
                      <p className="skill-meta">
                        source: {skill.sourceType} / risk: {skill.riskLevel} / providers: {skill.providers.join(', ')}
                      </p>
                    </label>
                  );
                }) : (
                  <p className="consultation-lead">現在の AI tool 設定に一致する curated skill はまだありません。</p>
                )}
              </div>
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
                最終確認へ進む
              </button>
            </div>
          </section>
        )}

        {draftApplied && !showOptionsSection && (
          <section className="form-section step-summary">
            <p className="section-kicker">Step 3</p>
            <h2>おすすめオプション</h2>
            <p className="consultation-lead">
              リポジトリ構成: {state.structure.repo_type === 'single' ? 'シングル' : 'マルチ'} / security: {state.security.level} / 段階数: {state.workflow.phases_count}
            </p>
            <div className="output-actions">
              <button
                type="button"
                onClick={() => {
                  setGuidedStep('options');
                  scrollToSection(optionsRef);
                }}
                className="btn-secondary"
              >
                おすすめオプションを開く
              </button>
            </div>
          </section>
        )}

        {draftApplied && showReviewSection && (
          <section ref={reviewRef} className="form-section final-review-section">
            <p className="section-kicker">Step 4</p>
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
                <p><strong>段階数:</strong> {state.workflow.phases_count}</p>
              </div>
            </div>

            <div className="consultation-summary">
              <p><strong>説明候補:</strong> {summaryDescription}</p>
            </div>

            <div className="consultation-summary">
              <p><strong>選択した Skill:</strong> {selectedSkills.length > 0 ? selectedSkills.map((skill) => skill.name).join(', ') : 'なし'}</p>
            </div>

            {!showAdvancedDetail && (
              <div className="output-actions">
                <button
                  type="button"
                  onClick={() => {
                    setGuidedStep('result');
                    setResultPhase('idle');
                    scrollToSection(outputRef);
                  }}
                  className="btn-primary"
                >
                  ZIP生成へ進む
                </button>
                <button
                  type="button"
                  onClick={() => setShowAdvancedDetail(true)}
                  className="btn-secondary"
                >
                  詳細調整を開く
                </button>
              </div>
            )}

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
                <div className="output-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setGuidedStep('result');
                      setResultPhase('idle');
                      scrollToSection(outputRef);
                    }}
                    className="btn-primary"
                  >
                    ZIP生成へ進む
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedDetail(false)}
                    className="btn-secondary"
                  >
                    詳細調整を閉じる
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {draftApplied && !showReviewSection && (
          <section className="form-section step-summary">
            <p className="section-kicker">Step 4</p>
            <h2>最終確認</h2>
            <p className="consultation-lead">
              project: {summaryProjectName} / domain: {summaryDomains} / リポジトリ構成: {state.structure.repo_type === 'single' ? 'シングル' : 'マルチ'}
            </p>
            <div className="output-actions">
              <button
                type="button"
                onClick={() => {
                  setGuidedStep('review');
                  scrollToSection(reviewRef);
                }}
                className="btn-secondary"
              >
                最終確認を開く
              </button>
            </div>
          </section>
        )}

        {showOutputSection && (
          <JsonOutput
            sectionRef={outputRef}
            title="Step 5. ZIP生成と結果"
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
            selectedSkills={selectedSkills}
          />
        )}

        {draftApplied && !showOutputSection && (
          <section className="form-section step-summary">
            <p className="section-kicker">Step 5</p>
            <h2>ZIP生成と結果</h2>
            <p className="consultation-lead">
              {resultPhase === 'done'
                ? '前回の生成結果があります。必要ならもう一度このステップを開いて確認できます。'
                : 'まだ生成していません。最終確認ができたら、ここで ZIP を生成します。'}
            </p>
            <div className="output-actions">
              <button
                type="button"
                onClick={() => {
                  setGuidedStep('result');
                  setResultPhase('idle');
                  scrollToSection(outputRef);
                }}
                className="btn-secondary"
              >
                ZIP生成ステップを開く
              </button>
            </div>
          </section>
        )}

        <div className="app-actions">
          <button type="button" onClick={handleReset} className="btn-reset">
            Reset
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
