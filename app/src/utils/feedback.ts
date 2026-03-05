import { buildProjectSpec } from './buildProjectSpec.ts';
import { getGenerationMode, getOrchestrationApiBase, getRemoteAuthMode } from './generateRepository.ts';
import type { FormState } from '../state/actions.ts';
const PROXY_BASE = '/api/orchestration';

export type FeedbackType = 'bug' | 'request';

export interface ErrorReportPayload {
  timestamp: string;
  message: string;
  mode: 'local' | 'remote';
  spec: ReturnType<typeof buildProjectSpec>;
}

export interface SubmitFeedbackInput {
  type: FeedbackType;
  title: string;
  description: string;
  email?: string;
  state: FormState;
  errorReport?: ErrorReportPayload | null;
  authToken?: string;
}

export interface SubmitFeedbackResult {
  ok: boolean;
  message: string;
}

function triggerJsonDownload(filename: string, content: unknown): void {
  const blob = new Blob([`${JSON.stringify(content, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadErrorReport(report: ErrorReportPayload): void {
  triggerJsonDownload(`repogenesis-error-${Date.now()}.json`, report);
}

export async function submitFeedback(input: SubmitFeedbackInput): Promise<SubmitFeedbackResult> {
  const payload = {
    title: input.title,
    description: input.description,
    email: input.email,
    metadata: {
      projectSlug: buildProjectSpec(input.state).project.slug,
      errorReport: input.errorReport ?? undefined,
    },
  };

  const remoteAuthMode = getRemoteAuthMode();
  const remoteApiBase = remoteAuthMode === 'cookie_session'
    ? PROXY_BASE
    : getOrchestrationApiBase();

  if (getGenerationMode() !== 'remote' || !remoteApiBase) {
    const fileLabel = input.type === 'bug' ? 'bug' : 'request';
    triggerJsonDownload(`repogenesis-${fileLabel}-${Date.now()}.json`, payload);
    return { ok: true, message: 'ローカルに JSON として保存しました' };
  }

  const apiBase = remoteApiBase;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (remoteAuthMode === 'manual_bearer' && input.authToken?.trim()) {
    headers.Authorization = `Bearer ${input.authToken.trim()}`;
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase}/feedback/${input.type}`, {
      method: 'POST',
      headers,
      credentials: remoteAuthMode === 'cookie_session' ? 'include' : 'same-origin',
      body: JSON.stringify(payload),
    });
  } catch {
    return { ok: false, message: '送信に失敗しました。API通信またはCORS設定を確認してください。' };
  }

  if (!response.ok) {
    let msg = `送信に失敗しました (${response.status})`;
    try {
      const json = await response.json() as { error?: string };
      if (json.error) msg = `${msg}: ${json.error}`;
    } catch {
      // keep default
    }
    return { ok: false, message: msg };
  }

  const kind = input.type === 'bug' ? '不具合報告' : '要望';
  return { ok: true, message: `${kind}を保存しました` };
}
