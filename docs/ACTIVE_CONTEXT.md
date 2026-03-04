# ACTIVE_CONTEXT.md — Current Project State

## Last Updated
2026-03-04

## Current Phase
Phase 3 — Usability & Integration (In Progress)

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
- Web Form から `generateFromSpec` を直接呼ぶ ZIP 生成フローを検証中。
- 実機検証（2026-03-03）:
  - multi: pass (`/test/test20260303`, `manifest.fileCount=18`)
  - single: pass (`/test/single20260303`, `manifest.fileCount=16`)
- OAuth orchestration API の MVP スケルトンを実装:
  - `POST /api/v1/repositories/generate`
  - `401/403/400/200` の境界応答
  - `validate + authorize + invoke` を分離
  - 成功時 ZIP バイナリレスポンス化（`application/zip`）
  - 監査ログ出力（`generator/logs/orchestration-audit.log`）
  - Auth adapter導入（`AUTH_PROVIDER=mock|gugenka`）
  - `gugenka-auth` server session verifier を vendor 取り込み（`generator/src/vendor/gugenka-auth`）
  - Auth adapterテスト追加（mock成功 + gugenka未導入エラー）
  - Cloudflare Pages 公開手順を追加（`docs/CLOUDFLARE_PAGES_DEPLOY.md`）
  - API疎通スモークスクリプト追加（`generator/scripts/smoke-orchestration.sh`）
  - app向け環境変数テンプレート追加（`app/.env.example`）
  - API認証を Bearer + cookie session 両対応化（gugenka provider）
  - app に remote auth mode を追加（`VITE_REMOTE_AUTH_MODE=manual_bearer|cookie_session`）
  - Vercel公開手順を追加（`docs/VERCEL_DEPLOY.md`）

## What Is Blocked
- Nothing currently blocked.

## Key Decisions Made
- React + Vite (SPA)。Next.jsは後回し。(ADR-0001)
- ジェネレータはNode CLIとして `generator/` に分離。(ADR-0002)
- フォームは1ページにセクション並べる方式。
- security.levelはフラグから自動算出、上方向のみ上書き可。
- created_atはExport時付与。stateに保持しない。
- localStorageでドラフト自動保存。
- OAuth 境界設計を固定: auth は実行権限のみ、生成ロジック非依存（ADR-0003）。

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
Phase 3 — Usability & Distribution
- README/使い方整備（Web ZIPフローを明文化）
- npm linkで `repogenesis` コマンド化
- dry-run追加
- テンプレートのバージョン付け方針

## Upcoming Focus
Phase 4 準備:
- OAuth orchestration API 契約を固定（`docs/OAUTH_ORCHESTRATION_API.md`）
- `gugenka-auth` server session 実装を vendor 化し、依存導入なしで runtime 実統合を完了（現在65テスト全通過）。
- 次は upstream `@gugenka/auth` package 置換を行うかを判断する。
- 本番では `VITE_REMOTE_AUTH_MODE=cookie_session` を固定し、手動Bearer入力を無効にする。
