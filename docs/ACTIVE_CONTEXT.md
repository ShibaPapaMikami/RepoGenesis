# ACTIVE_CONTEXT.md — Current Project State

## Last Updated
2026-03-23

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
  - provider-aware skill installer (`list/add/remove`) を generator CLI に追加した
  - registry sample から project へ artifact copy と manifest 更新が通る test を追加した
  - `ai_tools[]` に `codex` を追加し、app export / generator schema / installer provider resolution を通るようにした
  - Web UI に curated skill selection を追加し、選択内容を localStorage に保持するようにした
  - 最終確認と ZIP 生成段で installer handoff command を表示・コピーできるようにした
  - 選択した Skill を local/remote 生成に流し、`.repogenesis/manifest.json` / `docs/runbooks/skill-install.md` / `skills/README.md` に残すようにした
  - 選択 Skill がある場合は `scripts/install-selected-skills.sh` を生成するようにした
  - AI-first remote validation を app / generator 間で整合させ、`owner` 空・`domains` 空・security 自動補正のまま production ZIP 生成を再度成功させた
  - production `v0.1.1 (41176d1)` で `repogenesis-test (9).zip` のダウンロード成功を確認した
  - remote ZIP 生成では、選択した Skill artifact を registry から解決して同梱し、`repogenesis.skills.json` も prefilled するようにした
  - Web UI は remote 生成時に「Skill は ZIP 同梱済み」と案内し、非エンジニア向けの追加コマンド導線を主画面から外した
  - production `v0.1.1 (0b9e110)` で `repogenesis-test (10).zip` のダウンロード成功を確認し、stable release baseline を `v0.1.2` とした
  - Skill catalog を 5 件へ拡張し、`GH Fix CI` / `Playwright Browser QA` / `Vercel Deploy Check` / `Render Deploy Check` を追加した
  - Skill UI で `Codex / Claude Code / Gemini CLI` ごとの対応状況を badge で表示するようにした
  - skill registry schema に provider ごとの support type (`official` / `curated`) を追加した
  - `skills/registry/official/` を追加し、OpenAI 公式 curated skills を参照元にした provider-aware wrappers を追加した
  - `repo-readiness-review` には Gemini CLI command artifact 実体を追加し、metadata と bundling 実体を一致させた
  - public wizard を `趣旨 -> 相談内容 -> ドラフト -> オプション -> 詳細調整 -> 最終確認 -> ZIP生成` の multi-step flow に再編した
  - 初回アクセスは常に intro から始め、前回保存内容は `前回の続きを再開` から明示的に戻すようにした
  - `固定テスト文章` は `テストモード` の時だけ表示するようにした
  - 相談種別に `個人プロジェクト` を追加した
  - `JSONコピー / JSONダウンロード` は通常表示から外し、テストモード時だけ表示するようにした
  - 公開向けの固定テスト文章から `AI議事録` を外し、`社内FAQポータル` に差し替えた (`04a9281`)
  - intake / generator に planning model を追加し、技術判断と外部依存を `Adopted / Candidate / Open / Rejected` で保持できるようにした
  - `docs/TECH_DECISIONS.md` と `docs/EXTERNAL_DEPENDENCIES.md` を標準生成し、adopted な API / model / service / OSS を `PROJECT.md` / `docs/ARCHITECTURE.md` / `.env.example` に反映するようにした (`d19f447`)
  - `RepoGenesis入力候補` の key-value ヒントから planning 候補を作る parser / state / generator の回帰テストを追加した
  - tool-specific guidance template を shared renderer に寄せ、Codex 選択時は `AGENTS.md` を `CLAUDE.md` / `GEMINI.md` と同じ thin overlay として生成するようにした
  - Codex guidance 生成について generator unit test / e2e test を追加した
  - generator CLI に `doctor --project <path>` を追加し、single / multi repo の core files、tool wrappers、installed skill artifact を検査できるようにした
  - `doctor` について generator unit test / e2e test を追加した
  - `doctor` は planning-aware docs から adopted decisions / adopted dependencies / env vars を復元し、`PROJECT.md` / `docs/ARCHITECTURE.md` / `.env.example` の意味的整合も確認するようにした
  - app 側の Skill guidance / installer handoff も active AI tools と `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` を表示するように揃えた
  - app の favicon を `repogenesis-favicon.svg` へ差し替え、Vite 既定アイコン依存を外した
  - app の Playwright E2E を現行の intro-first wizard 導線に合わせて更新し、local で再度 pass を確認した
  - `app` の local ZIP 生成は `generator/dist` から作った vendor bundle を参照するように切り替え、Vercel production build が `../generator` import 解決エラーで落ちないようにした
  - Vercel production を `c3626f1` で再 deploy し、公開 UI 表示が `v0.1.1 (c3626f1)` になることを headless browser で確認した
  - generated project 側で先に試した operational hardening のうち汎用化できる部分だけを RepoGenesis 本体へ戻し、標準 runbook bundle (`production-bootstrap` / `production-cutover` / `production-checks` / `rollback` / `incident-response`) を generator defaults に追加した
  - `doctor` と generator/e2e/orchestration test も新しい runbook bundle を前提に更新した
  - app の vendored generator bundle も同期し、local ZIP 生成が generator CLI と同じ runbook bundle を返す状態まで揃えた
  - app 側には `generateRepositoryZip` の contract test を追加し、local ZIP の file count と runbook bundle 同梱を固定した
  - app の Playwright E2E には mocked remote ZIP download check を追加し、browser 経路でも operational runbook bundle が崩れないことを確認した
  - runbook bundle の path/entry 定義は `generator/src/runbookBundle.ts` へ集約し、generator / doctor / tests の重複定義を減らした
  - `docs/ROADMAP.md` は current hardening tracks ベースに整理し、Phase 6 / Phase 8 の完了済み項目も現状に合わせて更新した
  - feedback / generation audit は `SUPPORT_DATA_DB_PATH` で指定する SQLite support store へ集約し、後続の admin view / searchable history の下地を追加した
  - `GET /api/v1/support/feedback` / `GET /api/v1/support/audit` を追加し、SQLite support store を読む最初の searchable admin surface を read-only API として用意した
  - app 側にも same-origin BFF (`/api/orchestration/support/feedback` / `/api/orchestration/support/audit`) と read-only support panel を追加し、cookie-session 環境では feedback / generation audit を直接確認できるようにした
  - generation audit は `projectSlug` / `artifactFilename` / `authProvider` / `authMode` / `selectedSkillIds` を持つ structured event へ広げ、support panel からも「誰が・どの経路で・何を生成したか」を追いやすくした
  - orchestration API には in-memory rate limit を追加し、`generate` / `feedback` / `support read` を route 別に制限できるようにした
  - auth は domain-first の generate 権限に加えて optional な `support_read` role segmentation を持つようになり、専用 allowlist で read-only support viewer を許可できるようにした
  - `.github/workflows/deployed-smoke.yml` を追加し、deployed smoke (`smoke:api` + `smoke:deploy`) を manual dispatch または production deployment success で回せるようにした
  - `.github/workflows/stack-health.yml` を追加し、同じ smoke を毎時 23 分 UTC に定期実行して failure 時は GitHub issue を起票/更新、復旧時は自動 close する alerting path を固定した
  - `scripts/check-workflows.sh` と CI job `workflow-config` を追加し、workflow YAML / smoke shell script の構文崩れを PR 時点で止められるようにした
  - orchestration API の `GET /healthz` は support store の path/status も返すようになり、`smoke:api` でも `REQUIRE_DURABLE_SUPPORT_STORE=true` 付きで default path 残りを検出できるようにした
  - app 側にも `npm run smoke:deploy` を追加し、public shell / BFF generate route / support proxy が `500` で壊れていないかを未ログイン状態で検査できるようにした
  - linked Vercel project `app` を production deploy し直し、`https://app-eight-liart-88.vercel.app` に最新 app を反映した
  - `APP_URL=https://app-eight-liart-88.vercel.app npm run smoke:deploy` を実行し、current blocker が `ORCHESTRATION_API_URL is not configured` だと確認した
  - `manual_bearer` support は codebase から削除し、remote mode は `cookie_session` + same-origin BFF 前提に統一した
  - local loopback host の auth / support debug path は `LOCAL_ADMIN_MODE=enabled` がないと `403` を返すようにし、localhost-only debug access を explicit admin mode に切り出した
  - draft / 最終確認の両方から provider-neutral な要件整理プロンプトを copy / markdown export できるようにし、外部 AI での再相談導線を追加した
  - 相談用 prompt と要件再整理 prompt の両方で ChatGPT / Claude / Gemini を切り替えられるようにし、provider-specific guidance は薄い wrapper として扱うようにした
  - options step に AI recommendation の `未確認 / 採用 / 上書き済み` を追加し、repo 構成 / security 水準 / 段階数について user-confirmed override を review まで保持できるようにした
  - `createIntakeEnvelope` を draft 作成導線まで通し、選んだ ChatGPT / Claude / Gemini を provider metadata として `IntakeDraft` に保持するようにした
  - generated output の provider-neutral AI tooling contract として `docs/AI_TOOLING.md` を追加し、single repo / workspace / per-repo の `PROJECT.md`・`ACTIVE_CONTEXT.md`・`prompts/restart.md` から参照するようにした
  - generator CLI / local ZIP / mocked remote ZIP の回帰を更新し、`docs/AI_TOOLING.md` を含む output bundle が崩れないことをローカルで確認した
  - generator dist と app vendored bundle の output 互換チェックを `app/scripts/check-generated-output-compat.mjs` と CI に追加し、fixture 単位で drift を検出できるようにした
  - `docs/AI_INTAKE_ROADMAP.md` / `docs/AI_INTAKE_CONTRACT.md` に Phase 6 boundary を追記し、intake abstraction と後段 AI assistance の責務を分離した
  - `docs/TEMPLATE_VERSIONING.md` / `docs/TEMPLATE_RELEASE_CHECKLIST.md` を追加し、template change の versioning と release gate を docs 化した
  - root `README.md` に deployed smoke 導線を追加し、current smoke flow と deploy docs の導線を揃えた
  - `docs/MODULAR_LAYER_POLICY.md` を追加し、rules / skills / provider-specific helper を optional layer として導入する方針を固定した
  - `skills status` を generator CLI に追加し、install 済み skill の version / registry 差分 / missing artifact を一覧できるようにした
  - `skills update` は `--all` 付きで bulk path を持つようになり、outdated または missing artifact の install 済み skill をまとめて明示更新できるようにした
  - `doctor --registry <path>` を追加し、install 済み skill の registry drift (`update_available`, `missing_from_registry`) も warning として検出できるようにした
