import {
  CONSULTATION_PROMPT_OPTIONS,
  getConsultationReviewHints,
  type ConsultationPromptVariant,
  type IntakeDraft,
} from '../../utils/intakeParser';
import { formatIntakeProviderLabel } from '../../utils/intakeProvider.ts';
import {
  EXTERNAL_PROMPT_PROVIDERS,
  EXTERNAL_PROMPT_PROVIDER_LABELS,
  type ExternalPromptProvider,
} from '../../utils/providerPrompt.ts';
import { CONSULTATION_TEST_TEMPLATES } from '../../data/consultationTestTemplates.ts';

interface ConsultationSectionProps {
  mode: 'paste' | 'draft';
  showTestTools: boolean;
  promptVariant: ConsultationPromptVariant;
  onChangePromptVariant: (value: ConsultationPromptVariant) => void;
  promptProvider: ExternalPromptProvider;
  onChangePromptProvider: (value: ExternalPromptProvider) => void;
  selectedTestTemplateId: string;
  onChangeTestTemplateId: (value: string) => void;
  onApplyTestTemplate: () => void;
  intakeText: string;
  onChangeText: (value: string) => void;
  onCopyPrompt: () => void;
  promptCopied: boolean;
  onBuildDraft: () => void;
  onContinueToOptions: () => void;
  onChangeOpenQuestions: (value: string) => void;
  draft: IntakeDraft | null;
  message: string | null;
}

