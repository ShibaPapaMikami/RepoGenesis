# ZIP_MANUAL_CHECKLIST.md

## Purpose

`Generate Repository (ZIP)` の手動検証を標準化し、single/multi の回帰を早期に検出する。

## Preconditions

1. `app/` で `npm run build` が成功していること
2. フォーム入力エラーがないこと（`canExport = true`）
3. 検証日は記録すること（例: 2026-03-03）

## Single-Repo Checklist

1. `repo_type = single` で `Generate Repository (ZIP)` を実行する。
2. `{slug}.zip` がダウンロードされること。
3. ZIP展開後、`{slug}/` 配下に以下が存在すること:
   - `claude.md`
   - `docs/ACTIVE_CONTEXT.md`
   - `docs/REQUIREMENTS.md`
   - `docs/ARCHITECTURE.md`
   - `docs/ROADMAP.md`
   - `docs/ADR/0000-template.md`
   - `plans/template.md`
   - `prompts/restart.md`
   - `SECURITY.md`
   - `.env.example`
   - `.gitignore`
   - `CONTRIBUTING.md`
   - `.github/PULL_REQUEST_TEMPLATE.md`
   - `.github/ISSUE_TEMPLATE/bug_report.md`
   - `.github/ISSUE_TEMPLATE/feature_request.md`
   - `.repogenesis/manifest.json`
4. `manifest.json` に `specVersion`, `generatorVersion`, `source`, `fileCount` が含まれること。
5. `fileCount = 16` であること。

## Multi-Repo Checklist

1. `repo_type = multi` で repo を2件以上設定し `Generate Repository (ZIP)` を実行する。
2. `{slug}.zip` がダウンロードされること。
3. ZIP展開後、workspace 直下に以下が存在すること:
   - `GLOBAL_CONTEXT.md`
   - `REQUIREMENTS.md`
   - `SECURITY.md`
   - `.gitignore`
   - `CONTRIBUTING.md`
   - `.github/PULL_REQUEST_TEMPLATE.md`
   - `.github/ISSUE_TEMPLATE/bug_report.md`
   - `.github/ISSUE_TEMPLATE/feature_request.md`
   - `.repogenesis/manifest.json`
4. 各 repo 配下に以下が存在すること:
   - `claude.md`
   - `docs/ACTIVE_CONTEXT.md`
   - `docs/ARCHITECTURE.md`
   - `docs/ROADMAP.md`
   - `docs/ADR/0000-template.md`
   - `plans/template.md`
   - `prompts/restart.md`
   - `.env.example`
   - `.gitignore`
5. 期待ファイル数が `9 * repoCount + 9` と一致すること。

## Failure Handling

1. 欠落ファイルがある場合は、入力 `project_spec.json` と `manifest.json` を添付して起票する。
2. `specVersion` の不一致がある場合は `docs/SPEC_VERSIONING.md` を確認し、先に契約を修正する。
3. same input で ZIP 内容が変わる場合は重大回帰として扱う。
