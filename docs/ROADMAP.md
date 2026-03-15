# ROADMAP.md — Product + Platform Roadmap

## Strategic Goal
RepoGenesis を「一部の開発者が使えるツール」ではなく、
「非エンジニアを含む社内メンバーが、迷わず使えて、運用負荷を増やさず広げられる標準作成基盤」にする。

## Guiding Principles
- 生成ロジックは 1 つに固定する。UI や認証で generator を分岐させない。
- 本番運用では個別メール管理よりドメイン/役割ベースを優先する。
- 非エンジニアには spec を書かせず、質問に答えれば spec が作られる形に寄せる。
- フィードバックと運用ログはローカルファイルではなく永続ストレージへ移す。
- 追加機能より先に、認証・監査・再現性・運用導線を固める。

## Phase 0: Foundation (Complete)
**Goal:** Establish project structure and rules.
- [x] Define project concept
- [x] Create minimum folder structure
- [x] Write `claude.md` (constitution)
- [x] Write core documentation templates
- [x] Define `ProjectSpec` schema baseline
- [x] Reflect finalized schema in `REQUIREMENTS.md`

## Phase 1: Form Design (Complete)
**Goal:** Build the first structured input UI.
- [x] Define form field schema and validation rules
- [x] Define security level auto-determination rules
- [x] Define multi-repo validation rules
- [x] Choose frontend technology (React + Vite, ADR-0001)
- [x] Build form UI (single-page sections)
- [x] Connect form -> `project_spec.json` output
- [x] Add contract checks (`specVersion`, filename, JSON ordering)

## Phase 2: Generator (Complete)
**Goal:** Build the single generation core.
- [x] Define generation architecture
- [x] Implement `generateFromSpec`
- [x] Implement single/multi repo generation
- [x] Implement security-aware template branching
- [x] Add convention templates
- [x] Add manifest output (`.repogenesis/manifest.json`)
- [x] Test schema/unit/e2e
- [x] Publish package (`@gugenka/repogenesis`)

## Phase 3: Hybrid Integration (Complete)
**Goal:** Expose the same generator through CLI and Web.
- [x] Web form exports `ProjectSpec` (`specVersion: "1.0"`)
- [x] Web can generate ZIP in browser
- [x] Web can switch to orchestration API mode
- [x] Manual ZIP checks documented
- [x] README/onboarding docs for Web ZIP flow
- [x] Fixture sync stabilized between app and generator

## Phase 4: Authenticated Web System (Complete)
**Goal:** Make Web generation usable in production without changing generator behavior.
- [x] Define auth boundary rule (ADR-0003)
- [x] Define orchestration API contract (`docs/OAUTH_ORCHESTRATION_API.md`)
- [x] Add orchestration API MVP skeleton
- [x] Add binary ZIP response
- [x] Add audit log (JSONL)
- [x] Add `AUTH_PROVIDER=mock|gugenka`
- [x] Vendor `gugenka-auth` session verifier
- [x] Add cookie-session auth path
- [x] Add Vercel BFF proxy for same-origin browser calls
- [x] Add Vercel-side session issue / inspect / logout endpoints
- [x] Add production deployment runbooks
- [x] Replace `AUTH_ALLOWED_EMAILS`-centric generation gating with domain-first gating
- [x] Fix production deployment to `cookie_session` UI path
- [ ] Remove `manual_bearer` support from the codebase entirely
- [ ] Add explicit admin-only mode for local support/debug paths

## Phase 5: Usability for Non-Engineers (Complete)
**Goal:** Reduce input burden and improve spec quality.
- Reference: `docs/AI_INTAKE_ROADMAP.md`, `docs/AI_INTAKE_CONTRACT.md`
- [x] Add `相談結果を反映` mode as the primary non-engineer entry
- [x] Add `かんたん入力` mode separate from `詳細入力`
- [x] Replace direct spec-first UX with guided business questions
- [x] Add field-by-field explanations in plain Japanese
- [x] Add example answers for each section
- [x] Add AI consultation prompt pack directly in UI
- [x] Add `未確定項目` checklist instead of hard-failing ambiguous users early
- [x] Add project type presets (new business / internal tool / client project)
- [x] Add review screen: "生成前の要約" for non-engineers
- [x] Allow editing `open questions` before forcing detailed field decisions
- [x] Auto-seed repos when a generated draft infers `multi`
- [x] Add Playwright coverage for consultation/simple intake flows
- [x] Confirm production behavior after latest UX updates

