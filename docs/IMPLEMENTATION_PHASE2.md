# IMPLEMENTATION_PHASE2.md — Phase 2: Generator Implementation Guide (CLI向け)

## 前提
- 本ドキュメントはClaude Code CLI向けの実装指示書。
- Chat側は設計のみ。CLIがこのファイルを読んで実装する。
- 実装前に必ず `claude.md` と `docs/REQUIREMENTS.md` と `docs/ADR/0002-generator-cli-design.md` を読むこと。

---

## Step 1: プロジェクト初期化

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis
mkdir generator
cd generator
npm init -y
npm install typescript zod --save
npm install vitest --save-dev
npx tsc --init
```

tsconfig.json の設定:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

package.json に追加:
```json
{
  "bin": {
    "repogenesis": "./dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc --watch",
    "test": "vitest"
  }
}
```

---

## Step 2: ディレクトリ構造

```
generator/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # CLIエントリポイント（#!/usr/bin/env node）
│   ├── generator.ts          # メイン生成ロジック
│   ├── schema.ts             # zod スキーマ定義 + 型export
│   ├── args.ts               # CLI引数パース（--input, --output, --force）
│   ├── templates/
│   │   ├── claudeMd.ts       # claude.md
│   │   ├── activeContext.ts   # docs/ACTIVE_CONTEXT.md
│   │   ├── requirements.ts   # docs/REQUIREMENTS.md
│   │   ├── architecture.ts   # docs/ARCHITECTURE.md
│   │   ├── roadmap.ts        # docs/ROADMAP.md
│   │   ├── adrTemplate.ts    # docs/ADR/0000-template.md（固定）
│   │   ├── plansTemplate.ts  # plans/template.md（固定）
│   │   ├── restart.ts        # prompts/restart.md（固定）
│   │   ├── security.ts       # SECURITY.md（level+フラグ分岐）
│   │   ├── envExample.ts     # .env.example（フラグ分岐）
│   │   ├── gitignore.ts      # .gitignore（domains+フラグ分岐）
│   │   └── globalContext.ts   # GLOBAL_CONTEXT.md（multi-repo時のみ）
│   └── utils/
│       └── fileWriter.ts     # ファイル書き出しユーティリティ
└── tests/
    ├── schema.test.ts
    └── generator.test.ts
```

---

## Step 3: 最小実装順序

### 3-1: zodスキーマ定義（依存なし）

`src/schema.ts`:
- zodでproject_brief.jsonのスキーマを定義する。
- REQUIREMENTS.md のスキーマ定義と完全に一致させること。
- `z.infer<typeof schema>` で型を導出し、`ProjectBrief` としてexportする。
- domains, primary_language, repo_type, security_level はzodのenum/unionで定義。
- multi-repo時のバリデーション（repos必須、name一意、depends_on参照整合性、自己参照禁止）はzodの `.refine()` で実装。

```typescript
// 例
import { z } from 'zod';

