import { useEffect, useState } from 'react';
import type { FormState } from '../../state/actions';
import { PROJECT_SPEC_FILENAME } from '../../constants/spec';
import { buildProjectSpec, stringifyProjectSpec } from '../../utils/buildProjectSpec';
import { generateRepository, getGenerationMode, getRemoteAuthMode } from '../../utils/generateRepository';
import { downloadErrorReport, submitFeedback, type FeedbackType, type ErrorReportPayload } from '../../utils/feedback';

interface JsonOutputProps {
  state: FormState;
  canExport: boolean;
  errors: Record<string, string>;
}

export function JsonOutput({ state, canExport, errors }: JsonOutputProps) {
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateMessage, setGenerateMessage] = useState<string | null>(null);
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
      if (generationMode === 'remote' && remoteAuthMode === 'manual_bearer') {
        localStorage.setItem('repogenesis_api_token', authToken);
      }
      const result = await generateRepository(state, authToken);
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      const fileInfo = result.fileCount ? `${result.fileCount} files` : 'repository ZIP';
      setGenerateMessage(`Generated ${fileInfo} as ${result.filename} (${result.mode})`);
      setLastErrorReport(null);
    } catch (error) {
      console.error(error);
      const message = error instanceof Error ? error.message : 'Repository generation failed.';
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

  async function handleSubmitFeedback() {
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
      setFeedbackMessage(error instanceof Error ? error.message : 'Feedback submit failed');
    } finally {
      setIsSubmittingFeedback(false);
    }
  }

  const errorList = Object.entries(errors);

  return (
    <section className="form-section output-section">
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

      <div className="json-preview">
        <pre>{jsonString}</pre>
      </div>

      {generationMode === 'remote' && remoteAuthMode === 'manual_bearer' && (
        <div className="form-field">
          <label htmlFor="apiToken">API Token (Bearer)</label>
          <input
            id="apiToken"
            type="password"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            placeholder="Paste bearer token"
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
          Download JSON
        </button>
        <button
          type="button"
          onClick={handleCopy}
          disabled={!canExport}
          className="btn-secondary"
        >
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
        <button
          type="button"
          onClick={handleGenerateRepository}
          disabled={
            !canExport
            || isGenerating
            || (generationMode === 'remote'
              && remoteAuthMode === 'manual_bearer'
              && authToken.trim().length === 0)
          }
          className="btn-primary"
        >
          {isGenerating ? 'Generating...' : `Generate Repository (ZIP / ${generationMode})`}
        </button>
        <button
          type="button"
          onClick={() => {
            if (lastErrorReport) downloadErrorReport(lastErrorReport);
          }}
          disabled={!lastErrorReport}
          className="btn-secondary"
        >
          Download Error JSON
        </button>
      </div>
      {generateMessage && <p>{generateMessage}</p>}

      <div className="form-field" style={{ marginTop: '1rem' }}>
        <h3>Feedback</h3>
        <label htmlFor="feedbackType">Type</label>
        <select
          id="feedbackType"
          value={feedbackType}
          onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
        >
          <option value="bug">Bug Report</option>
          <option value="request">Feature Request</option>
        </select>

        <label htmlFor="feedbackTitle">Title</label>
        <input
          id="feedbackTitle"
          type="text"
          value={feedbackTitle}
          onChange={(e) => setFeedbackTitle(e.target.value)}
          placeholder="Short summary"
        />

        <label htmlFor="feedbackDescription">Description</label>
        <textarea
          id="feedbackDescription"
          value={feedbackDescription}
          onChange={(e) => setFeedbackDescription(e.target.value)}
          placeholder="Describe issue/request in detail"
          rows={4}
        />

        <label htmlFor="feedbackEmail">Email (optional)</label>
        <input
          id="feedbackEmail"
          type="email"
          value={feedbackEmail}
          onChange={(e) => setFeedbackEmail(e.target.value)}
          placeholder="name@gugenka.co.jp"
        />

        <button
          type="button"
          onClick={handleSubmitFeedback}
          disabled={isSubmittingFeedback || feedbackTitle.trim().length < 3 || feedbackDescription.trim().length < 10}
          className="btn-primary"
        >
          {isSubmittingFeedback ? 'Submitting...' : 'Submit Feedback'}
        </button>
        {feedbackMessage && <p>{feedbackMessage}</p>}
      </div>
    </section>
  );
}
