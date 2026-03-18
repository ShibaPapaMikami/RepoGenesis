# RepoGenesis Web (`app/`)

RepoGenesis の公開向け Web wizard。AI との相談結果を貼り付けて draft を作り、必要な調整だけ行って starter repo の ZIP を生成する。

主な機能:

1. 相談結果の貼り付けから draft 作成
2. step-by-step の詳細調整と最終確認
3. `project_spec.json` の内部生成
4. local / remote ZIP 生成
5. Skill（スキル）の選択と remote ZIP への同梱

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

## E2E テスト

```bash
npm run test:e2e
```

検証内容:
- AI-first wizard の基本導線
- 相談の種類ごとの draft 化
- `draft` 生成と詳細調整への反映
- JSON プレビューの必須形状
- テストモードと reset 導線

補足:
- `playwright.config.ts` が Vite dev server (`npm run dev`) を自動起動する
- 生成物は `app/test-results/` に出るため Git 管理対象外
- GitHub Actions の `CI` でも `build -> test:contract -> test:e2e` を実行する

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
echo 'VITE_ENABLE_MANUAL_BEARER_UI=true' >> .env
npm run dev
```

- `VITE_REMOTE_AUTH_MODE=manual_bearer`: ローカル開発時、または `VITE_ENABLE_MANUAL_BEARER_UI=true` を明示したときだけ UI に `API Token (Bearer)` 入力欄が表示される
- `VITE_REMOTE_AUTH_MODE=cookie_session`: 手動トークン入力なし。`/api/orchestration` プロキシ経由で API を呼ぶ
- 本番 UI では `manual_bearer` 入力欄を出さない前提。production deploy は `cookie_session` を使う
- `VITE_RELEASE_VERSION`: UI 上に表示するリリースラベル（例: `v0.1.0`）
- `cookie_session` では追加で以下が必要:
  - Vercel: `ORCHESTRATION_API_URL`, `NEXTAUTH_SECRET`, `SESSION_AUDIENCE`
  - Vercel client: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
  - Render と Vercel の `NEXTAUTH_SECRET` / `SESSION_AUDIENCE` は一致必須
- `Generate Repository` は `POST /api/v1/repositories/generate` を呼ぶ
- レスポンスZIPをそのままダウンロードする
- 失敗時は `Download Error JSON` でエラー情報を共有可能
- フォーム下部の `Feedback` から bug/request を送信可能
- テストモードをオンにすると固定テスト文章と JSON 補助導線を表示できる

Cloudflare Pages 公開手順:
- `docs/CLOUDFLARE_PAGES_DEPLOY.md`
