import { createServer, type ServerResponse } from 'http';
import { appendAuditRecord } from './audit';
import type { GenerateApiDownloadSuccess, GenerateApiError } from './api';
import { handleGenerateApiDownloadRequest } from './api';
import { handleFeedbackApiRequest } from './feedback';
import { buildHealthPayload } from './health';
import { consumeRateLimit, rateLimitHeaders } from './rateLimit';
import { resolveRequestId } from './requestId';
import { handleSupportAuditListRequest, handleSupportFeedbackListRequest } from './support';

const PORT = Number(process.env.PORT ?? 8002);
const HOST = process.env.HOST ?? '0.0.0.0';
const CORS_ALLOW_HEADERS = 'Authorization, Content-Type';
const CORS_EXPOSE_HEADERS = 'Content-Disposition, X-Request-Id, X-Spec-Version, X-File-Count';

function getCorsAllowedOrigins(): string[] {
  return (process.env.CORS_ALLOW_ORIGIN ?? '*')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function getMaxRequestBodyBytes(): number {
  const raw = Number(process.env.MAX_REQUEST_BODY_BYTES ?? 1024 * 1024);
  return Number.isFinite(raw) && raw > 0 ? raw : 1024 * 1024;
}

export function isRequestBodyTooLarge(
  contentLengthHeader: string | undefined,
  maxRequestBodyBytes = getMaxRequestBodyBytes(),
): boolean {
  if (contentLengthHeader === undefined) {
    return false;
  }
  const parsed = Number(contentLengthHeader);
  return Number.isFinite(parsed) && parsed > maxRequestBodyBytes;
}

function getAuditAuthProvider(): 'mock' | 'gugenka' {
  return process.env.AUTH_PROVIDER === 'gugenka' ? 'gugenka' : 'mock';
}

function hasSessionCookie(cookieHeader: string | undefined): boolean {
  if (!cookieHeader) {
    return false;
  }
  return ['__session=', 'next-auth.session-token=', '__Secure-next-auth.session-token=']
    .some((tokenName) => cookieHeader.includes(tokenName));
}

function getAuditAuthMode(
  authorizationHeader: string | undefined,
  cookieHeader: string | undefined,
): 'bearer' | 'cookie_session' | 'anonymous' {
  if (authorizationHeader?.startsWith('Bearer ')) {
    return 'bearer';
  }
  if (hasSessionCookie(cookieHeader)) {
    return 'cookie_session';
  }
  return 'anonymous';
}

function jsonResponse(status: number, body: unknown): { status: number; text: string } {
  return {
    status,
    text: `${JSON.stringify(body)}\n`,
  };
}

export function isCorsOriginAllowed(requestOrigin: string | undefined): boolean {
  const allowedOrigins = getCorsAllowedOrigins();
  if (!requestOrigin || requestOrigin.length === 0) {
    return true;
  }
  if (allowedOrigins.includes('*')) {
    return true;
  }
  return allowedOrigins.includes(requestOrigin);
}

export function resolveCorsOrigin(requestOrigin: string | undefined): string | null {
  const allowedOrigins = getCorsAllowedOrigins();
  if (!requestOrigin || requestOrigin.length === 0) {
    return null;
  }
  if (allowedOrigins.includes('*')) {
    return requestOrigin;
  }
  if (allowedOrigins.includes(requestOrigin)) {
    return requestOrigin;
  }
  return null;
}

function applyCorsHeaders(reqOrigin: string | undefined, res: ServerResponse): void {
  const allowedOrigin = resolveCorsOrigin(reqOrigin);
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', CORS_EXPOSE_HEADERS);
  res.setHeader('Vary', 'Origin');
}

function applyRateLimitHeaders(res: ServerResponse, headers: Record<string, string>): void {
  for (const [headerName, headerValue] of Object.entries(headers)) {
    res.setHeader(headerName, headerValue);
  }
}

function toServerRequestId(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'meta' in payload) {
    const meta = (payload as { meta?: { requestId?: unknown } }).meta;
    return resolveRequestId('srv', meta?.requestId);
  }
  return resolveRequestId('srv', undefined);
}