## Phase 6: AI-Assisted Spec Authoring
**Goal:** Improve quality without duplicating generator knowledge.
- [ ] Add AI provider abstraction behind intake flow
- [ ] Add guided prompt templates for ChatGPT / Claude / Gemini
- [ ] Convert questionnaire answers into `ProjectSpec draft`
- [x] Separate "facts", "assumptions", and "open questions" in output
- [ ] Add AI-generated recommendations with user-confirmed overrides
- [ ] Add prompt/export button for continuing requirement refinement outside RepoGenesis
- [ ] Add deterministic `draft -> spec` mapping tests

## Phase 7: Operational Scalability
**Goal:** Reduce support cost as usage grows.
- [ ] Move feedback storage from local files to persistent storage
- [ ] Add searchable admin view for feedback / generation history
- [ ] Add structured audit events for who generated what and when
- [ ] Add rate limiting / abuse controls
- [ ] Add domain-based authorization and optional role segmentation
- [ ] Add health checks and alerting for Vercel + Render failures
- [ ] Add smoke test after every production deploy

## Phase 8: Governance and Template Lifecycle
**Goal:** Scale safely as standards evolve.
- [ ] Add template versioning policy
- [ ] Add migration strategy for `specVersion`
- [ ] Add generated output compatibility checks in CI
- [ ] Add release checklist for template changes
- [ ] Define policy for rules/skills modular layer introduction
- [ ] Decide whether to replace vendored auth with upstream `@gugenka/auth`

## Phase 9: Optional Skill Layer
**Goal:** Let projects adopt curated operational knowledge without polluting generator core.
- Reference: `docs/SKILL_LAYER_ROADMAP.md`, `docs/SKILL_LAYER_CONTRACT.md`
- [ ] Define central skill registry metadata schema
- [ ] Define provider-aware `repogenesis.skills.json` project manifest schema
- [ ] Define provider adapter contract for Codex / Claude Code / Gemini CLI
- [ ] Generate empty `skills/README.md` and manifest on project bootstrap
- [ ] Keep install mode as `copy + pin`
- [ ] Add manual install runbook before any installer code
- [ ] Add CLI installer only after registry/manifest contracts are fixed
- [ ] Add Web UI for curated skill selection after CLI flow stabilizes
- [ ] Keep hooks/editor settings/project scripts out of core scope
- [ ] Track `official` / `curated` / `internal` source metadata and URLs

## Immediate Priorities (Next 3 Milestones)
### Milestone A: Production Hardening
- [x] `AUTH_ALLOWED_DOMAINS=gugenka.jp` を generator 側の生成認可に反映
- [x] `AUTH_ALLOWED_EMAILS` は例外運用に格下げ
- [ ] 本番 UI から manual bearer を隠す
- [ ] 認証エラー時の文言をユーザー向けに整理

### Milestone B: Simple UX
- [x] `相談結果を反映` の貼り付け導線を追加
- [x] `かんたん入力` の質問セットを定義
- [ ] 入力回答 -> `ProjectSpec` のマッピング表を作る
- [ ] 非エンジニア向け用語集を UI に埋め込む
- [x] 生成前サマリーを追加

### Milestone C: AI Workflow
- [ ] provider 非依存の intake abstraction を定義
- [x] 相談結果を整理するための用途別プロンプトプリセットを追加
- [ ] 回答結果をフォームに転記しやすい JSON / markdown 形式で出力
- [x] `facts / assumptions / open questions` の 3 区分を導入

### Milestone D: Skill Layer Planning
- [ ] skill registry item schema を定義
- [ ] project manifest (`repogenesis.skills.json`) を provider-aware に定義
- [ ] provider adapter (`codex` / `claude_code` / `gemini_cli`) を定義
- [ ] `copy + pin` を前提に install/update/remove 契約を定義
- [ ] `skills` は optional layer、generator core とは分離する

## Explicit Non-Goals (For Now)
- [ ] Generator の知識注入機能を先に増やすこと
- [ ] 本番前に Cloudflare / Vercel / Render を同時に最適化すること
- [ ] 役割管理を複雑化すること
- [ ] 生成物をユーザーごとに変えること
