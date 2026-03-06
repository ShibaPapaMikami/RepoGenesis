# ACTIVE_CONTEXT.md — Current Project State

## Last Updated
2026-03-06

## Current Phase
Phase 4 — Authenticated Web System (In Progress)

## What Has Been Done
- Phase 0 完了:
  - プロジェクト最小構造作成、claude.md策定、スキーマ確定、REQUIREMENTS.md反映
- Phase 1 完了:
  - 設計: React + Vite選定(ADR-0001)、フォームレイアウト、state管理方針
  - 実装: `app/` にフォーム全機能実装。Viteビルド成功、ローカル動作確認済み
- Phase 2 完了:
  - 設計: ジェネレータCLI構造確定(ADR-0002)
  - 実装:
    - generator/ 初期化（TypeScript, zod, vitest, @types/node）
    - ディレクトリ構造作成
    - zodスキーマ定義（refine 5件: repos必須/name一意/自己参照禁止/depends_on整合性/level最低値）
    - CLI引数パース（--input, --output, --force）
    - ファイル書き出しユーティリティ（UTF-8, LF強制）
    - 固定テンプレート3つ（ADR, plans, restart）
    - 動的テンプレート9つ（claudeMd, activeContext, requirements, architecture, roadmap, security, envExample, gitignore, globalContext）
    - multi-repo生成ロジック（workspace共通 + repo固有分離）
    - generator.ts / index.ts 実装
    - テスト26件全パス、`npm run build` 成功、`node dist/index.js` で実行可能

## What Is Being Done Now
- Vercel + Render 構成で、本番相当の cookie-session ZIP 生成を成立させた。
- 実機状態:
  - Firebase ログイン: pass
  - Vercel 側 `__session` 発行: pass
  - Render 側 ZIP 生成: pass
  - 個別 allowlist (`AUTH_ALLOWED_EMAILS`) で生成認可: pass
- 追加した本番構成:
  - `app/api/orchestration/*` の Vercel BFF
  - `app/api/auth/*` の Vercel session APIs
  - `app/public/vendor/gugenka-auth.*` によるブラウザ認証 UI
  - app 上部の認証パネル
  - デプロイ版ラベル表示
- いまの主要テーマ:
  - 個別メール許可から `gugenka.jp` ドメイン許可へ移行
  - `相談結果を反映` を主導線にした非エンジニア向け intake 設計
  - AI 補助導入前の intake architecture 固定
  - 参照設計 docs: `docs/AI_INTAKE_ROADMAP.md`, `docs/AI_INTAKE_CONTRACT.md`

## What Is Blocked
- 技術的 blocker は解消済み。
- 残る blocker は運用設計:
  - 非エンジニア向け入力 UX が未整備
  - 相談結果の取り込み導線がなく、壁打ち結果を活用できない
  - feedback 保存がローカルファイルで永続性に欠ける

## Key Decisions Made
- React + Vite (SPA)。Next.jsは後回し。(ADR-0001)
- ジェネレータはNode CLIとして `generator/` に分離。(ADR-0002)
- フォームは1ページにセクション並べる方式。
- security.levelはフラグから自動算出、上方向のみ上書き可。
- created_atはExport時付与。stateに保持しない。
- localStorageでドラフト自動保存。
- OAuth 境界設計を固定: auth は実行権限のみ、生成ロジック非依存（ADR-0003）。
- 本番の browser -> API 呼び出しは cross-site cookie ではなく Vercel BFF 経由に固定する。
- `gugenka.jp` を実運用ドメインとし、`gugenka.co.jp` は使わない。

## Technical Decisions Locked
- Runtime validation: zod（スキーマ定義と型推論を一元化）
- 実行方式: `tsc` → `node dist/index.js`（ts-node前提にしない）
- 上書き仕様: デフォルト失敗、`--force` で削除→再生成
- テンプレート方式: TypeScriptテンプレートリテラル関数（外部テンプレートエンジンなし）
- 書き出し規約: UTF-8 + LF改行

## Known Limitations
- mergeモードなし（既存ファイルとの差分マージ未対応）
- dry-runなし（実行前プレビュー未対応）
- interactive CLIなし（対話的プロンプト未対応）
- skill injectionなし（テンプレートの外部差し込み未対応）
- template versioningなし（テンプレートのバージョン管理未対応）
- 非エンジニア向け `かんたん入力` が未実装
- `相談結果を反映` モードが未実装
- feedback 保存先が Render ローカルファイル

## Files That Exist
- `claude.md`
- `docs/ACTIVE_CONTEXT.md` (this file)
- `docs/ARCHITECTURE.md`, `docs/REQUIREMENTS.md`, `docs/ROADMAP.md`
- `docs/IMPLEMENTATION.md`, `docs/IMPLEMENTATION_PHASE2.md`
- `docs/ADR/0000-template.md`, `docs/ADR/0001-frontend-react-vite.md`, `docs/ADR/0002-generator-cli-design.md`
- `prompts/restart.md`, `SECURITY.md`, `.env.example`, `.gitignore`
- `app/` — Phase 1 フロントエンド（20ファイル）
- `generator/` — Phase 2 ジェネレータCLI
  - `src/schema.ts`, `src/args.ts`, `src/generator.ts`, `src/index.ts`
  - `src/utils/fileWriter.ts`
  - `src/templates/` — 12テンプレート関数
  - `tests/schema.test.ts`, `tests/generator.test.ts`

## Next Phase
Phase 5 — Usability for Non-Engineers
- `相談結果を反映` モード追加
- `かんたん入力` モード追加
- 生成前要約の導入
- AI 相談プロンプトの UI 埋め込み

## Upcoming Focus
Immediate next:
- 本番 UI から manual bearer を隠す
- `相談結果を反映` モードの input/output 仕様を固める
- 非エンジニア向け質問セットを定義する
- feedback の永続保存先を決める