function jsonServerResponse(res: ServerResponse, status: number, body: unknown): void {
  const out = jsonResponse(status, body);
  res.writeHead(out.status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(out.text);
}

export function createOrchestrationServer() {
  return createServer(async (req, res) => {
    const reqOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
    applyCorsHeaders(reqOrigin, res);
    const requestUrl = new URL(req.url ?? '/', 'http://localhost');
    const pathname = requestUrl.pathname;

    if (!isCorsOriginAllowed(reqOrigin)) {
      jsonServerResponse(res, 403, { error: 'Origin not allowed' });
      return;
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && pathname === '/healthz') {
      jsonServerResponse(res, 200, buildHealthPayload());
      return;
    }

    const isFeedbackBug = req.method === 'POST' && pathname === '/api/v1/feedback/bug';
    const isFeedbackRequest = req.method === 'POST' && pathname === '/api/v1/feedback/request';
    const isGenerate = req.method === 'POST' && pathname === '/api/v1/repositories/generate';
    const isSupportFeedbackList = req.method === 'GET' && pathname === '/api/v1/support/feedback';
    const isSupportAuditList = req.method === 'GET' && pathname === '/api/v1/support/audit';

    const maxRequestBodyBytes = getMaxRequestBodyBytes();
    if (!isGenerate && !isFeedbackBug && !isFeedbackRequest && !isSupportFeedbackList && !isSupportAuditList) {
      jsonServerResponse(res, 404, { error: 'Not Found' });
      return;
    }

    const authHeader = typeof req.headers.authorization === 'string'
      ? req.headers.authorization
      : undefined;
    const cookieHeader = typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined;
    const forwardedForHeader = typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for']
      : undefined;
    const remoteAddress = req.socket.remoteAddress;
    const auditAuthProvider = getAuditAuthProvider();
    const auditAuthMode = getAuditAuthMode(authHeader, cookieHeader);
    const rateLimitRoute = isGenerate
      ? 'generate'
      : isFeedbackBug || isFeedbackRequest
        ? 'feedback'
        : 'support_read';
    const rateLimit = consumeRateLimit({
      route: rateLimitRoute,
      authorizationHeader: authHeader,
      cookieHeader,
      forwardedForHeader,
      remoteAddress,
    });
    applyRateLimitHeaders(res, rateLimitHeaders(rateLimit));
    if (!rateLimit.allowed) {
      jsonServerResponse(res, 429, {
        error: 'Too Many Requests',
        retryAfterSeconds: rateLimit.retryAfterSeconds,
        scope: rateLimitRoute,
      });
      return;
    }

    if (isSupportFeedbackList || isSupportAuditList) {
      const supportResult = isSupportFeedbackList
        ? await handleSupportFeedbackListRequest(authHeader, cookieHeader, requestUrl.toString())
        : await handleSupportAuditListRequest(authHeader, cookieHeader, requestUrl.toString());
      jsonServerResponse(res, supportResult.status, supportResult.body);
      return;
    }

    const contentLengthHeader = typeof req.headers['content-length'] === 'string'
      ? req.headers['content-length']
      : undefined;
    if (isRequestBodyTooLarge(contentLengthHeader, maxRequestBodyBytes)) {
      jsonServerResponse(res, 413, {
        error: 'Request body too large',
        maxBytes: maxRequestBodyBytes,
      });
      return;
    }

    const chunks: Buffer[] = [];
    let receivedBytes = 0;
    let bodyRejected = false;
    req.on('data', (chunk: Buffer) => {
      if (bodyRejected || res.writableEnded) {
        return;
      }
      receivedBytes += chunk.length;
      if (receivedBytes > maxRequestBodyBytes) {
        bodyRejected = true;
        jsonServerResponse(res, 413, {
          error: 'Request body too large',
          maxBytes: maxRequestBodyBytes,
        });
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('error', () => {
      if (!res.writableEnded) {
        jsonServerResponse(res, 400, { error: 'Request stream error' });
      }
    });
    req.on('end', () => {
      if (bodyRejected || res.writableEnded) {
        return;
      }
      void (async () => {
        try {
          let payload: unknown;
          try {
            const raw = Buffer.concat(chunks).toString('utf-8');
            payload = raw.length > 0 ? JSON.parse(raw) : {};
          } catch {
            jsonServerResponse(res, 400, { error: 'Invalid JSON body' });
            return;
          }

          if (isFeedbackBug || isFeedbackRequest) {
            const feedbackType = isFeedbackBug ? 'bug' : 'request';
            const feedbackResult = await handleFeedbackApiRequest(
              authHeader,
              cookieHeader,
              feedbackType,
              payload,
            );
            jsonServerResponse(res, feedbackResult.status, feedbackResult.body);
            return;
          }

          const tentativeRequestId = toServerRequestId(payload);
          // eslint-disable-next-line no-console
          console.log(`[generate:start] requestId=${tentativeRequestId}`);
          const result = await handleGenerateApiDownloadRequest(authHeader, cookieHeader, payload);
          if (result.status !== 200) {
            const err = result.body as GenerateApiError;
            // eslint-disable-next-line no-console
            console.log(`[generate:failure] requestId=${err.requestId ?? tentativeRequestId} status=${result.status}`);
            appendAuditRecord({
              requestId: err.requestId ?? resolveRequestId('srv', undefined),
              userId: 'unknown',
              timestamp: new Date().toISOString(),
              result: 'failure',
              authProvider: auditAuthProvider,
              authMode: auditAuthMode,
              errorCode: String(result.status),
            });
            jsonServerResponse(res, result.status, result.body);
            return;
          }

          const ok = result.body as GenerateApiDownloadSuccess;
          appendAuditRecord({
            requestId: ok.requestId,
            userId: ok.userId,
            timestamp: new Date().toISOString(),
            result: 'success',
            specVersion: ok.specVersion,
            repoType: ok.repoType,
            fileCount: ok.fileCount,
            projectSlug: ok.projectSlug,
            artifactFilename: ok.artifact.filename,
            authProvider: auditAuthProvider,
            authMode: auditAuthMode,
            selectedSkillIds: ok.selectedSkillIds,
          });
          // eslint-disable-next-line no-console
          console.log(
            `[generate:success] requestId=${ok.requestId} repoType=${ok.repoType} fileCount=${ok.fileCount} zipBytes=${ok.zipBuffer.length}`,
          );

          res.writeHead(200, {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${ok.artifact.filename}"`,
            'X-Request-Id': ok.requestId,
            'X-Spec-Version': ok.specVersion,
            'X-File-Count': String(ok.fileCount),
          });
          res.end(ok.zipBuffer);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('[server:error]', error);
          if (!res.writableEnded) {
            jsonServerResponse(res, 500, { error: 'Internal Server Error' });
          }
        }
      })();
    });
  });
}

if (require.main === module) {
  const server = createOrchestrationServer();
  server.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(`RepoGenesis orchestration API listening on http://${HOST}:${PORT}`);
  });
}
