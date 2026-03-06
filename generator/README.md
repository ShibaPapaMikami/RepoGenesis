# @gugenka/repogenesis

AI対応リポジトリ構造ジェネレータ。`ProjectSpec JSON` から claude.md・ドキュメント・フォルダ構造を一括生成する。

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
```

| オプション | 必須 | 説明 |
|-----------|------|------|
| `--input <path>` | Yes | `ProjectSpec JSON` のパス |
| `--output <path>` | Yes | 出力先ディレクトリ |
| `--force` | No | 既存の出力ディレクトリを削除して再生成 |
| `--help` | No | ヘルプ表示 |
| `--version` | No | バージョン表示 |

## 入力仕様（ProjectSpec）

- `specVersion` は必須（現在は `1.0` のみサポート）
- `specVersion` がない旧 `projectBrief` は移行用として受理されるが、CLI で deprecation warning が出る
- 詳細ポリシー: [`docs/SPEC_VERSIONING.md`](../docs/SPEC_VERSIONING.md)

### 実行例

```bash
repogenesis --input ./my_project.json --output ./repos
repogenesis --input ./my_project.json --output ./repos --force
```

### 生成されるディレクトリ（single-repo）

```
repos/{slug}/
├── claude.md
├── docs/
│   ├── ACTIVE_CONTEXT.md
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   ├── VERSIONING_STANDARD.md
│   └── ADR/0000-template.md
├── .repogenesis/
│   └── manifest.json
├── plans/template.md
├── prompts/restart.md
├── SECURITY.md
├── .env.example
└── .gitignore
```

## 暫定：npm link（ソースから直接使う場合）

```bash
cd generator
npm install
npm run build
npm link
repogenesis --help
```

解除: `npm unlink -g @gugenka/repogenesis`

## 開発

```bash
npm install
npm run build
npx vitest run     # テスト55件
npm run dev        # tsc --watch
```

## Orchestration API (MVP Skeleton)

```bash
npm run build
npm run start:api
```

デフォルト: `http://127.0.0.1:8002/api/v1/repositories/generate`

- 認可トークン（暫定）:
  - `Bearer dev-token` → 許可
  - `Bearer forbidden-token` → 403
- OAuth 本実装は今後 `@gugenka/auth` に置き換える（境界のみ）。
- 成功時レスポンス: ZIP バイナリ（`Content-Type: application/zip`）
- 監査ログ: `generator/logs/orchestration-audit.log`（JSONL）
- フィードバック保存:
  - `POST /api/v1/feedback/bug` → `logs/feedback/bugs/*.json`
  - `POST /api/v1/feedback/request` → `logs/feedback/requests/*.json`

環境変数:
- `AUTH_PROVIDER=mock` (default): `dev-token` / `forbidden-token` を利用
- `AUTH_PROVIDER=gugenka`: vendored `gugenka-auth` session verifier を利用
- `NEXTAUTH_SECRET`: gugenka session JWT 検証に必須
- `SESSION_AUDIENCE` (default: `repogenesis`)
- `AUTH_ALLOWED_DOMAINS` (optional, comma-separated, preferred for production)
- `AUTH_ALLOWED_EMAILS` (optional, comma-separated, for explicit exceptions)
- `CORS_ALLOW_ORIGIN` (本番は app 公開ドメインに固定)
- `GENERATE_REQUIRE_AUTH` (default: `true`)
  - `false` にすると ZIP生成APIの認証を一時的に無効化（検証用）

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
npm run smoke:api
```

## リリース

tag push で GitHub Actions が自動 publish する:

```bash
git tag v0.1.0
git push origin v0.1.0
```
