import { getGenerationMode, usesSameOriginOrchestrationProxy } from './generateRepository.ts';

export type SupportFeedbackType = 'all' | 'bug' | 'request';

export interface SupportFeedbackRecord {
  feedbackId: string;
  requestId: string;
  createdAt: string;
  type: 'bug' | 'request';
  userId: string;
  title: string;
  description: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export interface SupportAuditRecord {
  requestId: string;
  userId: string;
  timestamp: string;
  result: 'success' | 'failure';
  specVersion?: string;
  repoType?: 'single' | 'multi';
  fileCount?: number;
  projectSlug?: string;
  artifactFilename?: string;
  authProvider?: 'mock' | 'gugenka';
  authMode?: 'bearer' | 'cookie_session' | 'anonymous';
  selectedSkillIds?: string[];
  errorCode?: string;
}

export interface SupportSnapshot {
  feedbackItems: SupportFeedbackRecord[];
  auditItems: SupportAuditRecord[];
  feedbackStorePath: string;
  auditStorePath: string;
}

interface SupportFeedbackApiSuccess {
  items: SupportFeedbackRecord[];
  storePath: string;
}

interface SupportAuditApiSuccess {
  items: SupportAuditRecord[];
  storePath: string;
}

export class SupportDataError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'SupportDataError';
    this.status = status;
  }
}

function getSupportProxyBase(): string {
  if (getGenerationMode() !== 'remote' || !usesSameOriginOrchestrationProxy()) {
    throw new SupportDataError('support panel is only available in remote mode');
  }
  return '/api/orchestration/support';
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    searchParams.set(key, String(value));
  }
  const serialized = searchParams.toString();
  return serialized.length > 0 ? `?${serialized}` : '';
}

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: 'GET',
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMessage = `運用ログの読み込みに失敗しました (${response.status})`;
    try {
      const body = await response.json() as { error?: string };
      if (body.error) {
        errorMessage = `${errorMessage}: ${body.error}`;
      }
    } catch {
      // keep default
    }
    throw new SupportDataError(errorMessage, response.status);
  }

  return response.json() as Promise<T>;
}

export async function fetchSupportSnapshot(
  options: { feedbackType?: SupportFeedbackType; feedbackLimit?: number; auditLimit?: number } = {},
): Promise<SupportSnapshot> {
  const base = getSupportProxyBase();
  const feedbackType = options.feedbackType && options.feedbackType !== 'all' ? options.feedbackType : undefined;

  const [feedback, audit] = await Promise.all([
    fetchJson<SupportFeedbackApiSuccess>(
      `${base}/feedback${buildQuery({ type: feedbackType, limit: options.feedbackLimit ?? 8 })}`,
    ),
    fetchJson<SupportAuditApiSuccess>(
      `${base}/audit${buildQuery({ limit: options.auditLimit ?? 8 })}`,
    ),
  ]);

  return {
    feedbackItems: feedback.items,
    auditItems: audit.items,
    feedbackStorePath: feedback.storePath,
    auditStorePath: audit.storePath,
  };
}
