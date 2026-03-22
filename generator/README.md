# @gugenka/repogenesis

AI対応リポジトリ構造ジェネレータ。`ProjectSpec JSON` から `PROJECT.md`、tool-specific wrapper (`AGENTS.md` / `CLAUDE.md` / `GEMINI.md`)、planning docs、運用 runbook bundle を一括生成する。

## インストール（GitHub Packages）

### 1. 認証設定

プロジェクトルートまたはホームに `.npmrc` を作成:

```
@gugenka:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=<YOUR_GITHUB_PAT>
```

PAT は GitHub Settings > Developer settings > Personal access tokens で作成。スコープ: `read:packages`。

### 2. インストール

```bash
# グローバル
npm install -g @gugenka/repogenesis

# またはプロジェクトのdevDependency
npm install -D @gugenka/repogenesis
```

## 使い方

```bash
repogenesis --input <project_spec.json> --output <出力先> [--force]
repogenesis migrate-spec --input <legacy_or_spec.json> --output <project_spec.json> [--force]
repogenesis doctor --project <生成済みrepoのパス> [--registry ./skills/registry]
repogenesis skills list --registry ./skills/registry
repogenesis skills add --project ./repos/my-project --registry ./skills/registry --skill repo-readiness-review --provider claude_code
repogenesis skills status --project ./repos/my-project --registry ./skills/registry
repogenesis skills update --project ./repos/my-project --registry ./skills/registry --skill repo-readiness-review
repogenesis skills update --project ./repos/my-project --registry ./skills/registry --all
repogenesis skills remove --project ./repos/my-project --skill repo-readiness-review
```

| オプション | 必須 | 説明 |
|-----------|------|------|
| `--input <path>` | Yes | `ProjectSpec JSON` のパス |
| `--output <path>` | Yes | `generate` は出力先ディレクトリ、`migrate-spec` は出力 JSON ファイル |
| `--force` | No | 既存の出力ディレクトリを削除して再生成 |
| `migrate-spec --input <path> --output <path>` | No | legacy `projectBrief` または既存 `ProjectSpec` を canonical な `ProjectSpec` JSON に正規化 |
| `doctor --project <path>` | No | 生成済み repo の core files / tool wrappers / installed skill artifacts と planning docs / `.env.example` の整合を検査 |
| `doctor --project <path> --registry <path>` | No | 上記に加えて install 済み skill の registry drift (`update_available`, `missing_from_registry`) を warning として検出 |
| `skills list --registry <path>` | No | 選択可能な skill registry entry を一覧表示 |
| `skills add --project <path> --registry <path> --skill <id>` | No | provider-aware skill artifact を project へ copy + pin で導入 |
| `skills status --project <path> --registry <path>` | No | install 済み skill の version / registry 差分 / missing artifact を表示 |
| `skills update --project <path> --registry <path> --skill <id>` | No | install 済み skill を registry current version へ明示更新 |
| `skills update --project <path> --registry <path> --all` | No | outdated または missing artifact の install 済み skill を一括更新 |
| `skills remove --project <path> --skill <id>` | No | install 済み skill artifact と manifest entry を削除 |
| `--help` | No | ヘルプ表示 |
| `--version` | No | バージョン表示 |

## 入力仕様（ProjectSpec）

- `specVersion` は必須（現在は `1.0` のみサポート）
- `specVersion` がない旧 `projectBrief` は移行用として受理されるが、CLI で deprecation warning が出る
- `repogenesis migrate-spec` で legacy `projectBrief` を canonical な `ProjectSpec` へ事前移行できる
- 詳細ポリシー: [`docs/SPEC_VERSIONING.md`](../docs/SPEC_VERSIONING.md)

### 実行例

```bash
repogenesis --input ./my_project.json --output ./repos
repogenesis --input ./my_project.json --output ./repos --force
repogenesis migrate-spec --input ./legacy-project.json --output ./project_spec.json
repogenesis migrate-spec --input ./project_spec.json --output ./project_spec.json --force
repogenesis doctor --project ./repos/my-project
repogenesis doctor --project ./repos/my-project --registry ../skills/registry
repogenesis skills list --registry ../skills/registry
repogenesis skills add --project ./repos/my-project --registry ../skills/registry --skill repo-readiness-review --provider claude_code
repogenesis skills status --project ./repos/my-project --registry ../skills/registry
repogenesis skills update --project ./repos/my-project --registry ../skills/registry --skill repo-readiness-review
repogenesis skills update --project ./repos/my-project --registry ../skills/registry --all
repogenesis skills remove --project ./repos/my-project --skill repo-readiness-review
```

### 生成されるディレクトリ（single-repo）

```
repos/{slug}/
├── PROJECT.md
├── AGENTS.md        # when Codex is selected
├── CLAUDE.md        # when Claude Code is selected
├── GEMINI.md        # when Gemini CLI is selected
├── docs/
│   ├── ACTIVE_CONTEXT.md
│   ├── AI_TOOLING.md
│   ├── TECH_DECISIONS.md
│   ├── EXTERNAL_DEPENDENCIES.md
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── VERSIONING_STANDARD.md
│   ├── ADR/0000-template.md
│   └── runbooks/
│       ├── README.md
│       ├── production-bootstrap.md
│       ├── production-cutover.md
│       ├── production-checks.md
│       ├── rollback.md
│       ├── incident-response.md
│       └── skill-install.md
├── .repogenesis/
│   └── manifest.json
├── plans/template.md
├── prompts/restart.md
├── SECURITY.md
├── .env.example
├── skills/README.md
├── repogenesis.skills.json
└── .gitignore
```

