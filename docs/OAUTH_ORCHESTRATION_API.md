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

## Endpoint (MVP)

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
- `422`: generation policy violation
- `500`: internal error

## Audit Log (Server Side)

保存対象（生成物には含めない）:
- `requestId`
- `userId`
- `timestamp`
- `result` (`success` / `failure`)
- `specVersion`
- `repoType`
- `fileCount`
- `errorCode` (失敗時)

保存先（MVP）:
- `generator/logs/orchestration-audit.log` (JSONL)

## Non-Goals

- 認証情報をテンプレート分岐に使用しない
- Web 専用の生成ロジックを追加しない
- CLI と Web で別の schema を運用しない
