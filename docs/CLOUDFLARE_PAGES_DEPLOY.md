# CLOUDFLARE_PAGES_DEPLOY.md

## Purpose

`app/` を Cloudflare Pages で公開し、remote 生成モード（orchestration API 経由）を有効化する。

Vercel 公開を選ぶ場合は `docs/VERCEL_DEPLOY.md` を参照。

## 1. Cloudflare Pages (Web Form)

Project settings:
- Framework preset: `Vite`
- Root directory: `app`
- Build command: `npm run build`
- Build output directory: `dist`

Environment variables (Pages):
- `VITE_ORCHESTRATION_API_URL` = `https://<your-api-domain>`

Result:
- `Generate Repository (ZIP / remote)` が API を呼び出す

## 2. Orchestration API (Backend)

Run `generator` API on a reachable host:

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis/generator
npm run build
AUTH_PROVIDER=gugenka \
NEXTAUTH_SECRET=<secret> \
SESSION_AUDIENCE=repogenesis \
CORS_ALLOW_ORIGIN=https://<your-pages-domain> \
npm run start:api
```

Health check:
```bash
curl -i http://127.0.0.1:8002/healthz
```

Smoke check (ZIP endpoint):
```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis/generator
npm run smoke:api
```

## 3. CORS

`generator/src/orchestration/server.ts` は以下を返す:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Headers: Authorization, Content-Type`
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Expose-Headers: Content-Disposition, X-Request-Id, X-Spec-Version, X-File-Count`

本番では `CORS_ALLOW_ORIGIN` を Pages の本番ドメインに固定すること。

## 4. Browser Operation

1. Pages URL を開く
2. `API Token (Bearer)` に token を入力
3. `Generate Repository (ZIP / remote)` を実行
4. ダウンロードされた ZIP と `X-File-Count` を確認

## 5. Troubleshooting

- `401`: token 無効 / `NEXTAUTH_SECRET` 不一致
- `403`: 認可ロール不足（`AUTH_ALLOWED_DOMAINS` / `AUTH_ALLOWED_EMAILS` 制約含む）
- CORS エラー: `CORS_ALLOW_ORIGIN` を Pages ドメインに合わせる
