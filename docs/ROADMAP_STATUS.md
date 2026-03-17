# ROADMAP_STATUS.md — Current Position

## Last Updated
2026-03-17

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

## What This Phase Still Needs
- Fix the provider-independent intake contract against current parser behavior.
- Add deterministic `draft -> spec` mapping rules and tests.
- Keep AI provider integration behind the normalized intake boundary.
- Keep optional skill layer separate from the intake/generator core while hardening local export behavior and provider-specific guidance.

## Next Three Tasks
1. Verify production `v0.1.1 (c4b2c8a)` and confirm the new multi-skill catalog / provider badges behave correctly in the browser.
2. Decide persistent storage for feedback and generation support data.
3. Split pending large changes into separate tracks:
   - AI tool independence (`PROJECT.md` / `CLAUDE.md` / `GEMINI.md`)
   - skill layer deeper automation
   - CI / docs

## After Phase 5
Phase 6 / AI-Assisted Spec Authoring

Planned first step:
- Fix the provider-independent intake contract before introducing any AI API dependency.
