# ROADMAP_STATUS.md — Current Position

## Last Updated
2026-03-13

## Roadmap Position
Phase 5 / Stabilizing

## What Is Already Done
- Phase 0-4 are complete.
- Production deployment works with authenticated ZIP generation.
- Latest confirmed production UI during the current timeout triage is `v0.1.1 (b4cacf5)` on 2026-03-13.
- Remote ZIP generation succeeds in production and surfaces request IDs for log correlation (`srv-1773186465441` confirmed).
- Timeout responses in production now also surface BFF request IDs for log correlation (`bff-eeab21ca-35a3-4acd-a51b-80d9b15bf8b5` confirmed).
- `相談結果を反映` flow is implemented and production-tested.
- `かんたん入力` flow is implemented.
- `facts / assumptions / open questions` review is implemented.
- `open questions` can be edited in the UI.
- `AI開発ツール` supports multiple selection (`ai_tools[]`).
- Consultation/simple/detail flows have contract and Playwright coverage.
- `multi` draft reflection now seeds repos automatically and no longer trips the initial validation error.

## What This Phase Still Needs
- Wording polish for non-engineer guidance.
- Stable baseline tag.
- Public confirmation after each future production redeploy when UX changes.
- Render-side timeout root cause check and redeploy confirmation.

## Next Three Tasks
1. Cut a stable baseline tag after confirming the latest production deploy.
2. Sync any remaining docs/runbooks with the 2026-03-11 production confirmation details.
3. Split pending large changes into separate tracks:
   - AI tool independence (`PROJECT.md` / `CLAUDE.md` / `GEMINI.md`)
   - skill layer (`repogenesis.skills.json`, `skills/README.md`)
   - CI / docs

## After Phase 5
Phase 6 / AI-Assisted Spec Authoring

Planned first step:
- Fix the provider-independent intake contract before introducing any AI API dependency.
