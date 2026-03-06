import { useEffect, useState, type RefObject } from 'react';
import type { FormState } from '../../state/actions';
import { PROJECT_SPEC_FILENAME } from '../../constants/spec';
import { buildProjectSpec, stringifyProjectSpec } from '../../utils/buildProjectSpec';
import { generateRepository, getGenerationMode, getRemoteAuthMode } from '../../utils/generateRepository';
import { downloadErrorReport, submitFeedback, type FeedbackType, type ErrorReportPayload } from '../../utils/feedback';
import { assessIntakeReadiness, type IntakeDraft } from '../../utils/intakeParser';

interface JsonOutputProps {
  sectionRef?: RefObject<HTMLElement | null>;
  state: FormState;
  canExport: boolean;
  errors: Record<string, string>;
  authSession: {
    authenticated: boolean;
    email: string | null;
  };
  consultationDraft: IntakeDraft | null;
}

export function JsonOutput({ sectionRef, state, canExport, errors, authSession, consultationDraft }: JsonOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);
  const [generatedZip, setGeneratedZip] = useState<{ blob: Blob; filename: string } | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [lastErrorReport, setLastErrorReport] = useState<ErrorReportPayload | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const generationMode = getGenerationMode();
  const remoteAuthMode = getRemoteAuthMode();
  const requiresCookieSessionLogin = generationMode === 'remote' && remoteAuthMode === 'cookie_session';

  const jsonString = stringifyProjectSpec(state);

  useEffect(() => {
    if (generationMode !== 'remote' || remoteAuthMode !== 'manual_bearer') return;
    const saved = localStorage.getItem('repogenesis_api_token');
    if (saved) setAuthToken(saved);
  }, [generationMode, remoteAuthMode]);

  function handleDownload() {
    const blob = new Blob([stringifyProjectSpec(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = PROJECT_SPEC_FILENAME;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(stringifyProjectSpec(state));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleGenerateRepository() {
    try {
      setIsGenerating(true);
      setGenerateMessage(null);
      setGeneratedZip(null);
      if (generationMode === 'remote' && remoteAuthMode === 'manual_bearer') {
        localStorage.setItem('repogenesis_api_token', authToken);
      }
      const result = await generateRepository(state, authToken);
      setGeneratedZip({ blob: result.blob, filename: result.filename });
      const fileInfo = result.fileCount ? `${result.fileCount}ファイル` : 'ZIP';
      setGenerateMessage(`生成完了: ${result.filename} (${fileInfo}, ${result.mode})。ZIPをダウンロードしてください。`);
      setLastErrorReport(null);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'リポジトリ生成に失敗しました。';
      setGenerateMessage(message);
      setLastErrorReport({
        timestamp: new Date().toISOString(),
        message,
        mode: generationMode,
        spec: buildProjectSpec(state),
      });
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDownloadGeneratedZip() {
    if (!generatedZip) return;
    const url = URL.createObjectURL(generatedZip.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedZip.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSubmitFeedback() {
    if (feedbackTitle.trim().length < 3) {
      setFeedbackMessage('タイトルは3文字以上で入力してください。');
      return;
    }
    if (feedbackDescription.trim().length < 10) {
      setFeedbackMessage('詳細は10文字以上で入力してください。');
      return;
    }

    try {
      setIsSubmittingFeedback(true);
      setFeedbackMessage(null);
      const result = await submitFeedback({
        type: feedbackType,
        title: feedbackTitle,
        description: feedbackDescription,
        email: feedbackEmail,
        state,
        errorReport: feedbackType === 'bug' ? lastErrorReport : null,
        authToken,
      });
      setFeedbackMessage(result.message);
      if (result.ok) {
        setFeedbackTitle('');
        setFeedbackDescription('');
      }
    } catch (error) {
      setFeedbackMessage(error instanceof Error ? error.message : '送信に失敗しました');
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

  const errorList = Object.entries(errors);
  const readiness = assessIntakeReadiness(consultationDraft);
  const blockingItems = readiness.blocking;
  const warningItems = readiness.warnings;
  const hasConsultationWarnings = blockingItems.length > 0 || warningItems.length > 0;

  return (
    <section ref={sectionRef} className="form-section output-section">
      <h2>出力</h2>

      {errorList.length > 0 && (
        <div className="error-summary">
          <p>以下のエラーを修正してください:</p>
          <ul>
            {errorList.map(([key, msg]) => (
              <li key={key}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {hasConsultationWarnings && (
        <div className={blockingItems.length > 0 ? 'generation-readiness generation-readiness-blocking' : 'generation-readiness generation-readiness-warning'}>
          <h3>生成前チェック</h3>
          {blockingItems.length > 0 ? (
            <p>この draft には、生成前に確定すべき項目があります。先に詳細入力で補完してください。</p>
          ) : (
            <p>この draft には仮置きの項目があります。生成はできますが、後で見直しが必要になる可能性があります。</p>
          )}
          {blockingItems.length > 0 && (
            <>
              <p><strong>生成前に確定が必要な項目</strong></p>
              <ul>
                {blockingItems.map((item) => <li key={`block-${item}`}>{item}</li>)}
              </ul>
            </>
          )}
          {warningItems.length > 0 && (
            <>
              <p><strong>仮置き / 後で見直す項目</strong></p>
              <ul>
                {warningItems.map((item) => <li key={`warn-${item}`}>{item}</li>)}
              </ul>
              <p className="generation-readiness-note">外部API有無やリポジトリ構成は仮置きでも進められますが、生成後に調整が必要になる場合があります。</p>
            </>
          )}
        </div>
      )}

      <div className="json-preview">
        <pre>{jsonString}</pre>
      </div>

      {generationMode === 'remote' && remoteAuthMode === 'manual_bearer' && (
        <div className="form-row">
          <label htmlFor="apiToken">APIトークン (Bearer)</label>
          <input
            id="apiToken"
            type="password"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="Bearerトークンを入力"
          />
        </div>
      )}

      <div className="output-actions">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!canExport}
          className="btn-primary"
        >
          JSONをダウンロード
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!canExport}
          className="btn-secondary"
        >
          {copied ? 'コピー済み' : 'JSONをコピー'}
        </button>
        <button
          type="button"
          onClick={handleGenerateRepository}
          disabled={
            !canExport
            || isGenerating
            || blockingItems.length > 0
            || (requiresCookieSessionLogin && !authSession.authenticated)
            || (generationMode === 'remote'
              && remoteAuthMode === 'manual_bearer'
              && authToken.trim().length === 0)
          }
          className="btn-primary"
        >
          {isGenerating ? '生成中...' : `リポジトリ生成 (ZIP / ${generationMode})`}
        </button>
        <button
          type="button"
          onClick={handleDownloadGeneratedZip}
          disabled={!generatedZip}
          className="btn-primary"
        >
          ZIPをダウンロード
        </button>
        <button
          type="button"
          onClick={() => {
            if (lastErrorReport) downloadErrorReport(lastErrorReport);
          }}
          disabled={!lastErrorReport}
          className="btn-secondary"
        >
          エラーJSONをダウンロード
        </button>
      </div>
      {requiresCookieSessionLogin && !authSession.authenticated && (
        <p className="hint">ZIP 生成には上部の認証セクションでログインが必要です。</p>
      )}
      {generateMessage && <p>{generateMessage}</p>}

      <div className="feedback-panel">
        <h3>フィードバック</h3>
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
              placeholder="例: ZIP生成が失敗する"
            />
          </div>

          <div className="form-row feedback-description">
            <label htmlFor="feedbackDescription">詳細</label>
            <textarea
              id="feedbackDescription"
              value={feedbackDescription}
              onChange={(e) => setFeedbackDescription(e.target.value)}
              placeholder="再現手順や発生条件を記載してください"
              rows={4}
            />
          </div>

          <div className="form-row">
            <label htmlFor="feedbackEmail">連絡先メール（任意）</label>
            <input
              id="feedbackEmail"
              type="email"
              value={feedbackEmail}
              onChange={(e) => setFeedbackEmail(e.target.value)}
              placeholder="name@gugenka.jp"
            />
          </div>
        </div>

        <div className="output-actions">
          <button
            type="button"
            onClick={handleSubmitFeedback}
            disabled={isSubmittingFeedback}
            className="btn-primary"
          >
            {isSubmittingFeedback ? '送信中...' : 'フィードバックを送信'}
          </button>
        </div>
        <p className="hint">入力目安: タイトル3文字以上、詳細10文字以上</p>
        {feedbackMessage && <p>{feedbackMessage}</p>}
      </div>
    </section>
  );
}
