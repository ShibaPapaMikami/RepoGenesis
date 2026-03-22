# VERCEL_DEPLOY.md

## Purpose

`app/` を Vercel で公開し、`generator` orchestration API を gugenka セッション認証で保護して、Gugenka スタッフのみに生成を許可する。

## Architecture (Recommended)

1. Frontend: Vercel (`app/`, Vite static)
2. Orchestration API: Node 実行環境（Vercel Functions または Render/Railway）
3. Auth: `AUTH_PROVIDER=gugenka` + `NEXTAUTH_SECRET`
4. Access control: `AUTH_ALLOWED_DOMAINS=gugenka.jp` を基本にし、必要時のみ `AUTH_ALLOWED_EMAILS` を併用

## 1. Deploy app to Vercel

Project settings:
- Framework preset: `Vite`
- Root directory: `app`
- Build command: `npm run build`
- Output directory: `dist`

Environment variables:
- `VITE_ORCHESTRATION_API_URL=/api/orchestration`
- `ORCHESTRATION_API_URL=https://<your-api-domain>` (Vercel server-side env for BFF proxy)

Result:
- UI から手動 Bearer 入力をなくし、同一オリジン(`/api/orchestration`)経由で API 呼び出し

## 2. Deploy orchestration API

推奨: repo root の [`render.yaml`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/render.yaml) を Blueprint として同期し、orchestration API と persistent disk を一緒に作る。

Blueprint baseline:
- service name: `repogenesis-orchestration-api`
- runtime: `node`
- root directory: `generator`
- plan: `starter` (disk が必要なため `free` は不可)
- health check: `/healthz`
- disk mount: `/var/data/repogenesis`
- fixed envs:
  - `AUTH_PROVIDER=gugenka`
  - `AUTH_ALLOWED_DOMAINS=gugenka.jp`
  - `SESSION_AUDIENCE=repogenesis`
  - `SUPPORT_DATA_DB_PATH=/var/data/repogenesis/support-data.sqlite`
- dashboard で投入する secrets (`sync: false`):
  - `NEXTAUTH_SECRET`
  - `CORS_ALLOW_ORIGIN`

Render 側の手順:
1. Render Dashboard で Blueprint を新規作成し、repo root の `render.yaml` を同期
2. `NEXTAUTH_SECRET` と `CORS_ALLOW_ORIGIN=https://<your-vercel-domain>` を入力
3. deploy 完了後、Render service URL を控える
4. Vercel project `app` に `ORCHESTRATION_API_URL=https://<your-render-domain>` を追加

Blueprint を使わず手動で起動するなら、`generator` でビルド済みの API を起動:

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis/generator
npm run build
AUTH_PROVIDER=gugenka \
NEXTAUTH_SECRET=<secret> \
SESSION_AUDIENCE=repogenesis \
CORS_ALLOW_ORIGIN=https://<your-vercel-domain> \
SUPPORT_DATA_DB_PATH=/var/data/repogenesis/support-data.sqlite \
npm run start:api
```

推奨:
- `AUTH_ALLOWED_DOMAINS=gugenka.jp` を基本にする
- 例外ユーザーのみ `AUTH_ALLOWED_EMAILS` を併用する
- `CORS_ALLOW_ORIGIN` は単一の本番ドメインに固定
- `SUPPORT_DATA_DB_PATH` は container filesystem ではなく mounted storage / durable volume に向ける
- `node:sqlite` を使うため Node 22.17+ を使う（`render.yaml` は `NODE_VERSION=22.17.0` を固定）

## 3. Smoke checks (before go-live)

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis/generator
REQUIRE_DURABLE_SUPPORT_STORE=true \
npm run smoke:api
```

本番では、cookie session での E2E も必須:
1. ログイン済みブラウザで app を開く
2. `Generate Repository` 実行
3. ZIP ダウンロード成功を確認
4. ZIP 内に `docs/AI_TOOLING.md` と runbook bundle が含まれることを確認
5. support panel で feedback / generation audit が読めることを確認

`GET /healthz` の確認ポイント:
- `supportData.absolutePath` が mounted storage 配下になっている
- `supportData.usingDefaultPath` が `false`
- `supportData.exists` は write 前は `false` でもよいが、feedback 送信か ZIP 生成後は `true` になる

app 側の deploy smoke:

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis/app
APP_URL=https://<your-vercel-domain> npm run smoke:deploy
```

upstream と Vercel をまとめて確認するなら:

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis
APP_URL=https://<your-vercel-domain> \
API_BASE_URL=https://<your-render-domain> \
bash scripts/smoke-deployed-stack.sh
```

GitHub Actions で deploy 後に同じ smoke を回す場合:
- workflow: `[.github/workflows/deployed-smoke.yml](/Users/masafumimikami/Documents/WebApp/RepoGenesis/.github/workflows/deployed-smoke.yml)`
- required secrets:
  - `DEPLOY_SMOKE_APP_URL`
  - `DEPLOY_SMOKE_API_BASE_URL`
  - `DEPLOY_SMOKE_AUTH_TOKEN`