- `repogenesis migrate-spec --input <legacy.json> --output <project_spec.json>` を追加し、legacy `projectBrief` を canonical な `ProjectSpec` へ正規化できるようにした
- `docs/SPEC_VERSIONING.md` に `migrate-spec` 前提の migration strategy を追加し、Phase 8 の `specVersion` migration policy を固定した
- Render `Starter` + persistent disk (`/var/data/repogenesis`) で orchestration API を live 化し、`/healthz` で `configuredPath=/var/data/repogenesis/support-data.sqlite` と `usingDefaultPath=false` を確認した
- Vercel production に Render upstream を接続し、BFF generate / support proxy が本番で upstream へ到達する状態にした
- Firebase Authorized Domains に Vercel domain を追加し、Google ログインから cookie-session 発行まで production で通した
- support/auth API の Vercel import 解決を `.js` shim で安定化し、`ERR_MODULE_NOT_FOUND` を解消した (`47896f2`)
- production support panel で real support data を読めること、authenticated remote ZIP generation で `/Users/masafumimikami/Downloads/faq-internal.zip` を出せることを確認した

## What Is Being Done Now
- いまの主要テーマ:
  - Phase 6 入口の contract hardening
    - provider 非依存 intake contract は `IntakeEnvelope` / `IntakeDraft.provider` まで反映済み
    - parser 実装とのズレ整理は継続
    - deterministic `draft -> spec` 境界は固定済み
    - recommendation は user-confirmed override まで反映済み
  - provider-aware skill layer hardening
    - `official` / `curated` / `internal` source を含む registry contract
    - Codex / Claude Code / Gemini CLI の artifact 差を manifest で追跡
    - Web selection -> handoff -> generated output persistence を閉じる
  - Phase 5 完了後の運用フォロー
    - timeout 時の運用切り分けを runbook 化済み
    - live Render + Vercel pair の smoke/health green baseline 固定
  - 次の大きい変更を分離
    - optional skill layer
    - CI/docs
  - g-contract 系生成物の本番化はこのスレッドの active scope から外し、そこで得た知見は RepoGenesis 本体へ戻す対象だけを扱う
  - 参照設計 docs:
    - `docs/AI_INTAKE_ROADMAP.md`
    - `docs/AI_INTAKE_CONTRACT.md`
    - `docs/SKILL_LAYER_ROADMAP.md`
    - `docs/SKILL_LAYER_CONTRACT.md`

