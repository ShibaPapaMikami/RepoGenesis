# VERCEL_AUTH_BYPASS_RUNBOOK.md

## Purpose

Vercel Authentication を有効に戻したあとも、deployed smoke と運用確認を止めずに回せるようにする。

対象:
- `https://repo-genesis-omega.vercel.app`
- deploy smoke (`smoke:deploy`)
- upstream + app smoke (`scripts/smoke-deployed-stack.sh`)

## When To Use

- 公開確認は終わったが、production deploy を再び Vercel Authentication で保護したい時
- GitHub Actions や手元の CLI から protected deployment に対して smoke を通したい時

## Baseline

- stable domain: `https://repo-genesis-omega.vercel.app`
- Render API: `https://repogenesis-api.onrender.com`
- app 側 smoke:

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis/app
APP_URL=https://repo-genesis-omega.vercel.app npm run smoke:deploy
```

## Setup

1. Vercel project `repo-genesis` を開く
2. `Settings -> Deployment Protection`
3. `Protection Bypass for Automation`
4. 既存 bypass を使うか、新しく 1 つ作る
5. bypass value を安全な secret manager に保存する

推奨の保存先:
- GitHub Actions secret: `DEPLOY_SMOKE_AUTH_TOKEN`
- 必要ならローカル `.env` ではなく password manager

## How To Verify

### 1. Protected deployment の smoke

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis/app
APP_URL=https://repo-genesis-omega.vercel.app \
DEPLOY_SMOKE_AUTH_TOKEN=<bypass-token> \
npm run smoke:deploy
```

### 2. Upstream + app をまとめて確認

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis
APP_URL=https://repo-genesis-omega.vercel.app \
API_BASE_URL=https://repogenesis-api.onrender.com \
DEPLOY_SMOKE_AUTH_TOKEN=<bypass-token> \
bash scripts/smoke-deployed-stack.sh
```

## GitHub Actions

以下を stable domain に固定しておく:
- `DEPLOY_SMOKE_APP_URL=https://repo-genesis-omega.vercel.app`
- `DEPLOY_SMOKE_API_BASE_URL=https://repogenesis-api.onrender.com`
- `DEPLOY_SMOKE_AUTH_TOKEN=<bypass-token>`

対象 workflow:
- `.github/workflows/deployed-smoke.yml`
- `.github/workflows/stack-health.yml`

## Exit Criteria

- Vercel Authentication を有効にしても `smoke:deploy` が継続して通る
- `scripts/smoke-deployed-stack.sh` が protected deployment に対しても通る
- support viewer は stable domain でログインできる

## Notes

- bypass は automation 用だけに使い、人間の通常アクセス導線には使わない
- bypass token を更新したら GitHub Actions secrets も同時に更新する
