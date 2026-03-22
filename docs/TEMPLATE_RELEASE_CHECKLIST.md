# TEMPLATE_RELEASE_CHECKLIST.md

## Purpose

template / generator / app bundle の変更を release する時の確認手順を固定する。

## Pre-Release

1. 変更が patch / minor / major のどれかを [`TEMPLATE_VERSIONING.md`](/Users/masafumimikami/Documents/WebApp/RepoGenesis/docs/TEMPLATE_VERSIONING.md) で判断する。
2. `docs/ROADMAP_STATUS.md` と `docs/ACTIVE_CONTEXT.md` を現況に合わせる。
3. required files / wrapper contract / manifest fileCount の変更有無を確認する。

## Local Verification

1. `cd generator && npm run build`
2. `cd generator && npm test -- --run`
3. `cd app && npm run sync:generator-bundle`
4. `cd app && npm run check:generator-bundle-sync`
5. `cd app && npm run check:generated-output-compat`
6. `cd app && npm run test:contract`
7. `cd app && npm run build`
8. 必要なら `cd app && npm run test:e2e`

## Contract Checkpoints

- `doctor` が通ること
- local ZIP が expected file count と required files を返すこと
- mocked remote ZIP browser path が通ること
- `docs/AI_TOOLING.md` と wrapper files の参照が崩れていないこと
- runbook bundle が expected paths に入っていること

## Deploy Verification

外部環境がある場合だけ実施する。

1. upstream orchestration API の `healthz` を確認する
2. `REQUIRE_DURABLE_SUPPORT_STORE=true npm run smoke:api` を通す
3. Vercel app で `npm run smoke:deploy` 相当を確認する
4. public wizard / real remote ZIP を 1 回通す
5. support panel が real support data を読めることを確認する

## Release Output

release note には最低限次を書く。

- release version
- commit SHA
- contract 影響の有無
- required file の追加/削除
- follow-up が必要な外部作業