export function ConsultationSection({
  mode,
  showTestTools,
  promptVariant,
  onChangePromptVariant,
  promptProvider,
  onChangePromptProvider,
  selectedTestTemplateId,
  onChangeTestTemplateId,
  onApplyTestTemplate,
  intakeText,
  onChangeText,
  onCopyPrompt,
  promptCopied,
  onBuildDraft,
  onContinueToOptions,
  onChangeOpenQuestions,
  draft,
  message,
}: ConsultationSectionProps) {
  const reviewHints = getConsultationReviewHints(promptVariant);
  const promptProviderLabel = EXTERNAL_PROMPT_PROVIDER_LABELS[promptProvider];
  const reviewHintId = 'consultation-review-hints';
  const openQuestionsHintId = 'openQuestionsEditorHint';
  const promptVariantHintId = 'consultationPromptVariantHint';
  const promptProviderHintId = 'consultationPromptProviderHint';
  const testTemplateHintId = 'consultationTestTemplateHint';
  const consultationInputHintId = 'consultationInputHint';
  const consultationCopyHintId = 'consultationCopyHint';
  const consultationBuildHintId = 'consultationBuildHint';

  if (mode === 'draft' && draft) {
    return (
      <section className="form-section consultation-section">
        <p className="section-kicker">Step 3</p>
        <h2>ドラフト確認</h2>
        <p className="consultation-lead">
          ここでは「確認できたこと」「仮置きした内容」「未確定事項」を見て、次のページで設定を詰める前にズレがないかを確認します。
        </p>

        {message && <p className="consultation-message" role="status" aria-live="polite">{message}</p>}

        <div className="consultation-guidance" id={reviewHintId}>
          <h4>{reviewHints.title}</h4>
          <ul>
            {reviewHints.points.map((point) => <li key={point}>{point}</li>)}
          </ul>
        </div>

        <div className="consultation-columns">
          <div className="consultation-card">
            <h4>確認できたこと</h4>
            <ul>
              {draft.review.facts.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          <div className="consultation-card">
            <h4>仮置きした内容</h4>
            <ul>
              {draft.review.assumptions.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>

          <div className="consultation-card">
            <h4>未確定事項</h4>
            <ul>
              {draft.review.openQuestions.map((item) => <li key={item}>{item}</li>)}
            </ul>
            <div className="form-row consultation-inline-editor">
              <label htmlFor="openQuestionsEditor">未確定事項を編集</label>
              <textarea
                id="openQuestionsEditor"
                rows={5}
                value={draft.review.openQuestions.join('\n')}
                onChange={(e) => onChangeOpenQuestions(e.target.value)}
                aria-describedby={`${reviewHintId} ${openQuestionsHintId}`}
                placeholder={'例:\n外部APIが本当に必要か\n1リポジトリで十分か'}
              />
              <p id={openQuestionsHintId} className="hint">1行に1つずつ書くと、そのまま open questions に反映されます。</p>
            </div>
          </div>
        </div>

        <div className="consultation-summary">
          <p><strong>相談に使ったAI:</strong> {formatIntakeProviderLabel(draft.provider)}</p>
          <p><strong>プロジェクト名候補:</strong> {draft.suggestedState.project.name || '未確定'}</p>
          <p><strong>説明候補:</strong> {draft.suggestedState.project.description || '未確定'}</p>
          <p><strong>技術ドメイン候補:</strong> {draft.suggestedState.tech.domains.join(', ') || '未確定'}</p>
          <p><strong>最初に作るべきもの:</strong> {draft.extracted.firstDeliverable || '未記載'}</p>
          <p><strong>外部連携候補:</strong> {draft.extracted.integrations.join(', ') || '未記載'}</p>
        </div>

        <div className="output-actions">
          <button type="button" onClick={onContinueToOptions} className="btn-primary">
            この内容で進む
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="form-section consultation-section">
      <p className="section-kicker">Step 2</p>
      <h2>相談内容を貼り付け</h2>
      <p className="consultation-lead">
        相談用プロンプトをコピーし、ChatGPT / Claude / Gemini などで整理した内容をここへ貼り付けます。見出しが少し崩れていても、まずはここから draft 化できます。
      </p>

        <div className="consultation-prompt-picker">
          <div className="form-row">
            <label htmlFor="consultationPromptVariant">相談の種類</label>
          <select
            id="consultationPromptVariant"
            value={promptVariant}
            onChange={(e) => onChangePromptVariant(e.target.value as ConsultationPromptVariant)}
            aria-describedby={promptVariantHintId}
          >
            {CONSULTATION_PROMPT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
            <p id={promptVariantHintId} className="hint consultation-variant-hint">
              {CONSULTATION_PROMPT_OPTIONS.find((option) => option.id === promptVariant)?.description}
            </p>
          </div>
          <div className="form-row">
            <label htmlFor="consultationPromptProvider">相談に使うAI</label>
            <select
              id="consultationPromptProvider"
              value={promptProvider}
              onChange={(e) => onChangePromptProvider(e.target.value as ExternalPromptProvider)}
              aria-describedby={promptProviderHintId}
            >
              {EXTERNAL_PROMPT_PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {EXTERNAL_PROMPT_PROVIDER_LABELS[provider]}
                </option>
              ))}
            </select>
            <p id={promptProviderHintId} className="hint consultation-variant-hint">
              見出し構造は共通で、{promptProviderLabel} 向けの使い方だけを薄く上に重ねます。
            </p>
          </div>
        {showTestTools && (
          <div className="form-row test-mode-box">
            <label htmlFor="consultationTestTemplate">固定テスト文章</label>
            <select
              id="consultationTestTemplate"
              value={selectedTestTemplateId}
              onChange={(e) => onChangeTestTemplateId(e.target.value)}
              aria-describedby={testTemplateHintId}
            >
              <option value="">選択してください</option>
              {CONSULTATION_TEST_TEMPLATES.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
            <p id={testTemplateHintId} className="hint consultation-variant-hint">
              テストモード用です。Antigravity や本番確認で同じ入力を再利用したい時に使います。
            </p>
            <div className="output-actions">
              <button
                type="button"
                onClick={onApplyTestTemplate}
                className="btn-secondary"
                disabled={!selectedTestTemplateId}
                aria-describedby={testTemplateHintId}
              >
                テスト文章を貼り付け欄に反映
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="output-actions">
        <button type="button" onClick={onCopyPrompt} className="btn-secondary" aria-describedby={consultationCopyHintId}>
          {promptCopied ? 'コピーしました' : `${promptProviderLabel}向け相談用プロンプトをコピー`}
        </button>
      </div>
      <p id={consultationCopyHintId} className="hint">
        コピーした相談用プロンプトを外部 AI に渡し、整理された結果だけを下の貼り付け欄へ戻します。
      </p>

      <div className="form-row">
        <label htmlFor="consultationInput">相談結果の貼り付け</label>
        <p id={consultationInputHintId} className="hint">
          `## プロジェクト概要` のような見出し付きが理想ですが、多少崩れていても取り込めます。本文が空だと draft を作成できません。
        </p>
        <textarea
          id="consultationInput"
          value={intakeText}
          onChange={(e) => onChangeText(e.target.value)}
          rows={16}
          aria-describedby={consultationInputHintId}
          placeholder={'## プロジェクト概要\n...\n\n## 想定ユーザー\n...\n\n## 解決したい課題\n...\n\n## 扱うデータ\n...\n\n## 未確定事項\n...'}
        />
      </div>

      {message && <p className="consultation-message" role="status" aria-live="polite">{message}</p>}

      <div className="output-actions consultation-submit-row">
        <button
          type="button"
          onClick={onBuildDraft}
          className="btn-primary"
          disabled={!intakeText.trim()}
          aria-describedby={consultationBuildHintId}
        >
          ドラフトを作成
        </button>
      </div>
      <p id={consultationBuildHintId} className="hint">
        貼り付けた相談結果から、確認済み事項・仮置き内容・未確定事項を抽出して次の draft を作ります。
      </p>

    </section>
  );
}
