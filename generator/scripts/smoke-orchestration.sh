#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:8002}"
AUTH_TOKEN="${AUTH_TOKEN:-dev-token}"
SPEC_FILE="${SPEC_FILE:-$ROOT_DIR/tests/fixtures/test_brief_app_export.json}"
OUT_DIR="${OUT_DIR:-${TMPDIR:-/tmp}/repogenesis-smoke}"
REQUIRE_DURABLE_SUPPORT_STORE="${REQUIRE_DURABLE_SUPPORT_STORE:-false}"
SKIP_SUPPORT_READS="${SKIP_SUPPORT_READS:-false}"

if [[ ! -f "$SPEC_FILE" ]]; then
  echo "Spec file not found: $SPEC_FILE" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
PAYLOAD_FILE="$OUT_DIR/payload.json"
HEADERS_FILE="$OUT_DIR/headers.txt"
ZIP_FILE="$OUT_DIR/repository.zip"

node -e "const fs=require('fs');const spec=JSON.parse(fs.readFileSync(process.argv[1],'utf8'));const body={spec,output:{format:'zip'}};fs.writeFileSync(process.argv[2],JSON.stringify(body));" "$SPEC_FILE" "$PAYLOAD_FILE"

echo "==> Health check: $API_BASE_URL/healthz"
HEALTH_CODE="$(curl -sS -o "$OUT_DIR/health.json" -w "%{http_code}" "$API_BASE_URL/healthz")"
if [[ "$HEALTH_CODE" != "200" ]]; then
  echo "Health check failed: HTTP $HEALTH_CODE" >&2
  cat "$OUT_DIR/health.json" >&2 || true
  exit 1
fi
cat "$OUT_DIR/health.json"
echo

echo "==> Support store status"
node - "$OUT_DIR/health.json" "$REQUIRE_DURABLE_SUPPORT_STORE" <<'EOF'
const fs = require('fs');
const [healthPath, requireDurable] = process.argv.slice(2);
const payload = JSON.parse(fs.readFileSync(healthPath, 'utf8'));
if (!payload.ok || !payload.supportData) {
  console.error('healthz payload is missing supportData');
  process.exit(1);
}
console.log(`support path: ${payload.supportData.absolutePath}`);
console.log(`support relative: ${payload.supportData.relativePath}`);
console.log(`support configuredPath: ${payload.supportData.configuredPath ?? '(default)'}`);
console.log(`support usingDefaultPath: ${payload.supportData.usingDefaultPath}`);
console.log(`support exists: ${payload.supportData.exists}`);
if (requireDurable === 'true' && payload.supportData.usingDefaultPath) {
  console.error('Support store still uses the default path. Point SUPPORT_DATA_DB_PATH at durable mounted storage.');
  process.exit(1);
}
EOF
echo

echo "==> Generate ZIP: $API_BASE_URL/api/v1/repositories/generate"
HTTP_CODE="$(curl -sS \
  -D "$HEADERS_FILE" \
  -o "$ZIP_FILE" \
  -w "%{http_code}" \
  -X POST "$API_BASE_URL/api/v1/repositories/generate" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @"$PAYLOAD_FILE")"

if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Generate failed: HTTP $HTTP_CODE" >&2
  cat "$ZIP_FILE" >&2 || true
  exit 1
fi

FILE_COUNT="$(awk -F': ' 'tolower($1)=="x-file-count" {gsub("\r","",$2);print $2}' "$HEADERS_FILE" | tail -n1)"
REQ_ID="$(awk -F': ' 'tolower($1)=="x-request-id" {gsub("\r","",$2);print $2}' "$HEADERS_FILE" | tail -n1)"
SIZE_BYTES="$(wc -c < "$ZIP_FILE" | tr -d ' ')"

echo "Request ID: ${REQ_ID:-N/A}"
echo "X-File-Count: ${FILE_COUNT:-N/A}"
echo "ZIP bytes: $SIZE_BYTES"
echo "ZIP path: $ZIP_FILE"

if command -v unzip >/dev/null 2>&1; then
  echo "==> ZIP entries"
  unzip -l "$ZIP_FILE"
fi

if [[ "$SKIP_SUPPORT_READS" != "true" ]]; then
  echo "==> Support feedback list"
  FEEDBACK_CODE="$(curl -sS \
    -o "$OUT_DIR/support-feedback.json" \
    -w "%{http_code}" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    "$API_BASE_URL/api/v1/support/feedback?limit=1")"
  if [[ "$FEEDBACK_CODE" != "200" ]]; then
    echo "Support feedback read failed: HTTP $FEEDBACK_CODE" >&2
    cat "$OUT_DIR/support-feedback.json" >&2 || true
    exit 1
  fi
  cat "$OUT_DIR/support-feedback.json"
  echo

  echo "==> Support audit list"
  AUDIT_CODE="$(curl -sS \
    -o "$OUT_DIR/support-audit.json" \
    -w "%{http_code}" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    "$API_BASE_URL/api/v1/support/audit?limit=1")"
  if [[ "$AUDIT_CODE" != "200" ]]; then
    echo "Support audit read failed: HTTP $AUDIT_CODE" >&2
    cat "$OUT_DIR/support-audit.json" >&2 || true
    exit 1
  fi
  cat "$OUT_DIR/support-audit.json"
  echo
fi
