import { authorizeRequestAsync, hasSupportReadPermission } from './auth';
import {
  listAuditRecords,
  listFeedbackRecords,
  getSupportDataStorePath,
  type AuditRecord,
  type FeedbackRecord,
  type FeedbackType,
} from './supportDataStore';

export interface SupportFeedbackApiSuccess {
  items: FeedbackRecord[];
  storePath: string;
}

export interface SupportAuditApiSuccess {
  items: AuditRecord[];
  storePath: string;
}

export interface SupportApiError {
  error: string;
}

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
}

function parseLimit(input: string | null): number {
  const value = Number(input ?? '');
  if (!Number.isFinite(value)) {
    return 20;
  }
  return Math.max(1, Math.min(Math.trunc(value), 100));
}

function parseFeedbackType(input: string | null): FeedbackType | undefined {
  if (input === 'bug' || input === 'request') {
    return input;
  }
  return undefined;
}

async function authorizeSupportRead(
  authHeader: string | undefined,
  cookieHeader: string | undefined,
): Promise<ApiResponse<true | SupportApiError>> {
  const auth = await authorizeRequestAsync(authHeader, cookieHeader);
  if (!auth.ok || !auth.context) {
    return { status: auth.status, body: { error: auth.error ?? 'Unauthorized' } };
  }
  if (!hasSupportReadPermission(auth.context)) {
    return { status: 403, body: { error: 'Forbidden' } };
  }
  return { status: 200, body: true };
}

export async function handleSupportFeedbackListRequest(
  authHeader: string | undefined,
  cookieHeader: string | undefined,
  requestUrl: string,
): Promise<ApiResponse<SupportFeedbackApiSuccess | SupportApiError>> {
  const auth = await authorizeSupportRead(authHeader, cookieHeader);
  if (auth.status !== 200) {
    return { status: auth.status, body: auth.body as SupportApiError };
  }

  const url = new URL(requestUrl, 'http://localhost');
  const items = listFeedbackRecords({
    type: parseFeedbackType(url.searchParams.get('type')),
    limit: parseLimit(url.searchParams.get('limit')),
  });

  return {
    status: 200,
    body: {
      items,
      storePath: getSupportDataStorePath(),
    },
  };
}

export async function handleSupportAuditListRequest(
  authHeader: string | undefined,
  cookieHeader: string | undefined,
  requestUrl: string,
): Promise<ApiResponse<SupportAuditApiSuccess | SupportApiError>> {
  const auth = await authorizeSupportRead(authHeader, cookieHeader);
  if (auth.status !== 200) {
    return { status: auth.status, body: auth.body as SupportApiError };
  }

  const url = new URL(requestUrl, 'http://localhost');
  const items = listAuditRecords(parseLimit(url.searchParams.get('limit')));

  return {
    status: 200,
    body: {
      items,
      storePath: getSupportDataStorePath(),
    },
  };
}
