import { useEffect, useState, type RefObject } from 'react';
import type { FormState } from '../../state/actions';
import { PROJECT_SPEC_FILENAME } from '../../constants/spec';
import { buildProjectSpec, stringifyProjectSpec } from '../../utils/buildProjectSpec';
import {
  GenerateRepositoryError,
  canUseManualBearerUi,
  generateRepository,
  getGenerationMode,
  getRemoteAuthMode,
} from '../../utils/generateRepository';
import { downloadErrorReport, submitFeedback, type FeedbackType, type ErrorReportPayload } from '../../utils/feedback';
import { assessIntakeReadiness, getConsultationReviewHints, type ConsultationPromptVariant, type IntakeDraft } from '../../utils/intakeParser';
import type { SkillCatalogItem } from '../../data/skillCatalog.ts';
import { buildSkillInstallHandoffText } from '../../utils/skillInstallHandoff.ts';

interface JsonOutputProps {
  sectionRef?: RefObject<HTMLElement | null>;
  title?: string;
  lead?: string;
  showFeedback?: boolean;
  collapseJsonByDefault?: boolean;
  onGenerationStateChange?: (state: 'idle' | 'running' | 'done') => void;
  state: FormState;
  canExport: boolean;
  errors: Record<string, string>;
  authSession: {
    authenticated: boolean;
    email: string | null;
  };
  consultationDraft: IntakeDraft | null;
  consultationPromptVariant: ConsultationPromptVariant;
  selectedSkills?: SkillCatalogItem[];
}

