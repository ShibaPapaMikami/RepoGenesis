# ROADMAP_STATUS.md — Current Position

## Last Updated
2026-03-29

## Roadmap Position
Phase 6 / Hardening

## What Is Already Done
- Phase 0-4 are complete.
- Phase 5 is complete.
- Production deployment works with authenticated ZIP generation.
- Public wizard UI has been refactored into a multi-step flow with intro, draft review, options, detail tuning, final review, and ZIP generation.
- Test samples are now hidden behind `テストモード` and the public sample set no longer includes the AI minutes project.
- The latest main branch includes the public-facing sample replacement on `04a9281`.
- Remote ZIP generation succeeds in production and surfaces request IDs for log correlation (`srv-1773186465441` confirmed).
- Timeout responses in production now also surface BFF request IDs for log correlation (`bff-eeab21ca-35a3-4acd-a51b-80d9b15bf8b5` confirmed).
- After the timeout observation, a same-day retry on production succeeded again.
- `相談結果を反映` flow is implemented and production-tested.
- AI-first flow now restores from Step 1 correctly and production ZIP generation succeeded again on `v0.1.1 (5e344e8)`.
- AI-first flow with curated skill selection, generated skill handoff, and relaxed remote validation succeeded on production `v0.1.1 (41176d1)`.
- `かんたん入力` flow is implemented.
- `facts / assumptions / open questions` review is implemented.
- `open questions` can be edited in the UI.
- `AI開発ツール` supports multiple selection (`ai_tools[]`).
- Consultation/simple/detail flows have contract and Playwright coverage.
- `multi` draft reflection now seeds repos automatically and no longer trips the initial validation error.
- Phase 5 UX scope is complete; remaining work is operational follow-up and later-phase separation.
- Phase 6 intake contract hardening has started with a provider-independent draft contract refresh.
- Skill layer now includes provider-aware manifest/registry design, CLI installer commands, Web curated selection UI, remote ZIP auto-bundling for selected skills, and generated output persistence.
- The latest production retry completed successfully with downloaded artifact `repogenesis-test (10).zip`.
- Stable release baseline is `v0.1.2` on `0b9e110` after production success with selected skill bundling.
- Skill catalog now surfaces provider-specific support in the UI (`Codex: 公式`, `Claude Code: RepoGenesis対応`, `Gemini CLI: RepoGenesis対応`).
- Official-style skill registry entries now exist for `gh-fix-ci`, `playwright`, `vercel-deploy`, and `render-deploy`, in addition to the existing `repo-readiness-review`.
- The existing `repo-readiness-review` entry now includes a concrete Gemini CLI command artifact instead of metadata-only support.
- Intake / generator の planning model が追加され、技術判断と外部依存を `Adopted / Candidate / Open / Rejected` として保持できるようになった。
- `docs/TECH_DECISIONS.md` と `docs/EXTERNAL_DEPENDENCIES.md` が標準生成され、adopted な API / model / service / OSS は `PROJECT.md`、`docs/ARCHITECTURE.md`、`.env.example` に反映されるようになった。
- `RepoGenesis入力候補` の key-value ヒントから planning 候補を組み立てる parser / state / generator の回帰テストが追加された。
- tool-specific guidance template が shared renderer に寄せられ、Codex 選択時は `AGENTS.md` も thin overlay として生成されるようになった。
- generator CLI に `doctor --project <path>` が追加され、core files / tool wrappers / installed skill artifacts の整合性を機械検査できるようになった。
- `doctor` は planning-aware docs から adopted summary / env vars を復元し、`PROJECT.md` / `ARCHITECTURE.md` / `.env.example` との意味的整合も検査するようになった。
- app 側の Skill guidance / installer handoff も active AI tools と `AGENTS.md` / `CLAUDE.md` / `GEMINI.md` を表示するように揃え、favicon も RepoGenesis 用 SVG に差し替えた。
- app の Playwright E2E は現行の intro-first wizard 導線に合わせて更新し、local で再度 pass を確認した。
- `app` の local ZIP 生成は `generator/dist` から作った vendor bundle を参照するようになり、Vercel production build が `../generator` import なしで通るようになった。
- Vercel production を `c3626f1` で再 deploy し、公開 UI 表示が `v0.1.1 (c3626f1)` へ更新された。
- `everything-claude-code` 的な運用 artifact のうち、生成物側で試した generic 部分を RepoGenesis 本体へ戻し、標準 runbook bundle (`production-bootstrap` / `production-cutover` / `production-checks` / `rollback` / `incident-response`) として generator から出力するようにした。
- `doctor` は新しい operational runbook bundle も required files として検査するようになり、single / multi repo と app export の回帰テストも更新した。
- app の vendored generator bundle も同期し、local ZIP 生成が generator CLI と同じ runbook bundle を返す状態まで揃えた。
- app 側には `generateRepositoryZip` の contract test を追加し、local ZIP の file count と runbook bundle 同梱を固定した。
- app の Playwright E2E には mocked remote ZIP download check を追加し、browser 経路でも operational runbook bundle がダウンロードされることを確認した。
- runbook bundle の path/entry 定義は `generator/src/runbookBundle.ts` へ集約し、generator / doctor / tests の重複定義を減らした。
- `docs/ROADMAP.md` は current hardening tracks ベースに整理し、Phase 6 / Phase 8 の完了済み項目も現状に合わせて更新した。
- feedback / generation audit は scattered JSON/JSONL ではなく、`SUPPORT_DATA_DB_PATH` で指定する SQLite support store へ集約する実装に切り替えた。
- `GET /api/v1/support/feedback` / `GET /api/v1/support/audit` を追加し、SQLite support store を読む最初の searchable admin surface を read-only API として用意した。
- app 側にも same-origin BFF (`/api/orchestration/support/feedback` / `/api/orchestration/support/audit`) と read-only support panel を追加し、cookie-session 環境では feedback / generation audit を UI から確認できるようにした。
- public wizard の visual direction を見直し、default form UI から editorial/studio 寄りの見た目へ寄せ始めた。
- curated skill catalog / registry に `frontend-design` を追加し、Codex / Claude Code / Gemini CLI で同じデザイン改善の入口を選べるようにした。
- generation audit は `projectSlug` / `artifactFilename` / `authProvider` / `authMode` / `selectedSkillIds` を持つ structured event へ広げ、support panel でも「誰が・どの経路で・何を生成したか」を追いやすくした。
- orchestration API には in-memory rate limit を追加し、`generate` / `feedback` / `support read` を route 別に制限できるようにした。key は bearer / session cookie / forwarded IP を hash して扱う。
- auth は domain-first の generate 権限に加えて optional な `support_read` role segmentation を持つようになり、専用 allowlist で read-only support viewer を許可できるようにした。
- `.github/workflows/deployed-smoke.yml` を追加し、deployed smoke (`smoke:api` + `smoke:deploy`) を manual dispatch または production deployment success で回せるようにした。
- `.github/workflows/stack-health.yml` を追加し、deployed stack health (`smoke:api` + `smoke:deploy`) を毎時 `23` 分 UTC に定期実行し、failure 時は GitHub issue を自動で起票/更新、復旧時は自動 close できるようにした。
- `scripts/check-workflows.sh` と CI job `workflow-config` を追加し、GitHub workflow YAML と deployed smoke shell script の構文崩れを push/PR 時に検知できるようにした。
- orchestration API の `GET /healthz` は support store の path/status も返すようになり、`smoke:api` でも `REQUIRE_DURABLE_SUPPORT_STORE=true` 付きで default path 残りを検出できるようにした。
- app 側にも `npm run smoke:deploy` を追加し、public shell / BFF generate route / support proxy が `500` で壊れていないかを未ログイン状態で検査できるようにした。
- linked Vercel project `app` を production deploy し直し、`https://app-eight-liart-88.vercel.app` に最新 app を反映した。
- その production に対する `smoke:deploy` で、BFF / support proxy の current blocker が `ORCHESTRATION_API_URL is not configured` だと確認した。
- `manual_bearer` support は codebase から削除し、remote mode は `cookie_session` + same-origin BFF 前提に統一した。
- local loopback host の auth / support debug path は `LOCAL_ADMIN_MODE=enabled` がないと `403` を返すようにし、localhost-only debug access を explicit admin mode に切り出した。
- draft / 最終確認から外部 AI へ持ち出す provider-neutral な要件整理プロンプトを copy / markdown export できるようにし、相談結果の再整理導線を RepoGenesis UI 内に追加した。
- 相談用 prompt と要件再整理 prompt の両方で、ChatGPT / Claude / Gemini 向けの guided wrapper を切り替えられるようにし、provider ごとの差分を prompt 本文ではなく薄い wrapper に閉じ込めた。
- consultation intake に `参考実装・関連リンク` section を追加し、GitHub リポジトリや実装参考 URL を相談用 prompt / parser / 要件再整理 prompt / draft summary に保持できるようにした。
- generator の `REQUIREMENTS.md` / `ROADMAP.md` / tool wrapper guidance を deterministic に強化し、`ai + cli` の pipeline 要件、adopted dependency 条件、open planning item、`cli + python` guidance を starter docs へ流し込めるようにした。
- repo root に [`render.yaml`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/render.yaml) を追加し、Node 22.17+・`/healthz`・durable disk・support store path を含む Render Blueprint baseline を固定した。
- `generator/tests/renderBlueprint.test.ts` を追加し、Blueprint baseline の service contract / Node floor / support-store mount path を drift しないようにした。
- repo root に [`scripts/smoke-deployed-stack.sh`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/scripts/smoke-deployed-stack.sh) を追加し、Render upstream smoke と Vercel app smoke を 1 コマンドで連続実行できるようにした。
- app の Playwright を `APP_URL` 対応にし、[`app/e2e/support-panel.remote.spec.ts`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/app/e2e/support-panel.remote.spec.ts) で deployed cookie-session support panel をセッション cookie 付きで確認できるようにした。
- app の vendored generator bundle sync を [`app/scripts/check-generator-bundle-sync.mjs`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/app/scripts/check-generator-bundle-sync.mjs) で検査できるようにし、CI にも bundle-sync job を追加した。
- generated output の AI tool independence を `docs/AI_TOOLING.md` へ切り出し、single repo / workspace / per-repo の `PROJECT.md`・`ACTIVE_CONTEXT.md`・`prompts/restart.md` はこの provider-neutral contract を参照するようにした。
- generator / app の回帰も更新し、`docs/AI_TOOLING.md` を含む local ZIP / mocked remote ZIP / CLI output が崩れないことをローカルで再確認した。
- [`app/scripts/check-generated-output-compat.mjs`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/app/scripts/check-generated-output-compat.mjs) を追加し、generator dist と app vendored bundle が同じ starter output を返すことを CI で fixture 比較できるようにした。
- [`docs/AI_INTAKE_ROADMAP.md`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/docs/AI_INTAKE_ROADMAP.md) と [`docs/AI_INTAKE_CONTRACT.md`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/docs/AI_INTAKE_CONTRACT.md) に Phase 6 boundary を追記し、intake abstraction と後段 AI assistance の責務を明文化した。
- [`docs/TEMPLATE_VERSIONING.md`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/docs/TEMPLATE_VERSIONING.md) と [`docs/TEMPLATE_RELEASE_CHECKLIST.md`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/docs/TEMPLATE_RELEASE_CHECKLIST.md) を追加し、template change の versioning rule と release gate を repo に固定した。
- root [`README.md`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/README.md) に deployed smoke 導線を追加し、deploy docs と current smoke flow を揃えた。
- [`docs/MODULAR_LAYER_POLICY.md`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/docs/MODULAR_LAYER_POLICY.md) を追加し、rules / skills / provider-specific helper を optional layer として導入するガードレールを明文化した。
- `skills status` を generator CLI に追加し、install 済み skill の version / registry 差分 / missing artifact を一覧できるようにした。
- `skills update` は generator CLI / installer に加えて `--all` を持つようになり、outdated または missing artifact の install 済み skill をまとめて明示更新できるようにした。
- `doctor --registry <path>` を追加し、install 済み skill の registry drift (`update_available`, `missing_from_registry`) も warning として検出できるようにした。
- `repogenesis migrate-spec --input <legacy.json> --output <project_spec.json>` を追加し、legacy `projectBrief` を canonical な `ProjectSpec` へ事前移行できるようにした。
- `docs/SPEC_VERSIONING.md` に migration strategy を追加し、Phase 8 の `specVersion` migration policy を repo 内で閉じた。
- options step に AI recommendation の `未確認 / 採用 / 上書き済み` を追加し、repo 構成 / security 水準 / 段階数について user-confirmed override を review まで保持できるようにした。
- `createIntakeEnvelope` を draft 作成導線まで通し、選んだ ChatGPT / Claude / Gemini を provider metadata として `IntakeDraft` に保持するようにした。draft / review でも `相談に使ったAI` を見えるようにした。
- Render `Starter` + persistent disk (`/var/data/repogenesis`) で orchestration API を本番化し、`/healthz` で `usingDefaultPath=false` を確認した。
- Vercel production に `ORCHESTRATION_API_URL=https://repogenesis-api.onrender.com` を接続し、BFF generate / support proxy が `ORCHESTRATION_API_URL is not configured` ではなく認証境界へ到達する状態にした。
- Firebase Authorized Domains に本番 Vercel domain を追加し、Google ログインと cookie-session 発行を production で通した。
- Vercel serverless で落ちていた support/auth API の `.ts` import を修正し、`ERR_MODULE_NOT_FOUND` を解消した (`47896f2`)。
- production の internal support panel で Render 上の real SQLite support store を読めることを確認した。
- production の authenticated remote ZIP generation で実 artifact `/Users/masafumimikami/Downloads/faq-internal.zip` をダウンロードできることを確認した。
- support panel は default-hidden に切り替え、`VITE_SUPPORT_ALLOWED_EMAILS` / `VITE_SUPPORT_ALLOWED_DOMAINS` に一致する support viewer だけに表示する形へ寄せた。
- generated `docs/AI_TOOLING.md` と tool wrapper guidance に、進捗チェックと残り時間の目安をデフォルトで出す運用ルールを追加した。
- stable production domain `https://repo-genesis-omega.vercel.app` を確認し、`smoke:deploy` も `pass=4 warn=0 fail=0` で通した。
- Vercel Authentication を戻す場合の bypass runbook (`docs/VERCEL_AUTH_BYPASS_RUNBOOK.md`) と、stable domain 前提の X ポスト下書き (`docs/X_POST_DRAFT.md`) を追加した。
- stable production domain `https://repo-genesis-omega.vercel.app` で Google ログインと authenticated ZIP 生成を再確認し、`/Users/masafumimikami/Downloads/faq-internal (1).zip` を取得した。
- hosted UI は support panel を internal viewer だけに限定したまま、ヘッダー/フッター/フレーム/配色を public-facing に調整した。
- orchestration auth は production 相当環境で `AUTH_PROVIDER=mock` と `GENERATE_REQUIRE_AUTH=false` を 503 で止めるようにし、誤設定を code path で防ぐようにした。
- public wizard には skip link / step focus / reduced-motion を追加し、キーボード操作と動き抑制の最低限を先に整えた。
- consultation step の select / textarea / button は `aria-describedby` で説明文と結び、相談用 prompt / draft 化の意図が読み上げでも追えるようにした。
- app header / hero / step nav は `WizardChrome` へ分離し、`App.tsx` の chrome 部分を切り出した。AuthPanel / SupportPanel も status 読み上げと help text を追加した。
- orchestration API の credentialed CORS は allowlist 外 origin を 403 で拒否するように harden し、fallback で request origin を反射しないようにした。
- orchestration API の POST body には size 上限と async 例外の 500 fallback を追加し、oversized request / invalid JSON / stream error を明示応答するようにした。
- generator / skill installer / selected skill bundle / ZIP builder に path safety を追加し、root 外へ出る相対 path を拒否するようにした。
- rate-limit bucket には期限切れ cleanup を追加し、長期稼働で stale entry が蓄積しないようにした。
- ZIP contract test は binary を UTF-8 includes で見る方式をやめ、entry 名の実解析へ切り替えた。
- CI の Node version は 22.17.0 に統一し、app `typecheck` と job timeout を追加した。
- support data store の schema migration は whitelist 化した identifier だけで `ALTER TABLE` するようにし、内部 SQL 組み立てを限定した。
- support data store reader は壊れた JSON metadata / selected skill list を無視して継続するようにし、破損行でプロセスが落ちないようにした。
- generate / feedback / server fallback の request id は `Date.now()` ではなく UUID ベースへ切り替えた。
- consultation parser / planning suggestion は explicit `RepoGenesis入力候補` を優先して `domains` / `primary_language` / `CLI` signal を反映し、GitHub reference と依存ヒントから adopted dependency を組み立てられるようになった。
- `未確定事項` は open planning item へ橋渡しされ、generated `ROADMAP.md` Phase 1 goals と `REQUIREMENTS.md` Known TBDs に実際の未解決論点が出るようになった。
- intake hardening は `environment=local` / `FastAPI candidate` / `Data sensitivity boundary` も planning に反映し、pipeline-heavy CLI briefs で stale な `Framework choice is still TBD.` を出しにくくした。
- generator は open planning items を 5 件まで `REQUIREMENTS.md` / `ROADMAP.md` へ反映し、Phase 1 の unresolved work が bullet 単位で読みやすくなった。
- intake hardening は `framework=Typer`、`audio processing`、`architecture`、`core feature` も structured planning として保持し、`dependency に GitHub上の ... を含む` を `github_repo` へ正規化できるようになった。
- generator は explicit workflow architecture と differentiating core features を `REQUIREMENTS.md` / `ARCHITECTURE.md` / tool guidance に反映し、TTS/CLI briefs の project-specific value を generic text に落としにくくした。

