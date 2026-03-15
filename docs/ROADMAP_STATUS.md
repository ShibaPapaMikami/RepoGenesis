# ROADMAP_STATUS.md — Current Position

## Last Updated
2026-03-15

## Roadmap Position
Phase 6 / Hardening

## What Is Already Done
- Phase 0-4 are complete.
- Phase 5 is complete.
- Production deployment works with authenticated ZIP generation.
- Latest confirmed production UI during the current timeout triage is `v0.1.1 (b4cacf5)` on 2026-03-13.
- Remote ZIP generation succeeds in production and surfaces request IDs for log correlation (`srv-1773186465441` confirmed).
- Timeout responses in production now also surface BFF request IDs for log correlation (`bff-eeab21ca-35a3-4acd-a51b-80d9b15bf8b5` confirmed).
- After the timeout observation, a same-day retry on production succeeded again.
- `相談結果を反映` flow is implemented and production-tested.
- AI-first flow now restores from Step 1 correctly and production ZIP generation succeeded again on `v0.1.1 (5e344e8)`.
- `かんたん入力` flow is implemented.
- `facts / assumptions / open questions` review is implemented.
- `open questions` can be edited in the UI.
- `AI開発ツール` supports multiple selection (`ai_tools[]`).
- Consultation/simple/detail flows have contract and Playwright coverage.
- `multi` draft reflection now seeds repos automatically and no longer trips the initial validation error.
- Phase 5 UX scope is complete; remaining work is operational follow-up and later-phase separation.
- Phase 6 intake contract hardening has started with a provider-independent draft contract refresh.
- Skill layer planning now includes provider-aware manifest/registry design for Codex / Claude Code / Gemini CLI, plus a sample curated registry entry.

## What This Phase Still Needs
- Fix the provider-independent intake contract against current parser behavior.
- Add deterministic `draft -> spec` mapping rules and tests.
- Keep AI provider integration behind the normalized intake boundary.
- Keep optional skill layer separate from the intake/generator core and define provider adapters before any installer UI.

## Next Three Tasks
1. Add actual file-copy and manifest-write installer commands on top of the dry-run primitives.
2. Decide persistent storage for feedback and generation support data.
3. Split pending large changes into separate tracks:
   - AI tool independence (`PROJECT.md` / `CLAUDE.md` / `GEMINI.md`)
   - skill layer installer / UI
   - CI / docs

## After Phase 5
Phase 6 / AI-Assisted Spec Authoring

Planned first step:
- Fix the provider-independent intake contract before introducing any AI API dependency.
