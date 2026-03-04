import { useEffect, useState } from 'react';
import type { FormState } from '../../state/actions';
import { PROJECT_SPEC_FILENAME } from '../../constants/spec';
import { stringifyProjectSpec } from '../../utils/buildProjectSpec';
import { generateRepository, getGenerationMode, getRemoteAuthMode } from '../../utils/generateRepository';

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
    } catch (error) {
      console.error(error);
      setGenerateMessage(error instanceof Error ? error.message : 'Repository generation failed.');
    } finally {
      setIsGenerating(false);
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
      </div>
      {generateMessage && <p>{generateMessage}</p>}
    </section>
  );
}
