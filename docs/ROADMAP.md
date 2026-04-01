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
- [x] Remove `manual_bearer` support from the codebase entirely
- [x] Add explicit admin-only mode for local support/debug paths

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
- [x] Add AI provider abstraction behind intake flow
- [x] Add guided prompt templates for ChatGPT / Claude / Gemini
- [x] Convert questionnaire answers into `ProjectSpec draft`
- [x] Separate "facts", "assumptions", and "open questions" in output
- [x] Add AI-generated recommendations with user-confirmed overrides
- [x] Add prompt/export button for continuing requirement refinement outside RepoGenesis
- [x] Add deterministic `draft -> spec` mapping tests

## Phase 7: Operational Scalability
**Goal:** Reduce support cost as usage grows.
- [x] Consolidate feedback / generation audit into a configurable SQLite support store
- [x] Back the support store with durable mounted storage in production
- [x] Add a first searchable admin surface as read-only support API endpoints
- [x] Add a human-facing admin view for feedback / generation history
- [x] Add structured audit events for who generated what and when
- [x] Add rate limiting / abuse controls
- [x] Add domain-based authorization and optional role segmentation
- [x] Add health checks and alerting for Vercel + Render failures
- [x] Add smoke test after every production deploy

## Phase 8: Governance and Template Lifecycle
**Goal:** Scale safely as standards evolve.
- [x] Add baseline operational runbook bundle to generated repositories
- [x] Add compatibility checks for generated outputs across CLI / local ZIP / mocked remote ZIP paths
- [x] Add template versioning policy
- [x] Add migration strategy for `specVersion`
- [x] Add generated output compatibility checks in CI
- [x] Add release checklist for template changes
- [x] Define policy for rules/skills modular layer introduction
- [ ] Decide whether to replace vendored auth with upstream `@gugenka/auth`

## Phase 9: Optional Skill Layer
**Goal:** Let projects adopt curated operational knowledge without polluting generator core.
- Reference: `docs/SKILL_LAYER_ROADMAP.md`, `docs/SKILL_LAYER_CONTRACT.md`
- [x] Define central skill registry metadata schema
- [x] Define provider-aware `repogenesis.skills.json` project manifest schema
- [x] Define provider adapter contract for Codex / Claude Code / Gemini CLI
- [x] Define registry loading rules and selectable status filters
- [x] Generate empty `skills/README.md` and manifest on project bootstrap
- [x] Keep install mode as `copy + pin`
- [x] Add manual install runbook before any installer code
- [x] Add CLI installer only after registry/manifest contracts are fixed
- [x] Add Web UI for curated skill selection after CLI flow stabilizes
- [x] Keep hooks/editor settings/project scripts out of core scope
- [x] Track `official` / `curated` / `internal` source metadata and URLs

## Immediate Priorities (Current Hardening Tracks)
### Track 1: End-to-End Generation Integrity
- [x] Sync tool wrapper guidance, planning docs, and operational runbook bundle in generator outputs
- [x] Keep `doctor` aligned with the runbook bundle and planning-aware starter docs
- [x] Add local ZIP contract tests and mocked remote ZIP browser checks
- [x] Add deployed app smoke for public shell / BFF / support proxy readiness
- [x] Verify the deployed public wizard / real remote ZIP flow end to end

### Track 2: Product Supportability
- [x] Consolidate feedback / generation audit into a configurable SQLite support store
- [x] Add a reproducible Render blueprint baseline for the orchestration API + durable support disk
- [x] Back the support store with durable mounted storage in production
- [x] Add read-only support API endpoints for feedback / generation audit
- [x] Add a first human-facing support panel for feedback / generation history
- [x] Expose support store path/status through `healthz` and smoke checks
- [x] Add deployed app smoke for support proxy readiness
- [x] Add a deployed cookie-session Playwright smoke for the support panel
- [x] Verify the deployed cookie-session support panel against real support data
- [x] Add smoke checks for deployed public environments after release
- [x] Move the current Vercel deployment URL to a stable production domain and align Firebase / Render settings
- [ ] If Vercel Authentication is re-enabled later, document and verify a bypass-based automation flow
- [ ] Prepare public-facing launch copy / X post text after the stable hosted path is locked

### Track 3: Structural Separation
- [x] Separate provider-neutral AI tooling policy into generated `docs/AI_TOOLING.md` and keep wrapper files thin
- [x] Make guided wizard step transitions consistent and clarify which values are AI-prefilled versus manually confirmed in options/detail screens
- [x] Auto-select first-stage curated skills from project context and make skill activation instructions explicit in the public wizard
- [ ] Continue skill layer deeper automation as its own track
- [ ] Continue CI / docs hardening as its own track
- [x] Remove `manual_bearer` support from public-facing paths
- [x] Clarify which Phase 6 items belong to intake abstraction vs. later AI assistance

### Track 4: Generator Specificity Hardening
- [x] Add deterministic domain-aware requirement generation for pipeline-heavy projects such as `ai + cli`
- [x] Reflect adopted external dependencies and open planning items into `REQUIREMENTS.md`
- [x] Generate concrete `ROADMAP.md` phase goals from workflow, dependencies, and unresolved planning items
- [x] Add CLI / language-aware wrapper guidance for generated `AGENTS.md` / `CLAUDE.md` / `GEMINI.md`
- [x] Reflect explicit workflow architecture and differentiating core features into generated `REQUIREMENTS.md` / `ARCHITECTURE.md`

### Track 5: Intake Parsing Hardening
- [x] Treat explicit `RepoGenesis入力候補` as authoritative overrides for domains, primary language, and execution style
- [x] Promote GitHub references plus explicit dependency hints into adopted planning dependencies when the brief clearly requests them
- [x] Convert `未確定事項` into open planning items so generated `ROADMAP.md` Phase 1 goals reflect the real unresolved questions
- [x] Parse `framework` / `audio processing` / `architecture` / `core feature` hints into structured planning entries
- [x] Normalize TTS/CLI-specific core feature splitting, audio dependency metadata, and security phrasing so generated docs stay internally consistent
- [x] Parse provider bullet variants (`•`) plus compound framework hints (`Next.js + FastAPI`) and keep model/framework normalization stable across generated docs
- [x] Reflect distributed browser-to-host runtime boundaries in generated `REQUIREMENTS.md` / `ARCHITECTURE.md` / `ROADMAP.md` when the brief makes that topology explicit
- [x] Split compound primary-language hints into canonical `Primary language` plus supporting language decisions, dedupe `API framework` noise when `Framework` already captures FastAPI, and rescue stale top-level framework summaries from planning during spec build
- [x] Make web UI version traceability explicit by default: small top-right header label with `v<release> (<commit>) <deploy time>` during active development, plus a documented path to hide or restrict it to admins after launch
- [x] Mirror the same runtime label policy in the hosted RepoGenesis UI with build-time `public / admin / hidden` modes so the app itself exposes deploy recency consistently

### CI / Docs Hardening
- [x] Add CI coverage for vendored generator bundle drift
- [x] Add CI coverage for generator-dist vs vendored-bundle output compatibility
- [x] Keep root README / deploy docs aligned with the current deployed smoke flow

## Explicit Non-Goals (For Now)
- [ ] Generator の知識注入機能を先に増やすこと
- [ ] 本番前に Cloudflare / Vercel / Render を同時に最適化すること
- [ ] 役割管理を複雑化すること
- [ ] 生成物をユーザーごとに変えること
