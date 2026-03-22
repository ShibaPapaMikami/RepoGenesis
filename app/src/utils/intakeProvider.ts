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

export const INTAKE_PROVIDER_LABELS: Record<IntakeProviderId, string> = {
  manual: '手動 / 未指定',
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  openai_api: 'OpenAI API',
  anthropic_api: 'Anthropic API',
  google_api: 'Google API',
};

export interface IntakeEnvelope {
  source: IntakeSourceKind;
  rawText: string;
  normalizedText: string;
  provider: IntakeProviderMetadata;
}

export function normalizeIntakeProviderMetadata(
  provider: Partial<IntakeProviderMetadata> | null | undefined,
): IntakeProviderMetadata {
  const normalizedProvider = provider?.provider;
  const validProvider = normalizedProvider === 'chatgpt'
    || normalizedProvider === 'claude'
    || normalizedProvider === 'gemini'
    || normalizedProvider === 'openai_api'
    || normalizedProvider === 'anthropic_api'
    || normalizedProvider === 'google_api'
    || normalizedProvider === 'manual'
    ? normalizedProvider
    : 'manual';

  return {
    provider: validProvider,
    model: typeof provider?.model === 'string' && provider.model.trim() ? provider.model.trim() : undefined,
    promptVersion: typeof provider?.promptVersion === 'string' && provider.promptVersion.trim()
      ? provider.promptVersion.trim()
      : undefined,
    requestId: typeof provider?.requestId === 'string' && provider.requestId.trim() ? provider.requestId.trim() : undefined,
  };
}

export function formatIntakeProviderLabel(provider: IntakeProviderMetadata): string {
  const normalized = normalizeIntakeProviderMetadata(provider);
  return normalized.model
    ? `${INTAKE_PROVIDER_LABELS[normalized.provider]} (${normalized.model})`
    : INTAKE_PROVIDER_LABELS[normalized.provider];
}

export function normalizeIntakeMarkdown(rawText: string): string {
  return rawText.replace(/\r\n/g, '\n').trim();
}

export function createIntakeEnvelope(
  rawText: string,
  provider: IntakeProviderMetadata = { provider: 'manual' },
): IntakeEnvelope {
  const normalizedProvider = normalizeIntakeProviderMetadata(provider);
  return {
    source: normalizedProvider.provider === 'manual' ? 'pasted_markdown' : 'provider_markdown',
    rawText,
    normalizedText: normalizeIntakeMarkdown(rawText),
    provider: normalizedProvider,
  };
}
