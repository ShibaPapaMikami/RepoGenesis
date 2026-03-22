import { useState } from 'react';
import {
  EXTERNAL_PROMPT_PROVIDERS,
  EXTERNAL_PROMPT_PROVIDER_LABELS,
  type ExternalPromptProvider,
} from '../../utils/providerPrompt.ts';

interface RefinementPromptPanelProps {
  title: string;
  lead: string;
  promptText: string;
  filename: string;
  provider: ExternalPromptProvider;
  onChangeProvider: (value: ExternalPromptProvider) => void;
}

export function RefinementPromptPanel({
  title,
  lead,
  promptText,
  filename,
  provider,
  onChangeProvider,
}: RefinementPromptPanelProps) {
  const [copied, setCopied] = useState(false);
  const providerLabel = EXTERNAL_PROMPT_PROVIDER_LABELS[provider];

  async function handleCopyPrompt() {
    await navigator.clipboard.writeText(promptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadPrompt() {
    const blob = new Blob([promptText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="consultation-summary refinement-prompt-panel">
      <p><strong>{title}</strong></p>
      <p className="consultation-lead refinement-prompt-lead">{lead}</p>
      <div className="form-row refinement-prompt-provider">
        <label htmlFor={`${filename}-provider`}>使うAI</label>
        <select
          id={`${filename}-provider`}
          value={provider}
          onChange={(event) => onChangeProvider(event.target.value as ExternalPromptProvider)}
        >
          {EXTERNAL_PROMPT_PROVIDERS.map((item) => (
            <option key={item} value={item}>
              {EXTERNAL_PROMPT_PROVIDER_LABELS[item]}
            </option>
          ))}
        </select>
      </div>
      <div className="output-actions">
        <button type="button" onClick={handleCopyPrompt} className="btn-secondary">
          {copied ? 'コピーしました' : `${providerLabel}向け要件整理プロンプトをコピー`}
        </button>
        <button type="button" onClick={handleDownloadPrompt} className="btn-secondary">
          {providerLabel}用Markdownを保存
        </button>
      </div>
      <details className="refinement-prompt-preview">
        <summary>プロンプトを確認</summary>
        <pre>{promptText}</pre>
      </details>
    </section>
  );
}
