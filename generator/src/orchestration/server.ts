import { createServer, type ServerResponse } from 'http';
import { appendAuditRecord } from './audit';
import type { GenerateApiDownloadSuccess, GenerateApiError } from './api';
import { handleGenerateApiDownloadRequest } from './api';

const PORT = Number(process.env.PORT ?? 8002);
const HOST = process.env.HOST ?? '0.0.0.0';
const CORS_ALLOW_ORIGIN = process.env.CORS_ALLOW_ORIGIN ?? '*';
const CORS_ALLOW_HEADERS = 'Authorization, Content-Type';
const CORS_EXPOSE_HEADERS = 'Content-Disposition, X-Request-Id, X-Spec-Version, X-File-Count';

function jsonResponse(status: number, body: unknown): { status: number; text: string } {
  return {
    status,
    text: `${JSON.stringify(body)}\n`,
  };
}

function applyCorsHeaders(res: ServerResponse): void {
  res.setHeader('Access-Control-Allow-Origin', CORS_ALLOW_ORIGIN);
  res.setHeader('Access-Control-Allow-Headers', CORS_ALLOW_HEADERS);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Expose-Headers', CORS_EXPOSE_HEADERS);
}

const server = createServer((req, res) => {
  applyCorsHeaders(res);

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

  if (req.method !== 'POST' || req.url !== '/api/v1/repositories/generate') {
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

    const result = await handleGenerateApiDownloadRequest(
      typeof req.headers.authorization === 'string' ? req.headers.authorization : undefined,
      typeof req.headers.cookie === 'string' ? req.headers.cookie : undefined,
      payload,
    );
    if (result.status !== 200) {
      const err = result.body as GenerateApiError;
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
