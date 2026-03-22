# RepoGenesis

AI と相談しながら、プロジェクトの初期要件を starter repo の ZIP まで落とし込むためのツールです。

RepoGenesis は次の流れを 1 つの導線で扱います。

1. ChatGPT / Claude / Gemini などで相談内容を整理する
2. その結果を貼り付けて draft を作る
3. 必要な項目だけ調整する
4. ZIP を生成して、すぐ作業を始める

## 含まれるもの

- `app/`
  - 公開向けの Web wizard
  - AI-first の相談導線
  - draft 確認、詳細調整、ZIP 生成 UI
- `generator/`
  - `ProjectSpec` から repo 一式を生成する CLI / API コア
- `skills/registry/`
  - Codex / Claude Code / Gemini CLI 向けの curated Skill（スキル）定義

## いまの前提

- Web から local ZIP を作れます
- remote ZIP 生成にも対応しています
- 選択した Skill（スキル）は remote ZIP に同梱できます
- Skill（スキル）はアプリ機能ではなく、生成後に AI と一緒に作業する時の補助ガイドです
- 生成される starter docs は provider-neutral な `docs/AI_TOOLING.md` を持ち、`AGENTS.md` / `CLAUDE.md` / `GEMINI.md` は薄い wrapper として扱います

## ローカル起動

### Web

```bash
cd app
npm install
cp .env.example .env
npm run dev
```

### Generator

```bash
cd generator
npm install
npm run build
```

## テスト

### Web

```bash
cd app
npm run check:generator-bundle-sync
npm run check:generated-output-compat
npm run test:contract
npm run build
```

### Generator

```bash
cd generator
npm test -- --run
npm run build
```

### Workflow / Smoke Config

```bash
bash scripts/check-workflows.sh
```

## Deployed Smoke

```bash
cd app
APP_URL=https://<your-vercel-domain> npm run smoke:deploy
```

upstream と app をまとめて確認する場合:

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis
APP_URL=https://<your-vercel-domain> \
API_BASE_URL=https://<your-render-domain> \
bash scripts/smoke-deployed-stack.sh
```

support panel の deployed 確認は [docs/VERCEL_DEPLOY.md](/Users/masafumimikami/Documents/WebApp/RepoGenesis/docs/VERCEL_DEPLOY.md) を参照してください。

GitHub Actions でも deployed smoke を回せます。
- workflow: `[.github/workflows/deployed-smoke.yml](/Users/masafumimikami/Documents/WebApp/RepoGenesis/.github/workflows/deployed-smoke.yml)`
- required secrets:
  - `DEPLOY_SMOKE_APP_URL`
  - `DEPLOY_SMOKE_API_BASE_URL`
  - `DEPLOY_SMOKE_AUTH_TOKEN`
- optional vars:
  - `DEPLOY_SMOKE_REQUIRE_DURABLE_SUPPORT_STORE` (`true` / `false`)
  - `DEPLOY_SMOKE_SKIP_SUPPORT_READS` (`true` / `false`)

継続監視と alert は `[.github/workflows/stack-health.yml](/Users/masafumimikami/Documents/WebApp/RepoGenesis/.github/workflows/stack-health.yml)` で回します。
- 毎時 `23` 分 UTC に `smoke:api + smoke:deploy` を実行
- failure 時は `Deployed stack health failing` issue を自動で起票/更新
- success 時は該当 issue を自動で close

## 公開向けの見どころ

- 相談メモから draft を作る AI-first wizard
- 非エンジニアでも進めやすい step-by-step UI
- Skill（スキル）の選択と ZIP 同梱
- CLI / Web で共通の generator コア
- Render Blueprint / support-store / deployed smoke まで含めた hardening ベースライン

## 補足

- `test/TestProject/` はローカル確認用の非追跡サンプル置き場です
- 詳しい現状は `docs/ROADMAP_STATUS.md` と `docs/ACTIVE_CONTEXT.md` を参照してください
