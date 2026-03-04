import type { FormState } from '../state/actions.ts';
import { buildProjectSpec } from './buildProjectSpec.ts';
import { generateRepositoryZip } from './generateRepositoryZip.ts';

export interface GenerateRepositoryResult {
  blob: Blob;
  filename: string;
  fileCount?: number;
  mode: 'local' | 'remote';
}

const API_BASE = import.meta.env.VITE_ORCHESTRATION_API_URL as string | undefined;
const REMOTE_AUTH_MODE = (import.meta.env.VITE_REMOTE_AUTH_MODE as string | undefined) ?? 'manual_bearer';

export function getGenerationMode(): 'local' | 'remote' {
  return API_BASE && API_BASE.length > 0 ? 'remote' : 'local';
}

export function getRemoteAuthMode(): 'manual_bearer' | 'cookie_session' {
  return REMOTE_AUTH_MODE === 'cookie_session' ? 'cookie_session' : 'manual_bearer';
}

function parseFilenameFromContentDisposition(headerValue: string | null, fallback: string): string {
  if (!headerValue) return fallback;
  const match = headerValue.match(/filename="?([^"]+)"?/i);
  if (!match?.[1]) return fallback;
  return match[1];
}

async function generateRepositoryRemote(state: FormState, authToken: string): Promise<GenerateRepositoryResult> {
  if (!API_BASE) {
    throw new Error('VITE_ORCHESTRATION_API_URL is not configured');
  }
  const authMode = getRemoteAuthMode();
  if (authMode === 'manual_bearer' && (!authToken || authToken.trim().length === 0)) {
    throw new Error('Authorization token is required for remote generation');
  }

  const spec = buildProjectSpec(state);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (authMode === 'manual_bearer') {
    headers.Authorization = `Bearer ${authToken.trim()}`;
  }

  const response = await fetch(`${API_BASE}/api/v1/repositories/generate`, {
    method: 'POST',
    headers,
    credentials: authMode === 'cookie_session' ? 'include' : 'same-origin',
    body: JSON.stringify({
      spec,
      output: { format: 'zip' },
    }),
  });

  if (!response.ok) {
    let msg = `Remote generation failed (${response.status})`;
    try {
      const json = await response.json() as { error?: string };
      if (json?.error) msg = `${msg}: ${json.error}`;
    } catch {
      // no-op: keep default message
    }
    throw new Error(msg);
  }

  const fallbackFilename = `${spec.project.slug}.zip`;
  const filename = parseFilenameFromContentDisposition(
    response.headers.get('Content-Disposition'),
    fallbackFilename,
  );
  const fileCountHeader = response.headers.get('X-File-Count');
  const fileCount = fileCountHeader ? Number(fileCountHeader) : undefined;
  const blob = await response.blob();

  return {
    blob,
    filename,
    fileCount: Number.isFinite(fileCount) ? fileCount : undefined,
    mode: 'remote',
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
  };
}
