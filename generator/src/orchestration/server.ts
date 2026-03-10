import { createServer, type ServerResponse } from 'http';
import { appendAuditRecord } from './audit';
import type { GenerateApiDownloadSuccess, GenerateApiError } from './api';
import { handleGenerateApiDownloadRequest } from './api';
import { handleFeedbackApiRequest } from './feedback';

const PORT = Number(process.env.PORT ?? 8002);
const HOST = process.env.HOST ?? '0.0.0.0';
const CORS_ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN ?? '*';
const CORS_ALLOW_HEADERS = 'Authorization, Content-Type';
const CORS_EXPOSE_HEADERS = 'Content-Disposition, X-Request-Id, X-Spec-Version, X-File-Count';
const CORS_ALLOWED_ORIGINS = CORS_ALLOW_ORIGIN.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

function jsonResponse(status: number, body: unknown): { status: number; text: string } {
  return {
    status,
    text: `${JSON.stringify(body)}\n`,
  };
}

function resolveCorsOrigin(requestOrigin: string | undefined): string {
  if (!requestOrigin || requestOrigin.length === 0) {
    return CORS_ALLOWED_ORIGINS[0] ?? '*';
  }
  if (CORS_ALLOWED_ORIGINS.includes('*')) {
    return requestOrigin;
  }
  if (CORS_ALLOWED_ORIGINS.includes(requestOrigin)) {
    return requestOrigin;
  }
  // Fallback to request origin to avoid browser-side credentialed CORS failures
  // when preview/custom domains are used.
  return requestOrigin;
}

function applyCorsHeaders(reqOrigin: string | undefined, res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', resolveCorsOrigin(reqOrigin));
  res.setHeader('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', CORS_EXPOSE_HEADERS);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
}

function toServerRequestId(payload: unknown): string {
  if (payload && typeof payload === 'object' && 'meta' in payload) {
    const meta = (payload as { meta?: { requestId?: unknown } }).meta;
    if (meta && typeof meta.requestId === 'string' && meta.requestId.length > 0) {
      return meta.requestId;
    }
  }
  return `srv-${Date.now()}`;
}

const server = createServer((req, res) => {
  const reqOrigin = typeof req.headers.origin === 'string' ? req.headers.origin : undefined;
  applyCorsHeaders(reqOrigin, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/healthz') {
    const out = jsonResponse(200, { ok: true });
    res.writeHead(out.status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(out.text);
    return;
  }

  const isFeedbackBug = req.method === 'POST' && req.url === '/api/v1/feedback/bug';
  const isFeedbackRequest = req.method === 'POST' && req.url === '/api/v1/feedback/request';
  const isGenerate = req.method === 'POST' && req.url === '/api/v1/repositories/generate';

  if (!isGenerate && !isFeedbackBug && !isFeedbackRequest) {
    const out = jsonResponse(404, { error: 'Not Found' });
    res.writeHead(out.status, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(out.text);
    return;
  }

  const chunks: Buffer[] = [];
  req.on('data', (chunk: Buffer) => chunks.push(chunk));
  req.on('end', async () => {
    let payload: unknown;
    try {
      const raw = Buffer.concat(chunks).toString('utf-8');
      payload = raw.length > 0 ? JSON.parse(raw) : {};
    } catch {
      const out = jsonResponse(400, { error: 'Invalid JSON body' });
      res.writeHead(out.status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(out.text);
      return;
    }

    const authHeader = typeof req.headers.authorization === 'string'
      ? req.headers.authorization
      : undefined;
    const cookieHeader = typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined;

    if (isFeedbackBug || isFeedbackRequest) {
      const feedbackType = isFeedbackBug ? 'bug' : 'request';
      const feedbackResult = await handleFeedbackApiRequest(
        authHeader,
        cookieHeader,
        feedbackType,
        payload,
      );
      const out = jsonResponse(feedbackResult.status, feedbackResult.body);
      res.writeHead(out.status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(out.text);
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
        requestId: err.requestId ?? `srv-${Date.now()}`,
        userId: 'unknown',
        timestamp: new Date().toISOString(),
        result: 'failure',
        errorCode: String(result.status),
      });
      const out = jsonResponse(result.status, result.body);
      res.writeHead(out.status, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(out.text);
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
  });
});

server.listen(PORT, HOST, () => {
  // eslint-disable-next-line no-console
  console.log(`RepoGenesis orchestration API listening on http://${HOST}:${PORT}`);
});
