#!/usr/bin/env node

const appUrlInput = process.env.APP_URL ?? process.argv[2];
if (!appUrlInput) {
  console.error('Usage: APP_URL=https://<deployment> npm run smoke:deploy');
  process.exit(1);
}

const appUrl = appUrlInput.replace(/\/+$/, '');
const requestIdHeader = 'x-request-id';
const failures = [];
const warnings = [];
const passes = [];

function note(collection, message) {
  collection.push(message);
  console.log(message);
}

async function readBody(response) {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }
  try {
    return await response.text();
  } catch {
    return null;
  }
}

function extractError(body) {
  if (!body || typeof body !== 'object') return undefined;
  if ('error' in body && typeof body.error === 'string') return body.error;
  return undefined;
}

async function checkRoot() {
  const response = await fetch(`${appUrl}/`);
  const html = await response.text();

  if (!response.ok) {
    note(failures, `[fail] GET / returned ${response.status}`);
    return;
  }
  if (!html.includes('<title>RepoGenesis</title>')) {
    note(failures, '[fail] GET / did not return the RepoGenesis shell');
    return;
  }
  note(passes, '[pass] GET / returned the RepoGenesis shell');
}

async function checkGenerateBff() {
  const response = await fetch(`${appUrl}/api/orchestration/repositories/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      spec: { specVersion: '1.0' },
      output: { format: 'zip' },
    }),
  });
  const body = await readBody(response);
  const error = extractError(body);
  const requestId = response.headers.get(requestIdHeader) ?? undefined;

  if (response.status === 500) {
    note(failures, `[fail] POST /api/orchestration/repositories/generate returned 500${error ? `: ${error}` : ''}${requestId ? ` (requestId=${requestId})` : ''}`);
    return;
  }
  if ([401, 403, 400, 422].includes(response.status)) {
    note(passes, `[pass] POST /api/orchestration/repositories/generate returned ${response.status}${error ? `: ${error}` : ''}${requestId ? ` (requestId=${requestId})` : ''}`);
    return;
  }
  note(warnings, `[warn] POST /api/orchestration/repositories/generate returned unexpected status ${response.status}${error ? `: ${error}` : ''}${requestId ? ` (requestId=${requestId})` : ''}`);
}

async function checkSupportEndpoint(pathname) {
  const response = await fetch(`${appUrl}${pathname}`);
  const body = await readBody(response);
  const error = extractError(body);

  if (response.status === 500) {
    note(failures, `[fail] GET ${pathname} returned 500${error ? `: ${error}` : ''}`);
    return;
  }
  if ([401, 403, 200].includes(response.status)) {
    note(passes, `[pass] GET ${pathname} returned ${response.status}${error ? `: ${error}` : ''}`);
    return;
  }
  note(warnings, `[warn] GET ${pathname} returned unexpected status ${response.status}${error ? `: ${error}` : ''}`);
}

async function main() {
  console.log(`==> Remote deploy smoke: ${appUrl}`);
  await checkRoot();
  await checkGenerateBff();
  await checkSupportEndpoint('/api/orchestration/support/feedback?limit=1');
  await checkSupportEndpoint('/api/orchestration/support/audit?limit=1');

  console.log('');
  console.log(`Summary: pass=${passes.length} warn=${warnings.length} fail=${failures.length}`);

  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[fail] smoke script crashed', error);
  process.exit(1);
});
