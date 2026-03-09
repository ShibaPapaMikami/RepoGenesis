import {
  CONSULTATION_PROMPT_OPTIONS,
  getConsultationReviewHints,
  type ConsultationPromptVariant,
  type IntakeDraft,
} from '../../utils/intakeParser';

interface ConsultationSectionProps {
  promptVariant: ConsultationPromptVariant;
  onChangePromptVariant: (value: ConsultationPromptVariant) => void;
  intakeText: string;
  onChangeText: (value: string) => void;
  onApplyTestInput: () => void;
  onCopyPrompt: () => void;
  onBuildDraft: () => void;
  onApplyDraft: () => void;
  onApplyDraftAndReviewOutput: () => void;
  onSwitchToDetail: () => void;
  onChangeOpenQuestions: (value: string) => void;
  draft: IntakeDraft | null;
  message: string | null;
}

export function ConsultationSection({
  promptVariant,
  onChangePromptVariant,
  intakeText,
  onChangeText,
  onApplyTestInput,
  onCopyPrompt,
  onBuildDraft,
  onApplyDraft,
  onApplyDraftAndReviewOutput,
  onSwitchToDetail,
  onChangeOpenQuestions,
  draft,
  message,
}: ConsultationSectionProps) {
  const reviewHints = getConsultationReviewHints(promptVariant);

  return (
    <section className="form-section consultation-section">
      <h2>相談結果を反映</h2>
      <p className="consultation-lead">
        ChatGPT / Claude などで壁打ちした結果を貼り付け、RepoGenesis 用の draft に変換します。
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
      </div>

      <div className="output-actions">
        <button type="button" onClick={onApplyTestInput} className="btn-secondary">
          相談結果のテスト入力を適用
        </button>
        <button type="button" onClick={onCopyPrompt} className="btn-secondary">
          相談用プロンプトをコピー
        </button>
        <button type="button" onClick={onBuildDraft} className="btn-primary" disabled={!intakeText.trim()}>
          draft を作成
        </button>
      </div>

      <div className="form-row">
        <label htmlFor="consultationInput">相談結果の貼り付け</label>
        <textarea
          id="consultationInput"
          value={intakeText}
          onChange={(e) => onChangeText(e.target.value)}
          rows={16}
          placeholder={'## プロジェクト概要\n...\n\n## 想定ユーザー\n...\n\n## 解決したい課題\n...\n\n## 扱うデータ\n...\n\n## 未確定事項\n...'}
        />
      </div>

      {message && <p className="consultation-message">{message}</p>}

      {draft && (
        <div className="consultation-review">
          <h3>生成前レビュー</h3>

          <div className="consultation-guidance">
            <h4>{reviewHints.title}</h4>
            <ul>
              {reviewHints.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </div>

          <div className="consultation-columns">
            <div className="consultation-card">
              <h4>facts</h4>
              <ul>
                {draft.review.facts.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div className="consultation-card">
              <h4>assumptions</h4>
              <ul>
                {draft.review.assumptions.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div className="consultation-card">
              <h4>open questions</h4>
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

          <div className="consultation-columns">
            <div className="consultation-card">
              <h4>確定した内容</h4>
              <ul>
                {draft.certainty.confirmed.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div className="consultation-card">
              <h4>仮置きした内容</h4>
              <ul>
                {draft.certainty.provisional.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div className="consultation-card">
              <h4>未確定事項</h4>
              <ul>
                {draft.certainty.unresolved.map((item) => <li key={item}>{item}</li>)}
              </ul>
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
            <button type="button" onClick={onApplyDraft} className="btn-primary">
              この draft をフォームへ反映
            </button>
            <button type="button" onClick={onApplyDraftAndReviewOutput} className="btn-secondary">
              この draft で出力確認へ進む
            </button>
            <button type="button" onClick={onSwitchToDetail} className="btn-secondary">
              詳細入力で調整
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
