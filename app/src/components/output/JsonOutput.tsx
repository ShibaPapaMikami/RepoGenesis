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
import { canRecoverCookieSession, refreshCookieSession } from '../../utils/authRecovery.ts';
import { downloadErrorReport, type ErrorReportPayload } from '../../utils/feedback';
import { assessIntakeReadiness, getConsultationReviewHints, type ConsultationPromptVariant, type IntakeDraft } from '../../utils/intakeParser';
import {
  formatSkillProviderNames,
  formatSkillProviderSupportSummary,
  SKILL_RISK_LABELS,
  type SkillCatalogItem,
} from '../../data/skillCatalog.ts';
import { buildSkillInstallHandoffText } from '../../utils/skillInstallHandoff.ts';

interface JsonOutputProps {
  sectionRef?: RefObject<HTMLElement | null>;
  title?: string;
  lead?: string;
  collapseJsonByDefault?: boolean;
  showJsonTools?: boolean;
  onGenerationStateChange?: (state: 'idle' | 'running' | 'done') => void;
  onErrorReportChange?: (report: ErrorReportPayload | null) => void;
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
  collapseJsonByDefault = false,
  showJsonTools = false,
  onGenerationStateChange,
  onErrorReportChange,
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

  useEffect(() => {
    onErrorReportChange?.(lastErrorReport);
  }, [lastErrorReport, onErrorReportChange]);

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
    async function attemptGenerate() {
      return generateRepository(state, authToken, selectedSkills);
    }

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
      let result;
      try {
        result = await attemptGenerate();
      } catch (error) {
        if (
          error instanceof GenerateRepositoryError
          && canRecoverCookieSession(error.status, remoteAuthMode, authSession.email)
        ) {
          setGenerateMessage('ログイン状態を更新して再試行しています...');
          await refreshCookieSession(authSession.email as string);
          result = await attemptGenerate();
        } else {
          throw error;
        }
      }
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
          <h3>選択した Skill（スキル）</h3>
          <ul>
            {selectedSkills.map((skill) => (
              <li key={skill.id}>
                <strong>{skill.name}</strong> ({skill.sourceLabel}, {skill.version})
                <div className="skill-provider-line"><strong>使えるAI:</strong> {formatSkillProviderNames(skill)}</div>
                <div className="generation-readiness-note">
                  提供形態: {formatSkillProviderSupportSummary(skill)} / risk: {SKILL_RISK_LABELS[skill.riskLevel]}
                </div>
              </li>
            ))}
          </ul>
          {generationMode === 'remote' ? (
            <p className="generation-readiness-note">
              選んだ Skill（スキル）のファイルは ZIP に入っています。これは自動機能ではなく、解凍後に対応する AI ツールでこの project を開いた時に参照するためのものです。何もしなくても勝手に動くわけではありません。
            </p>
          ) : (
            <>
              <p className="generation-readiness-note">
                このモードではまだ ZIP へ自動同梱されません。必要な場合だけ、ZIP 展開後に追加してください。
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
            </>
          )}
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
        {showJsonTools && (
          <>
            <button
              type="button"
              onClick={handleDownload}
              disabled={!canExport}
              className="btn-secondary"
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
          </>
        )}
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
        <p className="hint">公開版の remote ZIP 生成には、上部の認証セクションでのログインが必要です。</p>
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

    </section>
  );
}