- optional vars:
  - `DEPLOY_SMOKE_REQUIRE_DURABLE_SUPPORT_STORE`
  - `DEPLOY_SMOKE_SKIP_SUPPORT_READS`
- manual dispatch に加えて、GitHub Deployment の `production` / `success` status でも起動する

継続監視と failure alert を追加する場合:
- workflow: `[.github/workflows/stack-health.yml](/Users/masafumimikami/Documents/WebApp/RepoGenesis/.github/workflows/stack-health.yml)`
- trigger:
  - 毎時 `23` 分 UTC の scheduled run
  - manual dispatch
- secrets / vars は deployed smoke と同じものを再利用する
- failure 時は `Deployed stack health failing` issue を自動で起票/更新する
- success 時は同 issue を自動で close する

support panel の UI まで deployed で確認するなら:

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis/app
APP_URL=https://<your-vercel-domain> \
REMOTE_SESSION_COOKIE_VALUE=<__session-cookie> \
REMOTE_SESSION_EMAIL=<your@gugenka.jp> \
npm run test:e2e:remote-support
```

必要に応じて:
- `REMOTE_SESSION_COOKIE_NAME` (default: `__session`)
- `EXPECT_SUPPORT_DATA=true`

期待値:
- `/api/orchestration/repositories/generate` は `500` ではなく `401/403/400/422` のいずれか
- `/api/orchestration/support/feedback` と `/api/orchestration/support/audit` も `500` ではない
- `500 ORCHESTRATION_API_URL is not configured` が出たら、Vercel server env が未設定
- wrapper script は upstream `healthz` / durable-support check と app smoke を連続で走らせる

## Local Admin Mode (for localhost-only support/debug)

localhost で same-origin auth / support debug path を触る場合は、明示的に local admin mode を有効にする。

```bash
LOCAL_ADMIN_MODE=enabled
```

対象:
- `/api/auth/me`
- `/api/auth/session`
- `/api/auth/logout`
- `/api/orchestration/support/feedback`
- `/api/orchestration/support/audit`

ルール:
- loopback host (`localhost`, `127.0.0.1`, `::1`) では `LOCAL_ADMIN_MODE=enabled` がないと `403`
- public production / preview traffic には適用しない

今回の current blocker:
- linked Vercel project `app` の production env は空だった
- 先に Render Blueprint を同期して upstream URL を作り、その後で `ORCHESTRATION_API_URL` を Vercel に入れる

## 4. Data retention policy

生成処理では以下を永続化しない:
- 入力 `ProjectSpec` 本文
- 生成 ZIP 本体

保存されるもの:
- `SUPPORT_DATA_DB_PATH` 上の SQLite support store に入る generation audit / feedback metadata

運用補助:
- `GET /api/v1/support/feedback`
- `GET /api/v1/support/audit`
- いずれも generate 権限と同じ auth 境界で保護された read-only endpoint

運用ルール:
- 監査ログは短期保持（例: 7〜30日）
- 個人情報/機密値をログに追加しない
- `SUPPORT_DATA_DB_PATH` は durable volume に向ける

## 5. Failure point to avoid

「BFF upstream 未設定のまま本番公開」が最大の運用リスク。
公開前に `VITE_ORCHESTRATION_API_URL=/api/orchestration` と server-side `ORCHESTRATION_API_URL` の両方を確認すること。

## 6. Timeout triage

UI で次のような失敗が出た場合:

- `ZIP生成がタイムアウトしました。APIの再デプロイ状態または生成内容を確認してください。`
- `request id: bff-...`

意味:

- Vercel BFF は request id を発行できている
- ただし upstream(Render 側) は 45 秒以内に ZIP 応答を返せなかった
- UI 側の追跡は機能していて、調査対象は BFF より upstream 側に寄っている

確認手順:

1. UI に出た `request id` を控える
2. Vercel 側で同じ `bff-...` を確認する
3. Render 側ログで `generate:start`, `generate:failure`, `generate:success` を `requestId=<same id>` で検索する
4. Render 側に該当ログがない、または古い build のままなら `Deploy latest commit`
5. 再試行して、成功か、少なくとも同じ request id で相関できることを確認する

期待ログ例:

- Vercel BFF: `X-Request-Id: bff-...`
- Render start: `[generate:start] requestId=bff-...`
- Render failure: `[generate:failure] requestId=bff-... status=...`
- Render success: `[generate:success] requestId=bff-... fileCount=...`

備考:

- `bff-...` が UI に出ていれば、timeout 時の追跡改善は反映済み
- timeout 自体の解消には Render 再デプロイか生成時間短縮が別途必要
