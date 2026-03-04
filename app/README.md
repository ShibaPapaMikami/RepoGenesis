# RepoGenesis Web Form (`app/`)

RepoGenesis の Web フォーム。`ProjectSpec` を生成し、以下の2つを行える。

1. `project_spec.json` のダウンロード
2. `Generate Repository (ZIP)` によるブラウザ内リポジトリ生成

## 開発

```bash
cd app
npm install
cp .env.example .env
npm run dev
```

## ビルド

```bash
npm run build
```

## 契約テスト

```bash
npm run test:contract
```

検証内容:
- `specVersion` の固定 (`1.0`)
- `ProjectSpec` 形状の基本マッピング
- JSON 出力の先頭キー順 (`specVersion`)
- ダウンロードファイル名 (`project_spec.json`)

## ZIP 生成フロー

`Generate Repository (ZIP)` は `app` から `generator/src/generateFromSpec.ts` を直接呼び出し、生成ファイルを ZIP 化してダウンロードする。

- バックエンド不要
- 生成ロジックの再実装なし（単一実装）
- ZIP 検証手順: `docs/ZIP_MANUAL_CHECKLIST.md`

## Remote Generation Mode (Web Service)

`VITE_ORCHESTRATION_API_URL` を設定すると、ZIP 生成は orchestration API 経由に切り替わる。

```bash
cp .env.example .env
echo 'VITE_ORCHESTRATION_API_URL=http://127.0.0.1:8002' >> .env
echo 'VITE_REMOTE_AUTH_MODE=manual_bearer' >> .env
npm run dev
```

- `VITE_REMOTE_AUTH_MODE=manual_bearer`（default）: UI に `API Token (Bearer)` 入力欄が表示される
- `VITE_REMOTE_AUTH_MODE=cookie_session`: 手動トークン入力なし。ブラウザのセッションクッキーで API を呼ぶ
- `Generate Repository` は `POST /api/v1/repositories/generate` を呼ぶ
- レスポンスZIPをそのままダウンロードする

Cloudflare Pages 公開手順:
- `docs/CLOUDFLARE_PAGES_DEPLOY.md`