## What This Phase Still Needs
- Refine the public UI so non-engineers can understand planning fields without reading internal terminology.
- Keep optional skill layer separate from the intake/generator core while hardening local export behavior and provider-specific guidance.
- Keep deployed `healthz` / `smoke:api` aligned with support store checks so default-path regressions are caught quickly.
- Keep deployed `smoke:deploy` aligned with BFF / support proxy checks so Vercel-side env regressions are caught quickly.
- Keep the new provider-neutral `docs/AI_TOOLING.md` contract aligned across deployed public wizard / real remote ZIP paths after the upstream service is wired.
- Keep the optional Vercel Authentication bypass runbook ready in case the hosted app is later switched back to closed access.
- Prepare public-facing launch copy / X post text after the stable hosted path is fixed.

## Next Three Tasks
1. Run the checked-in deployed smoke flow (`deployed-smoke.yml` / `stack-health.yml`) against the live Render + Vercel pair and capture the first green production baseline.
2. Finalize public-facing launch copy / X post text around the stable hosted path.
3. Split pending large changes into separate tracks:
   - skill layer deeper automation
   - CI / docs

## After Phase 5
Phase 6 / AI-Assisted Spec Authoring

Planned first step:
- Fix the provider-independent intake contract before introducing any AI API dependency.