## What Is Blocked
- 技術的 blocker は解消済み。
  - 残る blocker は構造整理と運用整備:
  - remote ZIP timeout は request id で追える状態。再試行成功済みのため、当面は Render 側の再発監視を継続
  - AI tool 非依存化は `docs/AI_TOOLING.md` を provider-neutral contract とする形で generator / app / tests まで反映済み。残りは deployed public wizard / real remote ZIP 経路での実地確認
  - Phase 6 の境界整理は docs に反映済み。残りはその境界に沿った AI provider integration の実装判断
  - skill layer は provider-aware contract / installer / Web selection / remote ZIP 同梱まで反映。自動インストールと local ZIP 同梱は未反映
  - `doctor` は core file / wrapper / installed skill artifact / planning docs / `.env.example` の整合検査まで実装済み。残りは browser export や production ZIP 生成後の実地確認
  - production での planning-aware な public wizard / remote ZIP / support panel の実地確認は完了した
  - いま残る実運用課題は deployment 固有 URL 依存で、Firebase Authorized Domains / Render `CORS_ALLOW_ORIGIN` / 公開導線を stable production domain へ寄せること
  - deployed verification は repo root の `scripts/smoke-deployed-stack.sh` で upstream smoke と app smoke をまとめて回せる状態までできているが、live pair に対する green baseline の記録はこれから
  - app 側の vendored generator bundle drift は `app/scripts/check-generator-bundle-sync.mjs` と CI の bundle-sync job で検知できるようにした
  - generator dist と app vendored bundle の出力互換は fixture 比較で CI に固定した

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
- 選択 Skill の自動インストールなし（remote ZIP では同梱されるが、実行時セットアップは自動化していない）
- support store は production で durable volume 接続済みだが、現在の公開 URL は deployment 固有で、認証設定が stable domain にまだ寄っていない
- planning 候補の語彙はまだルールベースで、AI API / OSS / notification provider の表現揺れを今後追加で吸収する必要がある
- local ZIP 用 vendor bundle は `npm run sync:generator-bundle` で手動同期が必要
- 標準 runbook bundle は generic baseline であり、実際の deploy command / dashboard URL / owner 名は project ごとに追記が必要
- support panel は remote mode の internal path にだけ出る。local ZIP では表示しない
- `healthz` は support path を返すが、mounted storage そのものの durability までは判定しない
- `smoke:deploy` は未ログイン smoke なので、cookie-session の成功導線そのものまでは確認しない
- checked-in `render.yaml` は Render `repogenesis-api` として live 化済みで、support store は `/var/data/repogenesis/support-data.sqlite` を指している

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
  - `src/templates/` — constitutions / runbooks / provider-neutral guidance templates
  - `tests/schema.test.ts`, `tests/generator.test.ts`

## Next Phase
Phase 6 — AI-Assisted Spec Authoring
- provider 非依存 intake contract の固定
- AI による draft 作成導線の追加
- deterministic `draft -> spec` 変換の強化

## Upcoming Focus
Immediate next:
- Phase 6 に向けて intake contract の境界を整理する
- support store を production の durable mounted storage に向ける
- checked-in `render.yaml` を sync して upstream orchestration API target を用意し、Vercel `ORCHESTRATION_API_URL` を設定する
- deployed cookie-session support panel が real support data を読めることを確認する
- deployed `healthz` / `smoke:api` で `usingDefaultPath=false` と support reads を確認する
- deployed `smoke:deploy` で BFF / support proxy が `500` で壊れていないことを確認する
- optional skill layer の deeper automation と CI/docs の残差分を別トラックで整理する
- generated install script と provider-specific guidance の運用を整える
- production/browser export で新しい runbook bundle と `docs/AI_TOOLING.md` を含む planning-aware ZIP が崩れないことを確認する
