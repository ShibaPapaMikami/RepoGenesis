#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

APP_URL="${APP_URL:-}"
API_BASE_URL="${API_BASE_URL:-}"
AUTH_TOKEN="${AUTH_TOKEN:-dev-token}"
SPEC_FILE="${SPEC_FILE:-$ROOT_DIR/generator/tests/fixtures/test_brief_app_export.json}"
REQUIRE_DURABLE_SUPPORT_STORE="${REQUIRE_DURABLE_SUPPORT_STORE:-true}"
SKIP_SUPPORT_READS="${SKIP_SUPPORT_READS:-false}"

if [[ -z "$APP_URL" ]]; then
  echo "APP_URL is required. Example: APP_URL=https://app-eight-liart-88.vercel.app" >&2
  exit 1
fi

if [[ -z "$API_BASE_URL" ]]; then
  echo "API_BASE_URL is required. Example: API_BASE_URL=https://repogenesis-orchestration-api.onrender.com" >&2
  exit 1
fi

echo "==> Upstream orchestration smoke"
(
  cd "$ROOT_DIR/generator"
  API_BASE_URL="$API_BASE_URL" \
  AUTH_TOKEN="$AUTH_TOKEN" \
  SPEC_FILE="$SPEC_FILE" \
  REQUIRE_DURABLE_SUPPORT_STORE="$REQUIRE_DURABLE_SUPPORT_STORE" \
  SKIP_SUPPORT_READS="$SKIP_SUPPORT_READS" \
  npm run smoke:api
)

echo
echo "==> Vercel app smoke"
(
  cd "$ROOT_DIR/app"
  APP_URL="$APP_URL" \
  npm run smoke:deploy
)
