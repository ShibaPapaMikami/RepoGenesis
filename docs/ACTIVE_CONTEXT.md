# ACTIVE_CONTEXT.md — Current Project State

## Last Updated
2026-03-15

## Current Phase
Phase 6 — AI-Assisted Spec Authoring (Hardening)

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
- Phase 3 完了:
  - app export と generator の単一生成ロジックを統一
  - browser ZIP と orchestration API ZIP の両経路を整備
  - JSON export / contract test / fixture sync を安定化
- Phase 4 完了:
  - Vercel + Render 構成で、本番相当の cookie-session ZIP 生成を成立
  - Firebase ログイン -> Vercel `__session` 発行 -> Render 認可 -> ZIP ダウンロードを通した
  - `gugenka.jp` を実運用ドメインとして認証・認可フローを整理
  - app 上部の認証パネル、デプロイ版ラベル、Vercel BFF を追加
- Phase 5 完了:
  - `相談結果を反映` モードを追加
  - `かんたん入力` モードを追加
  - 用途別プロンプト (`新規事業 / 社内ツール / クライアント案件`) を追加
  - 用途別テスト入力を追加
  - consultation draft の `facts / assumptions / open questions` 表示を追加
  - `open questions` を review / 詳細入力から直接編集可能にした
  - `block / warning` による生成前チェックを追加
  - consultation -> 詳細入力反映 / 出力確認導線を追加
  - simple -> consultation draft -> 詳細入力反映導線を追加
  - consultation 向け Playwright E2E を拡張 (`13 passed`)
  - `AI開発ツール` を `ai_tools[]` 複数選択に修正
  - `multi` draft 反映時に `frontend/backend` 系の repo を自動補完するように修正
  - 本番確認:
    - `相談結果を反映`: PASS
    - `かんたん入力`: PASS
    - `open questions` 編集: PASS
    - 詳細入力反映: PASS
    - JSON 出力: PASS
    - localStorage 復元: PASS
    - `multi` draft 初期バリデーションエラー解消: PASS
    - remote ZIP request tracing (`commit: 6d75da1`): PASS
      - 本番 UI 表示: `コミット: 6d75da1`
      - 生成結果: `repogenesis-test.zip` (`22` files, remote)
      - request id: `srv-1773186465441`
    - timeout 時 request id 保持 (`commit: b4cacf5` deploy 上で確認): PASS
      - 本番 UI 表示: `v0.1.1 (b4cacf5)`
      - timeout 結果: `ZIP生成がタイムアウトしました。APIの再デプロイ状態または生成内容を確認してください。`
      - request id: `bff-eeab21ca-35a3-4acd-a51b-80d9b15bf8b5`
    - timeout 後の再試行成功 (`commit: b4cacf5` deploy 上): PASS
      - 同日中の再試行で ZIP 生成成功
      - timeout は常時再現ではなく、Render 側の一時的な遅延の可能性あり
  - Phase 6 hardening 継続:
  - AI-first guided flow を整理し、production 上で `v0.1.1 (5e344e8)` の ZIP 生成成功を確認
  - consultation parser は heading の型ゆれを吸収し、stale domain を保持しないように修正
  - `責任者` と `技術ドメイン` は AI-first flow では blocking validation から外した
  - `技術ドメイン` 未確定は warning 扱いで ZIP を止めないようにした
  - skill layer contract を provider-aware に更新し、Codex / Claude Code / Gemini CLI を並列で扱う設計に整理した
  - generator 側に provider-aware skill manifest / registry schema を追加した
  - `skills/registry/` に curated sample (`repo-readiness-review`) を追加し、schema で検証する test を追加した
  - registry filesystem loader と stable-only selectable list を generator 側に追加した
  - installer contract を `docs/SKILL_INSTALLER_CONTRACT.md` として分離した
  - `add` 向けの dry-run installer plan primitive を generator 側に追加した
  - manifest write/remove の dry-run primitive を generator 側に追加した

## What Is Being Done Now
- いまの主要テーマ:
  - Phase 6 入口の contract hardening
    - provider 非依存 intake contract の更新
    - parser 実装とのズレ整理
    - deterministic `draft -> spec` 境界の固定
  - provider-aware skill layer planning
    - `official` / `curated` / `internal` source を含む registry contract
    - Codex / Claude Code / Gemini CLI の artifact 差を manifest で追跡
    - installer / Web UI より先に schema と adapter 契約を固定
  - Phase 5 完了後の運用フォロー
    - timeout 時の運用切り分けを runbook 化済み
    - remote ZIP timeout の再発監視
  - 次の大きい変更を分離
    - AI tool 非依存化
    - optional skill layer
    - CI/docs
  - 参照設計 docs:
    - `docs/AI_INTAKE_ROADMAP.md`
    - `docs/AI_INTAKE_CONTRACT.md`
    - `docs/SKILL_LAYER_ROADMAP.md`
    - `docs/SKILL_LAYER_CONTRACT.md`

## What Is Blocked
- 技術的 blocker は解消済み。
- 残る blocker は構造整理と運用整備:
  - feedback 保存がローカルファイルで永続性に欠ける
  - remote ZIP timeout は request id で追える状態。再試行成功済みのため、当面は Render 側の再発監視を継続
  - AI tool 非依存化 (`PROJECT.md + CLAUDE.md + GEMINI.md`) は未反映
  - skill layer は provider-aware contract と manifest/schema まで反映。installer / UI / curated registry 実体は未反映
  - 現在の大きい未コミット差分を concern ごとに分離する必要がある

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
- curated skill registry 実体 / installer / selection UI なし
- template versioningなし（テンプレートのバージョン管理未対応）
- AI tool 非依存の `PROJECT.md` / `GEMINI.md` 分離が未反映
- feedback 保存先が Render ローカルファイル

## Files That Exist
- `claude.md`
- `docs/ACTIVE_CONTEXT.md` (this file)
- `docs/ARCHITECTURE.md`, `docs/REQUIREMENTS.md`, `docs/ROADMAP.md`
- `docs/IMPLEMENTATION.md`, `docs/IMPLEMENTATION_PHASE2.md`
- `docs/ADR/0000-template.md`, `docs/ADR/0001-frontend-react-vite.md`, `docs/ADR/0002-generator-cli-design.md`
- `prompts/restart.md`, `SECURITY.md`, `.env.example`, `.gitignore`
- `app/` — フロントエンド
  - フォーム、認証、consultation intake、Playwright E2E
- `generator/` — Phase 2 ジェネレータCLI
  - `src/schema.ts`, `src/args.ts`, `src/generator.ts`, `src/index.ts`
  - `src/utils/fileWriter.ts`
  - `src/templates/` — 12テンプレート関数
  - `tests/schema.test.ts`, `tests/generator.test.ts`

## Next Phase
Phase 6 — AI-Assisted Spec Authoring
- provider 非依存 intake contract の固定
- AI による draft 作成導線の追加
- deterministic `draft -> spec` 変換の強化

## Upcoming Focus
Immediate next:
- Phase 6 に向けて intake contract の境界を整理する
- feedback の永続保存先を決める
- AI tool 非依存化と optional skill layer を別差分で整理する
- provider-aware installer の dry-run primitive を追加する
