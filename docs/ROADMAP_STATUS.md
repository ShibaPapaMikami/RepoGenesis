# ROADMAP_STATUS.md — Current Position

## Last Updated
2026-03-18

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

## What This Phase Still Needs
- Fix the provider-independent intake contract against current parser behavior.
- Add deterministic `draft -> spec` mapping rules and tests.
- Keep AI provider integration behind the normalized intake boundary.
- Keep optional skill layer separate from the intake/generator core while hardening local export behavior and provider-specific guidance.

## Next Three Tasks
1. Verify production on the latest public wizard commit and confirm the new intro / resume / detail step flow works correctly in the browser.
2. Decide persistent storage for feedback and generation support data.
3. Split pending large changes into separate tracks:
   - AI tool independence (`PROJECT.md` / `CLAUDE.md` / `GEMINI.md`)
   - skill layer deeper automation
   - CI / docs

## After Phase 5
Phase 6 / AI-Assisted Spec Authoring

Planned first step:
- Fix the provider-independent intake contract before introducing any AI API dependency.
