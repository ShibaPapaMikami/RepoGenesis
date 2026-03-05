import { buildProjectSpec } from './buildProjectSpec.ts';
import { getGenerationMode, getOrchestrationApiBase, getRemoteAuthMode } from './generateRepository.ts';
import type { FormState } from '../state/actions.ts';

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

  if (getGenerationMode() !== 'remote' || !getOrchestrationApiBase()) {
    const fileLabel = input.type === 'bug' ? 'bug' : 'request';
    triggerJsonDownload(`repogenesis-${fileLabel}-${Date.now()}.json`, payload);
    return { ok: true, message: 'Saved locally as JSON file' };
  }

  const apiBase = getOrchestrationApiBase() as string;
  const remoteAuthMode = getRemoteAuthMode();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (remoteAuthMode === 'manual_bearer' && input.authToken?.trim()) {
    headers.Authorization = `Bearer ${input.authToken.trim()}`;
  }

  const response = await fetch(`${apiBase}/api/v1/feedback/${input.type}`, {
    method: 'POST',
    headers,
    credentials: remoteAuthMode === 'cookie_session' ? 'include' : 'same-origin',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let msg = `Feedback submit failed (${response.status})`;
    try {
      const json = await response.json() as { error?: string };
      if (json.error) msg = `${msg}: ${json.error}`;
    } catch {
      // keep default
    }
    return { ok: false, message: msg };
  }

  const kind = input.type === 'bug' ? 'Bug report' : 'Request';
  return { ok: true, message: `${kind} saved successfully` };
}