const domainEnum = z.enum(['web', 'mobile', 'unity', 'xr', 'ai', 'infra', 'cli', 'iot']);
// ... 続きはREQUIREMENTS.mdのスキーマ定義を参照して実装
```

### 3-2: CLI引数パース

`src/args.ts`:
- process.argv から以下を取得:
  - `--input <path>` (必須): project_brief.json のパス
  - `--output <path>` (必須): 出力先ディレクトリ
  - `--force` (任意): 既存ディレクトリを削除して再生成
- 引数不足時はusageを表示して終了。

```
Usage: repogenesis --input <path> --output <path> [--force]
```

### 3-3: ファイル書き出しユーティリティ

`src/utils/fileWriter.ts`:
- `writeFile(basePath, relativePath, content)` — ディレクトリ自動作成 + ファイル書き込み
- `ensureDir(path)` — mkdir -p 相当
- UTF-8、LF改行を強制

### 3-4: テンプレート関数（固定テンプレート3つを先に）

以下は入力に依存しない固定テンプレート。先に作る。
- `templates/adrTemplate.ts` — ADR-0000テンプレート
- `templates/plansTemplate.ts` — plans/template.md
- `templates/restart.ts` — prompts/restart.md

各関数は `(brief: ProjectBrief) => string` の形式を統一する（固定テンプレートでもbrief引数は受け取る。将来の拡張に備える）。

### 3-5: テンプレート関数（動的テンプレート）

以下はproject_brief.jsonの値に応じて内容が変わるテンプレート。

- `templates/claudeMd.ts` — project全体, tech, security flags, dev workflow を反映
- `templates/activeContext.ts` — project.name, slug, Phase 0状態で初期化
- `templates/requirements.ts` — project.description, tech を反映
- `templates/architecture.ts` — tech.domains, primary_language, frameworks, structure を反映
- `templates/roadmap.ts` — project.name, workflow.phases_count 分のフェーズ枠を生成
- `templates/security.ts` — security.level + 全フラグで内容分岐
- `templates/envExample.ts` — has_api_keys, has_credentials で項目分岐
- `templates/gitignore.ts` — tech.domains, has_credentials, has_ip_sensitive で除外項目分岐
- `templates/globalContext.ts` — multi-repo時のみ。repos一覧、依存関係、責務を記載

#### security.ts の分岐仕様

| security.level | 基本内容 |
|---|---|
| low | .env管理、基本的なシークレット取扱ルール |
| medium | low + ログ出力禁止、環境変数ロード限定、pre-commitフック推奨 |
| high | medium + シークレットローテーションポリシー、アクセス制御テンプレ、インシデント対応テンプレ |

| フラグ | 追加セクション |
|---|---|
| has_api_keys | API Key Handling（スキャン推奨） |
| has_user_data | Personal Data Policy（個人情報取扱） |
| has_payment_data | Payment Data Policy（PCI DSS参照）+ claude.mdに決済データ禁止ルール |
| has_ip_sensitive | IP Confidentiality（NDA注意）+ claude.mdにクライアント情報記載禁止 + .gitignoreに機密除外 |
| has_credentials | Credential Management（ローテーション）+ .env.exampleに証明書パス + .gitignoreに証明書除外 |

#### claudeMd.ts の構成

生成されるclaude.mdの構造:
```
# {project.name} — Project Constitution

## What is this project?
{project.description}

## Tech Stack
- Domains: {tech.domains}
- Language: {tech.primary_language}
- Frameworks: {tech.frameworks}
- AI Tool: {tech.ai_tool}

## Development Workflow
（dev_style = chat_and_cli 固定。claude.md憲法のDevelopment Workflowセクションと同等）

## Absolute Rules
### 1. No Guessing
（RepoGenesis自身のclaude.mdと同等）

### 2. Security
（security.levelに応じた基本ルール）
（has_payment_data=true → 決済データ禁止ルール追加）
（has_ip_sensitive=true → クライアント情報記載禁止追加）

### 3. File Authority
（固定）

### 4. Session Protocol
（固定）

### 5. Work Protocol
（固定）

### 6. ADR Triggers
（固定）

### 7. ACTIVE_CONTEXT Update Triggers
（固定）

## Repository Structure
（single/multiに応じた構造表示）
```

### 3-6: multi-repo生成ロジック

`src/generator.ts` 内で分岐:

#### single-repo の場合:
```
{output}/{slug}/
├── claude.md
├── docs/
│   ├── ACTIVE_CONTEXT.md
│   ├── REQUIREMENTS.md
│   ├── ARCHITECTURE.md
│   ├── ROADMAP.md
│   └── ADR/
│       └── 0000-template.md
├── plans/
│   └── template.md
├── prompts/
│   └── restart.md
├── SECURITY.md
├── .env.example
└── .gitignore
```

#### multi-repo の場合:
```
{output}/{slug}/
├── GLOBAL_CONTEXT.md          ← workspace共通
├── REQUIREMENTS.md            ← workspace共通
├── SECURITY.md                ← workspace共通
├── .gitignore                 ← workspace共通
├── {repos[0].name}/
│   ├── claude.md              ← repo固有（type, owner, depends_on反映）
│   ├── docs/
│   │   ├── ACTIVE_CONTEXT.md  ← repo固有
│   │   ├── ARCHITECTURE.md    ← repo固有（type反映）
│   │   ├── ROADMAP.md         ← repo固有
│   │   └── ADR/
│   │       └── 0000-template.md
│   ├── plans/
│   │   └── template.md
│   ├── prompts/
│   │   └── restart.md
│   ├── .env.example           ← repo固有
│   └── .gitignore             ← repo固有
├── {repos[1].name}/
│   └── ...（同上）
```

workspace共通ファイル:
- `GLOBAL_CONTEXT.md` — repos一覧、依存関係図、各repoの責務
- `REQUIREMENTS.md` — プロジェクト全体の要件
- `SECURITY.md` — 全体セキュリティポリシー

repo固有ファイル:
- `claude.md` — そのrepoのtype, owner, depends_onを反映
- `docs/ACTIVE_CONTEXT.md` — そのrepoの状態
- `docs/ARCHITECTURE.md` — そのrepoのtype（frontend/backend等）に応じた構成

### 3-7: メイン生成ロジック

`src/generator.ts`:
```
1. project_brief.json を読み込み（fs.readFile）
2. JSON.parse
3. zodスキーマで検証 → 失敗ならエラーメッセージ表示して終了
4. 出力先チェック:
   - {output}/{slug} が存在 & --forceなし → エラー終了
   - {output}/{slug} が存在 & --forceあり → rm -rf して続行
   - 存在しない → 続行
