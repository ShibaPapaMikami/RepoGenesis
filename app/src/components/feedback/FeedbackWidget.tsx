import { useState } from 'react';
import type { FormState } from '../../state/actions.ts';
import { submitFeedback, type ErrorReportPayload, type FeedbackType } from '../../utils/feedback.ts';

interface FeedbackWidgetProps {
  state: FormState;
  errorReport: ErrorReportPayload | null;
}

export function FeedbackWidget({ state, errorReport }: FeedbackWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (feedbackTitle.trim().length < 3) {
      setFeedbackMessage('タイトルは3文字以上で入力してください。');
      return;
    }
    if (feedbackDescription.trim().length < 10) {
      setFeedbackMessage('詳細は10文字以上で入力してください。');
      return;
    }

    try {
      setIsSubmitting(true);
      setFeedbackMessage(null);
      const result = await submitFeedback({
        type: feedbackType,
        title: feedbackTitle,
        description: feedbackDescription,
        email: feedbackEmail,
        state,
        errorReport: feedbackType === 'bug' ? errorReport : null,
      });
      setFeedbackMessage(result.message);
      if (result.ok) {
        setFeedbackTitle('');
        setFeedbackDescription('');
      }
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : '送信に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button type="button" className="feedback-fab" onClick={() => setIsOpen(true)}>
        フィードバック
      </button>

      {isOpen && (
        <div className="feedback-modal-backdrop" role="presentation" onClick={() => setIsOpen(false)}>
          <section
            className="feedback-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedbackModalTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="feedback-modal-header">
              <div>
                <p className="section-kicker">Feedback</p>
                <h3 id="feedbackModalTitle">フィードバックを送る</h3>
              </div>
              <button type="button" className="btn-secondary" onClick={() => setIsOpen(false)}>
                閉じる
              </button>
            </div>

            <p className="consultation-lead">
              気になった点や不具合を、どのページからでも送れます。
              {errorReport ? ' 直近のエラー情報は、不具合報告に自動で添付されます。' : ''}
            </p>

            <div className="feedback-grid">
              <div className="form-row">
                <label htmlFor="feedbackType">種別</label>
                <select
                  id="feedbackType"
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                >
                  <option value="bug">不具合報告</option>
                  <option value="request">要望</option>
                </select>
              </div>

              <div className="form-row">
                <label htmlFor="feedbackTitle">タイトル</label>
                <input
                  id="feedbackTitle"
                  type="text"
                  value={feedbackTitle}
                  onChange={(e) => setFeedbackTitle(e.target.value)}
                  placeholder="例: ステップの移動が分かりにくい"
                />
              </div>

              <div className="form-row feedback-description">
                <label htmlFor="feedbackDescription">詳細</label>
                <textarea
                  id="feedbackDescription"
                  value={feedbackDescription}
                  onChange={(e) => setFeedbackDescription(e.target.value)}
                  placeholder="再現手順や、どこで迷ったかを書いてください"
                  rows={5}
                />
              </div>

              <div className="form-row">
                <label htmlFor="feedbackEmail">連絡先メール（任意）</label>
                <input
                  id="feedbackEmail"
                  type="email"
                  value={feedbackEmail}
                  onChange={(e) => setFeedbackEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="output-actions">
              <button
                type="button"
                onClick={handleSubmit}
                aria-busy={isSubmitting}
                disabled={isSubmitting}
                className={`btn-primary ${isSubmitting ? 'btn-busy' : ''}`}
              >
                {isSubmitting ? '送信中...' : 'フィードバックを送信'}
              </button>
            </div>
            <p className="hint">入力目安: タイトル3文字以上、詳細10文字以上</p>
            {feedbackMessage && <p>{feedbackMessage}</p>}
          </section>
        </div>
      )}
    </>
  );
}
