# ROADMAP.md — Phase Plan

## Phase 0: Foundation (Complete)
**Goal:** Establish project structure and rules.
- [x] Define project concept
- [x] Create minimum folder structure
- [x] Write claude.md (constitution)
- [x] Write core documentation templates
- [x] Define ProjectSpec schema baseline (3 review cycles)
- [x] Reflect finalized schema in REQUIREMENTS.md

## Phase 1: Form Design (Complete)
**Goal:** Build the Web Form that collects project information.
- [x] Define form field schema (confirmed in REQUIREMENTS.md)
- [x] Define validation rules (confirmed in REQUIREMENTS.md)
- [x] Define security level auto-determination rules
- [x] Define multi-repo validation rules
- [x] Choose frontend technology (React + Vite, ADR-0001)
- [x] Build form UI (全セクション1ページ)
- [x] Connect form → `project_spec.json` output (Download + Copy)
- [x] Add contract checks (`specVersion`, filename, JSON ordering)

## Phase 2: Generator (Complete)
**Goal:** Build the Node CLI generator that takes `project_spec.json` and outputs a complete repository structure.
- [x] Define generation architecture (CLI構造、テンプレート方式)
- [x] Implement `generateFromSpec` as single generation core
- [x] Implement single/multi repo generation
- [x] Implement security-aware template branching
- [x] Add convention templates (CONTRIBUTING / PR / ISSUE)
- [x] Add manifest output (`.repogenesis/manifest.json`)
- [x] Test: schema/unit/e2e (55 tests pass)
- [x] Publish package (`@gugenka/repogenesis`)

## Phase 3: Hybrid Integration (Current)
**Goal:** Keep one generator core while enabling Web UX.
- [x] Web form exports `ProjectSpec` (`specVersion: "1.0"`)
- [x] Web can generate ZIP in browser via `generateFromSpec`
- [x] Web can switch to orchestration API mode via `VITE_ORCHESTRATION_API_URL`
- [x] Manual ZIP checks for single/multi documented
- [x] Add README/onboarding docs for Web ZIP flow
- [x] Stabilize fixture sync workflow between app and generator

## Phase 4: OAuth Web System (Planned)
**Goal:** Introduce auth without changing generator behavior.
- [x] Define auth boundary rule (ADR-0003)
- [x] Define orchestration API contract (`docs/OAUTH_ORCHESTRATION_API.md`)
- [x] Add orchestration API MVP skeleton (`generator/src/orchestration/*`)
- [ ] Productionize orchestration API (`@gugenka/auth` integration + binary ZIP response)
  - Done: Binary ZIP response
  - Done: Audit log (JSONL)
  - Done: Auth adapter for `AUTH_PROVIDER=mock|gugenka`
  - Done: gugenka session verifier vendoring (`generator/src/vendor/gugenka-auth`)
  - Done: Auth adapter tests (mock success + gugenka missing dependency path)
  - Done: Dependency-free vendor runtime (no package install required)
  - Done: Smoke test script (`generator/scripts/smoke-orchestration.sh`)
- [ ] Integrate upstream `@gugenka/auth` package at boundary only (optional future replacement)
- [ ] Add audit log for execution metadata (outside generated files)
- [ ] Add CLI/Web equivalence checks in CI
- [x] Add cookie-session auth path for orchestration API (no manual bearer required)
- [x] Add Vercel deployment runbook (`docs/VERCEL_DEPLOY.md`)
- [ ] Remove manual bearer mode from production UI (keep only as local fallback)