補足:
- `docs/AI_TOOLING.md` が provider-neutral な AI tooling contract
- `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` は provider-specific overlay として生成される

## 暫定：npm link（ソースから直接使う場合）

```bash
cd generator
npm install
npm run build
npm link
repogenesis --help
```

解除: `npm unlink -g @gugenka/repogenesis`

## Skill installer notes

- `skills update` は auto-update ではなく、registry current version への明示更新です
- `doctor --registry` は install 済み skill の registry drift を warning として出します
- `skills status` は `up_to_date` / `update_available` / `missing_from_registry` を返し、missing artifact も warning として表示します
- `skills update --all` は clean な `up_to_date` を触らず、`update_available` または missing artifact の skill だけを更新・再同期します
- provider を省略した場合、現在 install 済み artifact provider を優先して再同期します
- 同じ version でも artifact を再同期し、warning を返します

## 開発

```bash
npm install
npm run build
npx vitest run     # テスト148件
npm run dev        # tsc --watch
```

## Orchestration API (MVP Skeleton)

```bash
npm run build
npm run start:api
```

Recommended production baseline:
- sync repo-root [`render.yaml`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/render.yaml) as a Render Blueprint
- keep `SUPPORT_DATA_DB_PATH` on the mounted disk path `/var/data/repogenesis/support-data.sqlite`
- use Node 22.17+ because the support store relies on `node:sqlite`
- `generator/tests/renderBlueprint.test.ts` keeps the Blueprint baseline aligned with the support-store contract

デフォルト: `http://127.0.0.1:8002/api/v1/repositories/generate`

- 認可トークン（暫定）:
  - `Bearer dev-token` → 許可
  - `Bearer forbidden-token` → 403
- OAuth 本実装は今後 `@gugenka/auth` に置き換える（境界のみ）。
- 成功時レスポンス: ZIP バイナリ（`Content-Type: application/zip`）
- 監査ログ: `generator/logs/orchestration-audit.log`（JSONL）
- フィードバック保存:
  - `POST /api/v1/feedback/bug`
  - `POST /api/v1/feedback/request`
  - どちらも `SUPPORT_DATA_DB_PATH` で指定した SQLite support store に保存
- 読み取り系 support API:
  - `GET /api/v1/support/feedback?type=bug|request&limit=20`
  - `GET /api/v1/support/audit?limit=20`
  - どちらも generate 権限と同じ auth 境界で保護
  - app の `cookie_session` internal support panel から read-only で参照できる
  - generation audit は `projectSlug` / `artifactFilename` / `authProvider` / `authMode` / `selectedSkillIds` も返す

環境変数:
- `AUTH_PROVIDER=mock` (default): `dev-token` / `forbidden-token` を利用
- `AUTH_PROVIDER=gugenka`: vendored `gugenka-auth` session verifier を利用
- `NEXTAUTH_SECRET`: gugenka session JWT 検証に必須
- `SESSION_AUDIENCE` (default: `repogenesis`)
- `AUTH_ALLOWED_DOMAINS` (optional, comma-separated, preferred for production)
- `AUTH_ALLOWED_EMAILS` (optional, comma-separated, for explicit exceptions)
- `SUPPORT_ALLOWED_DOMAINS` (optional, comma-separated)
- `SUPPORT_ALLOWED_EMAILS` (optional, comma-separated)
  - 未指定時は generate 側 allowlist をそのまま support read にも使う
  - 指定すると `repogenesis:support_read` 相当の read-only viewer を分離できる
- `CORS_ALLOW_ORIGIN` (本番は app 公開ドメインに固定)
- `GENERATE_REQUIRE_AUTH` (default: `true`)
  - `false` にすると ZIP生成APIの認証を一時的に無効化（検証用）
- `SUPPORT_DATA_DB_PATH` (default: `generator/data/support-data.sqlite`)
  - feedback / generation audit の保存先
  - 本番では durable volume 上の path を指定する
- `GENERATE_RATE_LIMIT_MAX` / `GENERATE_RATE_LIMIT_WINDOW_MS`
- `FEEDBACK_RATE_LIMIT_MAX` / `FEEDBACK_RATE_LIMIT_WINDOW_MS`
- `SUPPORT_READ_RATE_LIMIT_MAX` / `SUPPORT_READ_RATE_LIMIT_WINDOW_MS`
  - route 別の in-memory rate limit
  - key は bearer token -> session cookie -> forwarded IP の順

認証入力:
- `AUTH_PROVIDER=mock`: `Authorization: Bearer <token>` 必須
- `AUTH_PROVIDER=gugenka`: Bearer または session cookie を受理
  - cookie candidates: `__session`, `next-auth.session-token`, `__Secure-next-auth.session-token`

### API スモークテスト

```bash
# API起動後に実行
npm run smoke:api
```

任意の上書き:

```bash
API_BASE_URL=http://127.0.0.1:8002 \
AUTH_TOKEN=dev-token \
SPEC_FILE=./tests/fixtures/test_brief_app_export.json \
REQUIRE_DURABLE_SUPPORT_STORE=true \
npm run smoke:api
```

補足:
- `healthz` は `supportData.absolutePath` / `configuredPath` / `usingDefaultPath` を返す
- `REQUIRE_DURABLE_SUPPORT_STORE=true` で smoke を回すと、default path (`generator/data/support-data.sqlite`) のままなら fail する
- `smoke:api` は support read endpoint (`/api/v1/support/feedback`, `/api/v1/support/audit`) も確認する

## リリース

tag push で GitHub Actions が自動 publish する:

```bash
git tag v0.1.0
git push origin v0.1.0
```