export function JsonOutput({
  sectionRef,
  title = '出力',
  lead,
  showFeedback = true,
  collapseJsonByDefault = false,
  onGenerationStateChange,
  state,
  canExport,
  errors,
  authSession,
  consultationDraft,
  consultationPromptVariant,
  selectedSkills = [],
}: JsonOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);
  const [lastGenerateRequestId, setLastGenerateRequestId] = useState<string | null>(null);
  const [generatedZip, setGeneratedZip] = useState<{ blob: Blob; filename: string } | null>(null);
  const [authToken, setAuthToken] = useState('');
  const [lastErrorReport, setLastErrorReport] = useState<ErrorReportPayload | null>(null);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('bug');
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackDescription, setFeedbackDescription] = useState('');
  const [feedbackEmail, setFeedbackEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [jsonPreviewOpen, setJsonPreviewOpen] = useState(!collapseJsonByDefault);
  const [installerCopied, setInstallerCopied] = useState(false);
  const generationMode = getGenerationMode();
  const remoteAuthMode = getRemoteAuthMode();
  const requiresCookieSessionLogin = generationMode === 'remote' && remoteAuthMode === 'cookie_session';
  const manualBearerUiAvailable = canUseManualBearerUi();
  const manualBearerBlockedInThisDeploy = generationMode === 'remote'
    && remoteAuthMode === 'manual_bearer'
    && !manualBearerUiAvailable;

  const jsonString = stringifyProjectSpec(state);

  useEffect(() => {
    if (generationMode !== 'remote' || remoteAuthMode !== 'manual_bearer' || !manualBearerUiAvailable) return;
    const saved = localStorage.getItem('repogenesis_api_token');
    if (saved) setAuthToken(saved);
  }, [generationMode, manualBearerUiAvailable, remoteAuthMode]);

  useEffect(() => {
    if (!collapseJsonByDefault) {
      setJsonPreviewOpen(true);
    }
  }, [collapseJsonByDefault]);

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

  async function handleCopyInstallerHandoff() {
    await navigator.clipboard.writeText(installerHandoffText);
    setInstallerCopied(true);
    setTimeout(() => setInstallerCopied(false), 2000);
  }

  async function handleGenerateRepository() {
    try {
      setIsGenerating(true);
      onGenerationStateChange?.('running');
      setGenerateMessage('ZIP生成を開始しました。最大60秒ほどかかる場合があります。完了または失敗までこのままお待ちください。');
      setGeneratedZip(null);
      setLastGenerateRequestId(null);
      setLastErrorReport(null);
      if (generationMode === 'remote' && remoteAuthMode === 'manual_bearer' && manualBearerUiAvailable) {
        localStorage.setItem('repogenesis_api_token', authToken);
      }
      const result = await generateRepository(state, authToken);
      setGeneratedZip({ blob: result.blob, filename: result.filename });
      const fileInfo = result.fileCount ? `${result.fileCount}ファイル` : 'ZIP';
      setLastGenerateRequestId(result.requestId ?? null);
      setGenerateMessage(`生成完了: ${result.filename} (${fileInfo}, ${result.mode})。ZIPをダウンロードしてください。`);
      setLastErrorReport(null);
      onGenerationStateChange?.('done');
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'リポジトリ生成に失敗しました。';
      const requestId = error instanceof GenerateRepositoryError ? error.requestId : undefined;
      const status = error instanceof GenerateRepositoryError ? error.status : undefined;
      const kind = error instanceof GenerateRepositoryError ? error.kind : undefined;
      setLastGenerateRequestId(requestId ?? null);
      setGenerateMessage(message);
      setLastErrorReport({
        timestamp: new Date().toISOString(),
        message,
        mode: generationMode,
        spec: buildProjectSpec(state),
        requestId,
        status,
        kind,
      });
      onGenerationStateChange?.('done');
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
  const reviewHints = getConsultationReviewHints(consultationPromptVariant);
  const generationTone = isGenerating
    ? 'pending'
    : lastErrorReport
      ? 'error'
      : generatedZip
        ? 'success'
        : 'info';
  const installerHandoffText = buildSkillInstallHandoffText(state.project.slug, state.tech.ai_tools, selectedSkills);

  return (
    <section ref={sectionRef} className="form-section output-section">
      <h2>{title}</h2>
      {lead && <p className="consultation-lead">{lead}</p>}

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
          <div className="generation-readiness-guidance">
            <p><strong>{reviewHints.title}</strong></p>
            <ul>
              {reviewHints.points.map((point) => <li key={point}>{point}</li>)}
            </ul>
          </div>
          {blockingItems.length > 0 ? (
            <p>この draft には、生成前に確定すべき項目があります。先に詳細調整で補完してください。</p>
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
          {consultationDraft && (
            <div className="generation-readiness-guidance">
              <p><strong>facts / assumptions / open questions</strong></p>
              <ul>
                {consultationDraft.review.facts.slice(0, 2).map((item) => <li key={`fact-${item}`}>fact: {item}</li>)}
                {consultationDraft.review.assumptions.slice(0, 2).map((item) => <li key={`assumption-${item}`}>assumption: {item}</li>)}
                {consultationDraft.review.openQuestions.slice(0, 2).map((item) => <li key={`question-${item}`}>open question: {item}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {selectedSkills.length > 0 && (
        <div className="generation-readiness generation-readiness-info">
          <h3>選択した Skill</h3>
          <ul>
            {selectedSkills.map((skill) => (
              <li key={skill.id}>
                <strong>{skill.name}</strong> ({skill.sourceType}, {skill.version}) - {skill.providers.join(', ')}
              </li>
            ))}
          </ul>
          <p className="generation-readiness-note">
            生成される ZIP にはまだ自動同梱されません。project 作成後に installer で追加する前提です。
          </p>
          <div className="installer-handoff">
            <p><strong>追加コマンド例</strong></p>
            <p className="generation-readiness-note">
              ZIP 展開後に、RepoGenesis の `generator/` ディレクトリから実行してください。
            </p>
            <pre>{installerHandoffText}</pre>
            <div className="output-actions">
              <button
                type="button"
                onClick={handleCopyInstallerHandoff}
                className="btn-secondary"
              >
                {installerCopied ? 'コピー済み' : '追加コマンドをコピー'}
              </button>
            </div>
          </div>
        </div>
      )}

      <details
        className="json-preview-toggle"
        open={jsonPreviewOpen}
        onToggle={(event) => setJsonPreviewOpen(event.currentTarget.open)}
      >
        <summary>JSONプレビューを確認</summary>
        <div className="json-preview">
          <pre>{jsonString}</pre>
        </div>
      </details>

      {generationMode === 'remote' && remoteAuthMode === 'manual_bearer' && manualBearerUiAvailable && (
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
      {manualBearerBlockedInThisDeploy && (
        <p className="hint">
          このデプロイでは手動Bearerトークン入力を無効化しています。`cookie_session` 構成で利用するか、ローカル開発でのみ manual bearer を有効にしてください。
        </p>
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
          aria-busy={isGenerating}
          disabled={
            !canExport
            || isGenerating
            || blockingItems.length > 0
            || manualBearerBlockedInThisDeploy
            || (requiresCookieSessionLogin && !authSession.authenticated)
            || (generationMode === 'remote'
              && remoteAuthMode === 'manual_bearer'
              && manualBearerUiAvailable
              && authToken.trim().length === 0)
          }
          className={`btn-primary ${isGenerating ? 'btn-busy' : ''}`}
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
      {generateMessage && (
        <div className={`generation-status generation-status-${generationTone}`}>
          <p>{generateMessage}</p>
          {isGenerating && (
            <p className="hint generation-status-hint">処理中は生成ボタンがロックされます。完了後にZIPダウンロードまたはエラーJSON保存へ進めます。</p>
          )}
          {lastGenerateRequestId && (
            <p className="hint">request id: {lastGenerateRequestId}</p>
          )}
        </div>
      )}

      {showFeedback && (
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
              aria-busy={isSubmittingFeedback}
              disabled={isSubmittingFeedback}
              className={`btn-primary ${isSubmittingFeedback ? 'btn-busy' : ''}`}
            >
              {isSubmittingFeedback ? '送信中...' : 'フィードバックを送信'}
            </button>
          </div>
          <p className="hint">入力目安: タイトル3文字以上、詳細10文字以上</p>
          {feedbackMessage && <p>{feedbackMessage}</p>}
        </div>
      )}
    </section>
  );
}
