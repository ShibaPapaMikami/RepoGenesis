export type IntakeSourceKind = 'pasted_markdown' | 'provider_markdown';

export type IntakeProviderId =
  | 'manual'
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'openai_api'
  | 'anthropic_api'
  | 'google_api';

export interface IntakeProviderMetadata {
  provider: IntakeProviderId;
  model?: string;
  promptVersion?: string;
  requestId?: string;
}

export interface IntakeEnvelope {
  source: IntakeSourceKind;
  rawText: string;
  normalizedText: string;
  provider: IntakeProviderMetadata;
}

export function normalizeIntakeMarkdown(rawText: string): string {
  return rawText.replace(/\r\n/g, '\n').trim();
}

export function createIntakeEnvelope(
  rawText: string,
  provider: IntakeProviderMetadata = { provider: 'manual' },
): IntakeEnvelope {
  return {
    source: provider.provider === 'manual' ? 'pasted_markdown' : 'provider_markdown',
    rawText,
    normalizedText: normalizeIntakeMarkdown(rawText),
    provider,
  };
}