5. repo_type判定
   - "single" → single-repo生成
   - "multi" → workspace共通 + repos[]分ループ生成
6. 各テンプレート関数を呼び、fileWriterで書き出し
7. 完了レポート出力（生成ファイル数、パス一覧）
```

### 3-8: index.ts（CLIエントリポイント）

```typescript
#!/usr/bin/env node
// 1. args.tsで引数パース
// 2. generator.tsのgenerate()を呼ぶ
// 3. 結果を標準出力に表示
// 4. エラー時はprocess.exit(1)
```

### 3-9: テスト

`tests/schema.test.ts`:
- 正常なproject_brief.jsonがパスすること
- 必須フィールド欠落で失敗すること
- multi-repo時のname重複で失敗すること
- depends_onの自己参照で失敗すること
- depends_onの存在しないrepo参照で失敗すること
- security.levelの自動算出が正しいこと

`tests/generator.test.ts`:
- single-repoで全必須ファイルが生成されること
- multi-repoでGLOBAL_CONTEXT.md + 各repo構造が生成されること
- --forceなしで既存ディレクトリがあればエラーになること
- security flagsに応じてSECURITY.mdの内容が変わること

---

## Step 4: ビルドと実行

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis/generator

# ビルド
npm run build

# 実行（single-repo例）
node dist/index.js --input ../test_brief.json --output ./output

# 実行（強制上書き）
node dist/index.js --input ../test_brief.json --output ./output --force

# npm link でコマンド化（任意）
npm link
repogenesis --input ../test_brief.json --output ./output
```

---

## Step 5: 完了条件

- [ ] `npm run build` がエラーなく通る
- [ ] zodスキーマがREQUIREMENTS.mdのスキーマ定義と一致する
- [ ] CLI引数 --input, --output, --force が正しく動作する
- [ ] single-repo: 全11ファイル+フォルダが生成される
- [ ] multi-repo: GLOBAL_CONTEXT.md + 共通ファイル + 各repo構造が生成される
- [ ] 既存ディレクトリ + --forceなし → エラー終了
- [ ] 既存ディレクトリ + --force → 削除して再生成
- [ ] security flags に応じて SECURITY.md / .env.example / .gitignore / claude.md の内容が分岐する
- [ ] has_payment_data=true → claude.mdに決済データ禁止ルール、SECURITY.mdにPCI DSS参照
- [ ] has_ip_sensitive=true → claude.mdにクライアント情報記載禁止、.gitignoreに機密除外
- [ ] テスト全件パス
- [ ] `node dist/index.js` で実行できる（ts-node不要）

---

## Step 6: 手動E2E確認手順

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis/generator
npm run build
node dist/index.js --input tests/fixtures/test_brief_single.json --output ./output --force
```

生成物の目視チェックリスト:
- [ ] `output/e2e-single-test/claude.md` にプロジェクト名・Tech Stack・Security Rulesが含まれる
- [ ] `output/e2e-single-test/SECURITY.md` にPCI DSS・Payment Data Policy・API Key Handlingが含まれる
- [ ] `output/e2e-single-test/.env.example` にAPI_KEYプレースホルダーが含まれる
- [ ] `output/e2e-single-test/docs/ROADMAP.md` に4フェーズ分の枠がある
- [ ] `output/e2e-single-test/.gitignore` に.envが含まれる
