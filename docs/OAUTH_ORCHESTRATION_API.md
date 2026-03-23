# OAUTH_ORCHESTRATION_API.md

## Purpose

OAuth 統合時に、認証境界と生成ロジック境界を混ぜないための最小 API 契約を定義する。

## Scope

- 対象: orchestration 層（validation + authorization + invoke）
- 非対象: `generateFromSpec` の仕様変更、テンプレート仕様変更

## Boundary Rules

1. 認証は `@gugenka/auth` で実施する。
2. orchestration 層は `ProjectSpec` を検証し、認可を通過した場合のみ `generateFromSpec` を呼ぶ。
3. auth 情報（userId, roles）は生成物内容に影響させない。
4. ローカル開発では `AUTH_PROVIDER=mock`、本番では `AUTH_PROVIDER=gugenka` を使用する。
5. `AUTH_PROVIDER=gugenka` では session JWT 検証に `NEXTAUTH_SECRET` と `SESSION_AUDIENCE` が必要。
6. 現在は `gugenka-auth` の server session 実装を vendor 取り込みで利用している。
7. `generate` は `repogenesis:generate`、support read は `repogenesis:support_read` を想定し、support read は専用 allowlist を optional に持てる。
8. production 相当環境 (`NODE_ENV=production` または `VERCEL_ENV=production`) では `AUTH_PROVIDER=mock` を許可しない。
9. production 相当環境では `GENERATE_REQUIRE_AUTH=false` を許可しない。
10. どうしても一時 override が必要な場合だけ、明示 env で一時的に許可する。

## Production Guard Rails

- `AUTH_PROVIDER=mock` を production で使いたい場合:
  - `ALLOW_INSECURE_AUTH_IN_PRODUCTION=true`
- `GENERATE_REQUIRE_AUTH=false` を production で使いたい場合:
  - `ALLOW_INSECURE_GENERATE_WITHOUT_AUTH_IN_PRODUCTION=true`

ルール:
- どちらも通常運用では使わない。
- 一時調査が終わったら必ず削除する。
- deployed smoke / health check は override が残っていない前提で運用する。

## Endpoint (MVP)

### `GET /healthz`

Response (`200`):
```json
{
  "ok": true,
  "supportData": {
    "absolutePath": "/var/data/repogenesis/support-data.sqlite",
    "relativePath": "../../var/data/repogenesis/support-data.sqlite",
    "directoryPath": "/var/data/repogenesis",
    "configuredPath": "/var/data/repogenesis/support-data.sqlite",
    "usingDefaultPath": false,
    "exists": true
  }
}
```

Rules:
- orchestration API の liveness に加えて support store の path 解決状態を返す
- `usingDefaultPath=true` は production では警告扱い
- `exists=false` は初回 write 前なら許容

### `POST /api/v1/repositories/generate`

Request headers:
- `Authorization: Bearer <token>` (optional when session cookie is available)
- `Cookie: __session=<token>` (or next-auth session cookie)
- `Content-Type: application/json`

Request body:
```json
{
  "spec": {
    "specVersion": "1.0"
  },
  "output": {
    "format": "zip"
  },
  "meta": {
    "requestId": "optional-client-id"
  }
}
```

Rules:
- `spec` は `projectSpecSchema` で検証する。
- `output.format` は当面 `zip` のみ。
- `specVersion` 未対応値は `400`。

Success response (`200`):
- body: ZIP binary (`Content-Type: application/zip`)
- headers:
  - `Content-Disposition: attachment; filename="<slug>.zip"`
  - `X-Request-Id`
  - `X-Spec-Version`
  - `X-File-Count`

Error response:
- `400`: invalid spec / unsupported specVersion
- `401`: unauthenticated
- `403`: unauthorized
- `429`: rate limited
- `422`: generation policy violation
- `500`: internal error

Rate limit baseline:
- `generate`: `GENERATE_RATE_LIMIT_MAX` / `GENERATE_RATE_LIMIT_WINDOW_MS`
- `feedback`: `FEEDBACK_RATE_LIMIT_MAX` / `FEEDBACK_RATE_LIMIT_WINDOW_MS`
- `support read`: `SUPPORT_READ_RATE_LIMIT_MAX` / `SUPPORT_READ_RATE_LIMIT_WINDOW_MS`
- key は bearer token -> session cookie -> forwarded IP の順で解決し、内部では hash 化して扱う
- response headers:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
  - `Retry-After` (`429` のとき)

### `GET /api/v1/support/feedback`

Query:
- `type=bug|request` (optional)
- `limit=1..100` (optional, default `20`)

Rules:
- `repogenesis:support_read` または `repogenesis:generate` を持つユーザーに限定する
- feedback 本文と metadata を read-only で返す
- app 側では same-origin BFF (`/api/orchestration/support/feedback`) から参照する

### `GET /api/v1/support/audit`

Query:
- `limit=1..100` (optional, default `20`)

Rules:
- `repogenesis:support_read` または `repogenesis:generate` を持つユーザーに限定する
- generation audit metadata を read-only で返す
- app 側では same-origin BFF (`/api/orchestration/support/audit`) から参照する

## Audit Log (Server Side)

保存対象（生成物には含めない）:
- `requestId`
- `userId`
- `timestamp`
- `result` (`success` / `failure`)
- `specVersion`
- `repoType`
- `fileCount`
- `projectSlug`
- `artifactFilename`
- `authProvider`
- `authMode`
- `selectedSkillIds`
- `errorCode` (失敗時)

保存先（current baseline）:
- `SUPPORT_DATA_DB_PATH` で指定した SQLite support store
- 未指定時は `generator/data/support-data.sqlite`

## Non-Goals

- 認証情報をテンプレート分岐に使用しない
- Web 専用の生成ロジックを追加しない
- CLI と Web で別の schema を運用しない
