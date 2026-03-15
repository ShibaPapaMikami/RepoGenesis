import packageJson from '../../package.json';
import { generateFromSpec } from '../generateFromSpec';
import { projectSpecSchema } from '../schema';
import { authorizeRequestAsync, hasGeneratePermission } from './auth';
import { createZipBuffer } from './zip';
import type { SkillProvider } from '../skillsManifest';
import { bundleSelectedSkillsFromRegistry } from '../selectedSkillBundle';

export interface GenerateApiRequest {
  spec: unknown;
  output?: {
    format?: 'zip';
  };
  meta?: {
    requestId?: string;
    selectedSkills?: Array<{
      id?: unknown;
      name?: unknown;
      version?: unknown;
      sourceType?: unknown;
      providers?: unknown;
    }>;
  };
}

type RawSelectedSkill = {
  id?: unknown;
  name?: unknown;
  version?: unknown;
  sourceType?: unknown;
  providers?: unknown;
};

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
  selectedSkills: SelectedSkillMeta[];
}

type SelectedSkillMeta = {
  id: string;
  name: string;
  version: string;
  sourceType: 'official' | 'curated' | 'internal';
  providers: SkillProvider[];
};

function buildGenerateFileMap(
  spec: ReturnType<typeof projectSpecSchema.parse>,
  selectedSkills: SelectedSkillMeta[],
  requestId: string,
) {
  if (selectedSkills.length === 0) {
    return generateFromSpec(spec, {
      source: 'projectSpec',
      specVersion: spec.specVersion,
      generatorVersion: packageJson.version,
      selectedSkills,
    });
  }

  const bundledSkills = bundleSelectedSkillsFromRegistry({
    project: spec,
    selectedSkills,
    installedBy: `repogenesis:${requestId}`,
  });

  if (bundledSkills.warnings.length > 0) {
    console.warn('[repogenesis] selected skill bundling warnings:', bundledSkills.warnings);
  }

  return generateFromSpec(spec, {
    source: 'projectSpec',
    specVersion: spec.specVersion,
    generatorVersion: packageJson.version,
    selectedSkills,
    selectedSkillsBundled: bundledSkills.manifest.installed.length > 0,
    selectedSkillsManifest: bundledSkills.manifest,
    selectedSkillFiles: bundledSkills.files,
  });
}

function sanitizeSelectedSkills(input: RawSelectedSkill[] | undefined): SelectedSkillMeta[] {
  if (!Array.isArray(input)) return [];

  return input.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const raw = item as Record<string, unknown>;
    const { id, name, version, sourceType, providers } = raw;
    if (typeof id !== 'string' || typeof name !== 'string' || typeof version !== 'string') return [];
    if (sourceType !== 'official' && sourceType !== 'curated' && sourceType !== 'internal') return [];
    const normalizedSourceType: SelectedSkillMeta['sourceType'] = sourceType;
    const parsedProviders = Array.isArray(providers)
      ? providers.filter((provider): provider is SkillProvider =>
        provider === 'codex' || provider === 'claude_code' || provider === 'gemini_cli' || provider === 'tool_agnostic')
      : [];
    return [{ id, name, version, sourceType: normalizedSourceType, providers: parsedProviders }];
  });
}

function requiresGenerateAuth(): boolean {
  return (process.env.GENERATE_REQUIRE_AUTH ?? 'true').toLowerCase() !== 'false';
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
  const enforceAuth = requiresGenerateAuth();
  const auth = await authorizeRequestAsync(authHeader, cookieHeader);
  if ((!auth.ok || !auth.context) && enforceAuth) {
    return { status: auth.status, body: { error: auth.error ?? 'Unauthorized' } };
  }
  if (auth.ok && auth.context && !hasGeneratePermission(auth.context) && enforceAuth) {
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
      userId: auth.ok && auth.context ? auth.context.userId : 'anonymous',
      spec: parsed.data,
      selectedSkills: sanitizeSelectedSkills(req.meta?.selectedSkills),
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

  const { requestId, spec, selectedSkills } = prepared.body as PreparedGenerateRequest;
  const fileMap = buildGenerateFileMap(spec, selectedSkills, requestId);

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

  const { requestId, userId, spec, selectedSkills } = prepared.body as PreparedGenerateRequest;
  const fileMap = buildGenerateFileMap(spec, selectedSkills, requestId);

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
