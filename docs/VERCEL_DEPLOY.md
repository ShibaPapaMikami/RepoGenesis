# VERCEL_DEPLOY.md

## Purpose

`app/` を Vercel で公開し、`generator` orchestration API を gugenka セッション認証で保護して、Gugenka スタッフのみに生成を許可する。

## Architecture (Recommended)

1. Frontend: Vercel (`app/`, Vite static)
2. Orchestration API: Node 実行環境（Vercel Functions または Render/Railway）
3. Auth: `AUTH_PROVIDER=gugenka` + `NEXTAUTH_SECRET`
4. Access control: `AUTH_ALLOWED_EMAILS` または `@gugenka.co.jp` ドメイン制限

## 1. Deploy app to Vercel

Project settings:
- Framework preset: `Vite`
- Root directory: `app`
- Build command: `npm run build`
- Output directory: `dist`

Environment variables:
- `VITE_ORCHESTRATION_API_URL=https://<your-api-domain>`
- `VITE_REMOTE_AUTH_MODE=cookie_session`

Result:
- UI から手動 Bearer 入力をなくし、ブラウザセッションで API 呼び出し

## 2. Deploy orchestration API

`generator` でビルド済みの API を起動:

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis/generator
npm run build
AUTH_PROVIDER=gugenka \
NEXTAUTH_SECRET=<secret> \
SESSION_AUDIENCE=repogenesis \
CORS_ALLOW_ORIGIN=https://<your-vercel-domain> \
npm run start:api
```

推奨:
- `AUTH_ALLOWED_EMAILS` を併用して許可ユーザーを明示
- `CORS_ALLOW_ORIGIN` は単一の本番ドメインに固定

## 3. Smoke checks (before go-live)

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis/generator
npm run smoke:api
```

本番では、cookie session での E2E も必須:
1. ログイン済みブラウザで app を開く
2. `Generate Repository` 実行
3. ZIP ダウンロード成功を確認

## 4. Data retention policy

生成処理では以下を永続化しない:
- 入力 `ProjectSpec` 本文
- 生成 ZIP 本体

保存されるもの:
- `logs/orchestration-audit.log` のメタデータ（requestId, userId, specVersion, fileCount 等）

運用ルール:
- 監査ログは短期保持（例: 7〜30日）
- 個人情報/機密値をログに追加しない

## 5. Failure point to avoid

「手動Bearer入力のまま本番公開」が最大の運用リスク。
公開前に `VITE_REMOTE_AUTH_MODE=cookie_session` に固定し、Bearer入力を無効化すること。
