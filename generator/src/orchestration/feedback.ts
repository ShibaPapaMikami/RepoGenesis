import { authorizeRequestAsync } from './auth';
import { persistFeedback, type FeedbackType } from './feedbackStore';
import { createEntityId, resolveRequestId } from './requestId';

export interface FeedbackApiRequest {
  title: unknown;
  description: unknown;
  email?: unknown;
  metadata?: unknown;
  meta?: {
    requestId?: unknown;
  };
}

export interface FeedbackApiSuccess {
  requestId: string;
  feedbackId: string;
  type: FeedbackType;
  storedPath: string;
}

export interface FeedbackApiError {
  error: string;
  requestId?: string;
}

export interface ApiResponse<T = unknown> {
  status: number;
  body: T;
}

function sanitizeString(input: unknown): string {
  return typeof input === 'string' ? input.trim() : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requiresFeedbackAuth(): boolean {
  return (process.env.FEEDBACK_REQUIRE_AUTH ?? 'false').toLowerCase() === 'true';
}

export async function handleFeedbackApiRequest(
  authHeader: string | undefined,
  cookieHeader: string | undefined,
  feedbackType: FeedbackType,
  payload: unknown,
): Promise<ApiResponse<FeedbackApiSuccess | FeedbackApiError>> {
  const auth = await authorizeRequestAsync(authHeader, cookieHeader);
  if ((!auth.ok || !auth.context) && requiresFeedbackAuth()) {
    return { status: auth.status, body: { error: auth.error ?? 'Unauthorized' } };
  }

  if (!isRecord(payload)) {
    return { status: 400, body: { error: 'Invalid payload' } };
  }

  const requestId = resolveRequestId('fb', isRecord(payload.meta) ? payload.meta.requestId : undefined);
  const title = sanitizeString(payload.title);
  const description = sanitizeString(payload.description);
  const emailRaw = sanitizeString(payload.email);
  const email = emailRaw.length > 0 ? emailRaw : undefined;
  const metadata = isRecord(payload.metadata) ? payload.metadata : undefined;

  if (title.length < 3) {
    return { status: 400, body: { error: 'title must be at least 3 characters', requestId } };
  }
  if (description.length < 10) {
    return { status: 400, body: { error: 'description must be at least 10 characters', requestId } };
  }

  const feedbackId = createEntityId(feedbackType);
  const userId = auth.ok && auth.context ? auth.context.userId : 'anonymous';
  const stored = persistFeedback({
    feedbackId,
    requestId,
    createdAt: new Date().toISOString(),
    type: feedbackType,
    userId,
    title,
    description,
    email,
    metadata,
  });

  return {
    status: 200,
    body: {
      requestId,
      feedbackId,
      type: feedbackType,
      storedPath: stored.relativePath,
    },
  };
}
