import type { FormState } from '../state/actions.ts';
import { buildProjectSpec } from './buildProjectSpec.ts';
import { generateRepositoryZip } from './generateRepositoryZip.ts';
import type { SkillCatalogItem } from '../data/skillCatalog.ts';
import { readRuntimeEnv } from './runtimeEnv.ts';

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

const API_BASE = readRuntimeEnv('VITE_ORCHESTRATION_API_URL');
const REMOTE_GENERATE_TIMEOUT_MS = 60_000;

export function getOrchestrationApiBase(): string | undefined {
  return API_BASE;
}

export function getGenerationMode(): 'local' | 'remote' {
  return API_BASE && API_BASE.length > 0 ? 'remote' : 'local';
}

export function usesSameOriginOrchestrationProxy(): boolean {
  return typeof API_BASE === 'string' && API_BASE.startsWith('/');
}

function parseFilenameFromContentDisposition(headerValue: string | null, fallback: string): string {
  if (!headerValue) return fallback;
  const match = headerValue.match(/filename="?([^"]+)"?/i);
  if (!match?.[1]) return fallback;
  return match[1];
}

function getRemoteGenerateErrorMessage(
  status: number,
  error?: string,
): string {
  const normalized = error?.trim().toLowerCase();

  if (status === 401) {
    return 'ログイン状態を確認できませんでした。上部の認証セクションでログインし直してから再実行してください。';
  }

  if (status === 403) {
    return 'このアカウントでは生成を実行できません。権限設定を確認してください。';
  }

  if (normalized === 'upstream request timed out' || status === 504) {
    return 'ZIP生成がタイムアウトしました。APIの再デプロイ状態または生成内容を確認してください。';
  }

  if (normalized === 'upstream request failed' || status === 502) {
    return '生成APIとの通信に失敗しました。時間をおいて再度お試しください。';
  }

  return error ? `リモート生成に失敗しました (${status}): ${error}` : `リモート生成に失敗しました (${status})`;
}

function toSelectedSkillMeta(skills: SkillCatalogItem[]) {
  return skills.map((skill) => ({
    id: skill.id,
    name: skill.name,
    version: skill.version,
    sourceType: skill.sourceType,
    providers: skill.providers,
  }));
}

async function generateRepositoryRemote(
  state: FormState,
  selectedSkills: SkillCatalogItem[],
): Promise<GenerateRepositoryResult> {
  const apiBase = getOrchestrationApiBase();
  if (!apiBase) {
    throw new Error('VITE_ORCHESTRATION_API_URL が未設定です');
  }

  const spec = buildProjectSpec(state);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let response: Response;
  try {
    response = await fetch(`${apiBase}/repositories/generate`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        spec,
        output: { format: 'zip' },
        meta: {
          selectedSkills: toSelectedSkillMeta(selectedSkills),
        },
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
    let serverError: string | undefined;
    let requestId = response.headers.get('X-Request-Id') ?? undefined;
    try {
      const json = await response.json() as { error?: string; requestId?: string };
      serverError = json?.error;
      requestId = requestId ?? json?.requestId;
    } catch {
      // no-op: keep default message
    }
    const msg = getRemoteGenerateErrorMessage(response.status, serverError);
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
  selectedSkills: SkillCatalogItem[] = [],
): Promise<GenerateRepositoryResult> {
  if (getGenerationMode() === 'remote') {
    return generateRepositoryRemote(state, selectedSkills);
  }

  const local = generateRepositoryZip(state, selectedSkills);
  return {
    blob: local.blob,
    filename: local.filename,
    fileCount: local.fileCount,
    mode: 'local',
    requestId: undefined,
  };
}
