import type { FormState } from '../state/actions.ts';
import { buildProjectSpec } from './buildProjectSpec.ts';
import { generateRepositoryZip } from './generateRepositoryZip.ts';

export interface GenerateRepositoryResult {
  blob: Blob;
  filename: string;
  fileCount?: number;
  mode: 'local' | 'remote';
  requestId?: string;
}

export class GenerateRepositoryError extends Error {
  status?: number;
  requestId?: string;
  kind: 'timeout' | 'network' | 'response';

  constructor(
    message: string,
    options: { status?: number; requestId?: string; kind: 'timeout' | 'network' | 'response' },
  ) {
    super(message);
    this.name = 'GenerateRepositoryError';
    this.status = options.status;
    this.requestId = options.requestId;
    this.kind = options.kind;
  }
}

const API_BASE = import.meta.env.VITE_ORCHESTRATION_API_URL as string | undefined;
const REMOTE_AUTH_MODE = (import.meta.env.VITE_REMOTE_AUTH_MODE as string | undefined) ?? 'manual_bearer';
const ENABLE_MANUAL_BEARER_UI = (import.meta.env.VITE_ENABLE_MANUAL_BEARER_UI as string | undefined) === 'true';
const PROXY_BASE = '/api/orchestration';
const REMOTE_GENERATE_TIMEOUT_MS = 60_000;

export function getOrchestrationApiBase(): string | undefined {
  return API_BASE;
}

export function getGenerationMode(): 'local' | 'remote' {
  if (getRemoteAuthMode() === 'cookie_session') return 'remote';
  return API_BASE && API_BASE.length > 0 ? 'remote' : 'local';
}

export function getRemoteAuthMode(): 'manual_bearer' | 'cookie_session' {
  return REMOTE_AUTH_MODE === 'cookie_session' ? 'cookie_session' : 'manual_bearer';
}

export function canUseManualBearerUi(): boolean {
  return import.meta.env.DEV || ENABLE_MANUAL_BEARER_UI;
}

function resolveApiBase(authMode: 'manual_bearer' | 'cookie_session'): string | undefined {
  if (authMode === 'cookie_session') {
    return PROXY_BASE;
  }
  return API_BASE;
}

function parseFilenameFromContentDisposition(headerValue: string | null, fallback: string): string {
  if (!headerValue) return fallback;
  const match = headerValue.match(/filename="?([^"]+)"?/i);
  if (!match?.[1]) return fallback;
  return match[1];
}

async function generateRepositoryRemote(state: FormState, authToken: string): Promise<GenerateRepositoryResult> {
  const authMode = getRemoteAuthMode();
  const apiBase = resolveApiBase(authMode);
  if (!apiBase) {
    throw new Error('VITE_ORCHESTRATION_API_URL が未設定です');
  }
  if (authMode === 'manual_bearer' && (!authToken || authToken.trim().length === 0)) {
    throw new Error('リモート生成には API トークンが必要です');
  }

  const spec = buildProjectSpec(state);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authMode === 'manual_bearer') {
    headers.Authorization = `Bearer ${authToken.trim()}`;
  }

  let response: Response;
  try {
    response = await fetch(`${apiBase}/repositories/generate`, {
      method: 'POST',
      headers,
      credentials: authMode === 'cookie_session' ? 'include' : 'same-origin',
      body: JSON.stringify({
        spec,
        output: { format: 'zip' },
      }),
      signal: AbortSignal.timeout(REMOTE_GENERATE_TIMEOUT_MS),
    });
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'TimeoutError';
    throw new GenerateRepositoryError(
      isTimeout
        ? 'ZIP生成がタイムアウトしました。APIの再デプロイ状態または生成内容を確認してください。'
        : '通信に失敗しました。CORS設定またはAPI稼働状態を確認してください。',
      { kind: isTimeout ? 'timeout' : 'network' },
    );
  }

  if (!response.ok) {
    let msg = `リモート生成に失敗しました (${response.status})`;
    const requestId = response.headers.get('X-Request-Id') ?? undefined;
    try {
      const json = await response.json() as { error?: string };
      if (json?.error) msg = `${msg}: ${json.error}`;
    } catch {
      // no-op: keep default message
    }
    throw new GenerateRepositoryError(msg, {
      status: response.status,
      requestId,
      kind: 'response',
    });
  }

  const fallbackFilename = `${spec.project.slug}.zip`;
  const filename = parseFilenameFromContentDisposition(
    response.headers.get('Content-Disposition'),
    fallbackFilename,
  );
  const fileCountHeader = response.headers.get('X-File-Count');
  const fileCount = fileCountHeader ? Number(fileCountHeader) : undefined;
  const requestId = response.headers.get('X-Request-Id') ?? undefined;
  const blob = await response.blob();

  return {
    blob,
    filename,
    fileCount: Number.isFinite(fileCount) ? fileCount : undefined,
    mode: 'remote',
    requestId,
  };
}

export async function generateRepository(
  state: FormState,
  authToken?: string,
): Promise<GenerateRepositoryResult> {
  if (getGenerationMode() === 'remote') {
    return generateRepositoryRemote(state, authToken ?? '');
  }

  const local = generateRepositoryZip(state);
  return {
    blob: local.blob,
    filename: local.filename,
    fileCount: local.fileCount,
    mode: 'local',
    requestId: undefined,
  };
}
