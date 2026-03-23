# RepoGenesis Web (`app/`)

RepoGenesis の公開向け Web wizard。AI との相談結果を貼り付けて draft を作り、必要な調整だけ行って starter repo の ZIP を生成する。

主な機能:

1. 相談結果の貼り付けから draft 作成
2. step-by-step の詳細調整と最終確認
3. `project_spec.json` の内部生成
4. local / remote ZIP 生成
5. Skill（スキル）の選択と remote ZIP への同梱
6. draft / 最終確認から外部AI向けの要件整理プロンプトを copy / export
7. ChatGPT / Claude / Gemini 向けの guided prompt template 切り替え
8. AI recommendation の採用 / 上書き状態を options step で明示し、そのまま review に持ち越し
9. draft / review に「相談に使ったAI」を metadata として表示

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

vendored generator bundle の同期確認:

```bash
npm run check:generator-bundle-sync
npm run check:generated-output-compat
```

generator を更新した後は:

```bash
npm run sync:generator-bundle
npm run check:generator-bundle-sync
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
- AI recommendation の採用 / 上書き
- `draft` 生成と詳細調整への反映
- JSON プレビューの必須形状
- テストモードと reset 導線

補足:
- `playwright.config.ts` が Vite dev server (`npm run dev`) を自動起動する
- 生成物は `app/test-results/` に出るため Git 管理対象外
- GitHub Actions の `CI` でも `build -> test:contract -> test:e2e` を実行する

## Deployed Smoke

```bash
APP_URL=https://app-eight-liart-88.vercel.app npm run smoke:deploy
```

確認内容:
- `/` が RepoGenesis shell を返す
- `/api/orchestration/repositories/generate` が `500` ではなく auth / validation 系 status を返す
- `/api/orchestration/support/feedback` と `/api/orchestration/support/audit` が `500` ではなく動作する

用途:
- public deploy が local-only build になっていないか
- BFF の `ORCHESTRATION_API_URL` が未設定で壊れていないか
- support panel 向けの same-origin proxy が生きているか

deployed support panel の UI 確認:

```bash
APP_URL=https://app-eight-liart-88.vercel.app \
REMOTE_SESSION_COOKIE_VALUE=<__session-cookie> \
REMOTE_SESSION_EMAIL=<your@gugenka.jp> \
npm run test:e2e:remote-support
```

補足:
- `APP_URL` を渡すと Playwright は local dev server を起動せず、その deploy に対して実行する
- `REMOTE_SESSION_COOKIE_NAME` は省略時 `__session`
- `EXPECT_SUPPORT_DATA=true` を付けると、空表示ではなく少なくとも1件の support item が見えることまで確認する

## ZIP 生成フロー

`Generate Repository (ZIP)` は `generator/dist/generateFromSpec.js` から作った vendor bundle を `app/src/vendor/generateFromSpec.js` として参照し、生成ファイルを ZIP 化してダウンロードする。

- バックエンド不要
- 生成ロジックの再実装なし（単一実装）
- generator 側を更新したら `npm run sync:generator-bundle` で vendor bundle を更新する
- CI でも `npm run check:generator-bundle-sync` と `npm run check:generated-output-compat` を実行し、generator と vendor bundle のズレや output 差分を検出する
- ZIP 検証手順: `docs/ZIP_MANUAL_CHECKLIST.md`

## Remote Generation Mode (Web Service)

`VITE_ORCHESTRATION_API_URL` を設定すると、ZIP 生成は orchestration API 経由に切り替わる。

```bash
cp .env.example .env
echo 'VITE_ORCHESTRATION_API_URL=/api/orchestration' >> .env
npm run dev
```

- remote mode は `cookie_session` 固定。UI から Bearer トークンを手入力する経路は持たない
- app は `VITE_ORCHESTRATION_API_URL` をそのまま呼び、公開 deploy では `/api/orchestration` を指定する
- `VITE_RELEASE_VERSION`: UI 上に表示するリリースラベル（例: `v0.1.0`）
- remote mode では追加で以下が必要:
  - Vercel: `ORCHESTRATION_API_URL`, `NEXTAUTH_SECRET`, `SESSION_AUDIENCE`
  - Vercel client: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`
  - Render と Vercel の `NEXTAUTH_SECRET` / `SESSION_AUDIENCE` は一致必須
- `Generate Repository` は `POST /api/v1/repositories/generate` を呼ぶ
- remote mode では同じ BFF 経由で read-only support panel も有効になる
  - `GET /api/orchestration/support/feedback`
  - `GET /api/orchestration/support/audit`
  - backend 側の `SUPPORT_DATA_DB_PATH` に保存された feedback / generation audit を internal UI で確認できる
  - UI に panel を出すのは `VITE_SUPPORT_ALLOWED_EMAILS` または `VITE_SUPPORT_ALLOWED_DOMAINS` に一致する support viewer だけ
- レスポンスZIPをそのままダウンロードする
- 失敗時は `Download Error JSON` でエラー情報を共有可能
- フォーム下部の `Feedback` から bug/request を送信可能
- テストモードをオンにすると固定テスト文章と JSON 補助導線を表示できる

### Local Admin Mode

same-origin の auth / support debug path を localhost で使う場合は、明示的に local admin mode を有効にする。

```bash
echo 'LOCAL_ADMIN_MODE=enabled' >> .env
```

- 対象:
  - `/api/auth/me`
  - `/api/auth/session`
  - `/api/auth/logout`
  - `/api/orchestration/support/feedback`
  - `/api/orchestration/support/audit`
- loopback host (`localhost`, `127.0.0.1`, `::1`) では `LOCAL_ADMIN_MODE=enabled` がないと `403` を返す
- production / preview の public path には影響しない

### Support Viewer Gating

運用ログは一般ユーザー向けではなく、support / admin viewer だけに表示する。

```bash
echo 'VITE_SUPPORT_ALLOWED_EMAILS=masafumi@gugenka.jp' >> .env
# または
echo 'VITE_SUPPORT_ALLOWED_DOMAINS=ops.example.com' >> .env
```

- どちらも未設定なら、support panel は UI に表示しない
- `VITE_SUPPORT_ALLOWED_EMAILS` はカンマ区切り
- `VITE_SUPPORT_ALLOWED_DOMAINS` は `user@domain` の domain 部分をカンマ区切りで指定する

Cloudflare Pages 公開手順:
- `docs/CLOUDFLARE_PAGES_DEPLOY.md`
