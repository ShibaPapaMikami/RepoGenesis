import {
  CONSULTATION_PROMPT_OPTIONS,
  getConsultationReviewHints,
  type ConsultationPromptVariant,
  type IntakeDraft,
} from '../../utils/intakeParser';
import { CONSULTATION_TEST_TEMPLATES } from '../../data/consultationTestTemplates.ts';

interface ConsultationSectionProps {
  promptVariant: ConsultationPromptVariant;
  onChangePromptVariant: (value: ConsultationPromptVariant) => void;
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
  promptVariant,
  onChangePromptVariant,
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

  return (
    <section className="form-section consultation-section">
      <p className="section-kicker">Step 1</p>
      <h2>相談準備と貼り付け</h2>
      <p className="consultation-lead">
        まず相談用プロンプトをコピーし、ChatGPT / Claude などで壁打ちした結果を貼り付けて RepoGenesis 用の draft に変換します。見出しが揺れていても、まずはここから取り込みます。
      </p>

      <div className="consultation-prompt-picker">
        <div className="form-row">
          <label htmlFor="consultationPromptVariant">相談の種類</label>
          <select
            id="consultationPromptVariant"
            value={promptVariant}
            onChange={(e) => onChangePromptVariant(e.target.value as ConsultationPromptVariant)}
          >
            {CONSULTATION_PROMPT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="hint consultation-variant-hint">
            {CONSULTATION_PROMPT_OPTIONS.find((option) => option.id === promptVariant)?.description}
          </p>
        </div>
        <div className="form-row">
          <label htmlFor="consultationTestTemplate">固定テスト文章</label>
          <select
            id="consultationTestTemplate"
            value={selectedTestTemplateId}
            onChange={(e) => onChangeTestTemplateId(e.target.value)}
          >
            <option value="">選択してください</option>
            {CONSULTATION_TEST_TEMPLATES.map((template) => (
              <option key={template.id} value={template.id}>
                {template.label}
              </option>
            ))}
          </select>
          <p className="hint consultation-variant-hint">
            Antigravity や本番確認で同じ入力を再利用したい時に使います。
          </p>
          <div className="output-actions">
            <button
              type="button"
              onClick={onApplyTestTemplate}
              className="btn-secondary"
              disabled={!selectedTestTemplateId}
            >
              テスト文章を貼り付け欄に反映
            </button>
          </div>
        </div>
      </div>

      <div className="output-actions">
        <button type="button" onClick={onCopyPrompt} className="btn-secondary">
          {promptCopied ? 'コピーしました' : '相談用プロンプトをコピー'}
        </button>
        <button type="button" onClick={onBuildDraft} className="btn-primary" disabled={!intakeText.trim()}>
          ドラフトを作成
        </button>
      </div>

      <div className="form-row">
        <label htmlFor="consultationInput">相談結果の貼り付け</label>
        <p className="hint">
          `## プロジェクト概要` のような見出し付きが理想ですが、多少崩れていても取り込めます。本文が空だと draft を作成できません。
        </p>
        <textarea
          id="consultationInput"
          value={intakeText}
          onChange={(e) => onChangeText(e.target.value)}
          rows={16}
          placeholder={'## プロジェクト概要\n...\n\n## 想定ユーザー\n...\n\n## 解決したい課題\n...\n\n## 扱うデータ\n...\n\n## 未確定事項\n...'}
        />
      </div>

      {message && <p className="consultation-message" role="status" aria-live="polite">{message}</p>}

      {draft && (
        <div className="consultation-review">
          <p className="section-kicker">Step 2</p>
          <h3>ドラフト確認</h3>
          <p className="consultation-lead">
            ここでは「確認できたこと」「仮置きした内容」「未確定事項」だけを見ます。細かい JSON や詳細調整はあとで開けます。
          </p>

          <div className="consultation-guidance">
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
                  placeholder={'例:\n外部APIが本当に必要か\n1リポジトリで十分か'}
                />
                <p className="hint">1行に1つずつ書くと、そのまま open questions に反映されます。</p>
              </div>
            </div>
          </div>

          <div className="consultation-summary">
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
        </div>
      )}
    </section>
  );
}
