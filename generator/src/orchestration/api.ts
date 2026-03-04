import packageJson from '../../package.json';
import { generateFromSpec } from '../generateFromSpec';
import { projectSpecSchema } from '../schema';
import { authorizeRequestAsync, hasGeneratePermission } from './auth';
import { createZipBuffer } from './zip';

export interface GenerateApiRequest {
  spec: unknown;
  output?: {
    format?: 'zip';
  };
  meta?: {
    requestId?: string;
  };
}

export interface GenerateApiSuccess {
  requestId: string;
  specVersion: string;
  fileCount: number;
  repoType: 'single' | 'multi';
  artifact: {
    contentType: 'application/zip';
    filename: string;
  };
}

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
}

export interface GenerateApiError {
  error: string;
  requestId?: string;
}

export interface GenerateApiDownloadSuccess extends GenerateApiSuccess {
  userId: string;
  zipBuffer: Buffer;
}

interface PreparedGenerateRequest {
  requestId: string;
  userId: string;
  spec: ReturnType<typeof projectSpecSchema.parse>;
}

function toRequestId(maybeId: unknown): string {
  if (typeof maybeId === 'string' && maybeId.length > 0) return maybeId;
  return `srv-${Date.now()}`;
}

function extractIssueMessage(issues: Array<{ path: PropertyKey[]; message: string }>): string {
  return issues.map((i) => `${String(i.path.join('.'))}: ${i.message}`).join('; ');
}

async function prepareGenerateRequest(
  authHeader: string | undefined,
  cookieHeader: string | undefined,
  payload: unknown,
): Promise<ApiResponse<PreparedGenerateRequest | GenerateApiError>> {
  const auth = await authorizeRequestAsync(authHeader, cookieHeader);
  if (!auth.ok || !auth.context) {
    return { status: auth.status, body: { error: auth.error ?? 'Unauthorized' } };
  }
  if (!hasGeneratePermission(auth.context)) {
    return { status: 403, body: { error: 'Forbidden' } };
  }

  if (payload === null || typeof payload !== 'object') {
    return { status: 400, body: { error: 'Invalid payload' } };
  }

  const req = payload as GenerateApiRequest;
  const requestId = toRequestId(req.meta?.requestId);

  if (req.output?.format && req.output.format !== 'zip') {
    return { status: 400, body: { error: 'Unsupported output.format', requestId } };
  }

  const parsed = projectSpecSchema.safeParse(req.spec);
  if (!parsed.success) {
    return {
      status: 400,
      body: {
        error: `Validation failed: ${extractIssueMessage(parsed.error.issues)}`,
        requestId,
      },
    };
  }

  return {
    status: 200,
    body: {
      requestId,
      userId: auth.context.userId,
      spec: parsed.data,
    },
  };
}

export async function handleGenerateApiRequest(
  authHeader: string | undefined,
  cookieHeader: string | undefined,
  payload: unknown,
): Promise<ApiResponse<GenerateApiSuccess | GenerateApiError>> {
  const prepared = await prepareGenerateRequest(authHeader, cookieHeader, payload);
  if (prepared.status !== 200) {
    return { status: prepared.status, body: prepared.body as GenerateApiError };
  }

  const { requestId, spec } = prepared.body as PreparedGenerateRequest;
  const fileMap = generateFromSpec(spec, {
    source: 'projectSpec',
    specVersion: spec.specVersion,
    generatorVersion: packageJson.version,
  });

  return {
    status: 200,
    body: {
      requestId,
      specVersion: spec.specVersion,
      fileCount: fileMap.size,
      repoType: spec.structure.repo_type,
      artifact: {
        contentType: 'application/zip',
        filename: `${spec.project.slug}.zip`,
      },
    },
  };
}

export async function handleGenerateApiDownloadRequest(
  authHeader: string | undefined,
  cookieHeader: string | undefined,
  payload: unknown,
): Promise<ApiResponse<GenerateApiDownloadSuccess | GenerateApiError>> {
  const prepared = await prepareGenerateRequest(authHeader, cookieHeader, payload);
  if (prepared.status !== 200) {
    return { status: prepared.status, body: prepared.body as GenerateApiError };
  }

  const { requestId, userId, spec } = prepared.body as PreparedGenerateRequest;
  const fileMap = generateFromSpec(spec, {
    source: 'projectSpec',
    specVersion: spec.specVersion,
    generatorVersion: packageJson.version,
  });

  const zipEntries = Array.from(fileMap.entries()).map(([relativePath, content]) => ({
    path: `${spec.project.slug}/${relativePath}`,
    content,
  }));

  return {
    status: 200,
    body: {
      requestId,
      userId,
      specVersion: spec.specVersion,
      fileCount: fileMap.size,
      repoType: spec.structure.repo_type,
      artifact: {
        contentType: 'application/zip',
        filename: `${spec.project.slug}.zip`,
      },
      zipBuffer: createZipBuffer(zipEntries),
    },
  };
}
