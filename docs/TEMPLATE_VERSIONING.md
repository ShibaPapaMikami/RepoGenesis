# TEMPLATE_VERSIONING.md

## Purpose

generator が出力する starter docs / runbooks / wrapper files の変更を、破壊的変更と非破壊変更に分けて扱うための方針を定義する。

## Scope

この方針は次を対象にする。

- `generator/src/templates/`
- `generator/src/runbookBundle.ts`
- `generator/src/generateFromSpec.ts`
- app の vendored generator bundle
- 生成物の required files / manifest fileCount / doctor expectations

## Versioning Rule

### 1. Patch

次の変更は patch として扱う。

- typo 修正
- wording 改善
- 非必須 doc の説明補強
- 既存 output shape を変えない test / CI / smoke 強化
- 既存 file path を変えない内部 refactor

### 2. Minor

次の変更は minor として扱う。

- 新しい optional file の追加
- 既存 contract を壊さない runbook / guidance の追加
- 既存 input を保ったままの generated docs 拡張
- provider-neutral doc の追加

条件:
- `doctor` が新しい file を required にする場合は、同じ release で generator / app / tests / docs を一緒に更新すること

### 3. Major

次の変更は major として扱う。

- generated file path の rename / delete
- 既存 `PROJECT.md` / `REQUIREMENTS.md` / `ACTIVE_CONTEXT.md` / wrapper contract の意味変更
- `.repogenesis/manifest.json` shape の breaking change
- `ProjectSpec` / `specVersion` の breaking change
- local ZIP / remote ZIP / CLI で同じ output が出なくなる変更

## Compatibility Expectations

1. CLI / local ZIP / mocked remote ZIP は同じ generated output contract を共有する。
2. app の vendored bundle は generator dist と同じ output を返す必要がある。
3. required files の追加・削除時は `doctor`, tests, docs, vendored bundle を同じ差分で更新する。
4. provider-specific wrapper は thin overlay のままにし、project truth は `PROJECT.md` と `docs/` に残す。

## Required Checks

template change を merge する前に最低限次を通す。

- `cd generator && npm run build`
- `cd generator && npm test -- --run`
- `cd app && npm run sync:generator-bundle`
- `cd app && npm run check:generator-bundle-sync`
- `cd app && npm run check:generated-output-compat`
- `cd app && npm run test:contract`
- `cd app && npm run build`

必要に応じて:

- `cd app && npm run test:e2e`
- deployed `smoke:deploy`
- upstream `smoke:api`

## Release Note Rule

template change を release する時は、最低限次を changelog / release note に含める。

- 生成物 contract に影響があるか
- required file の追加/削除があるか
- app vendored bundle の sync が必要か
- deploy smoke / doctor / browser path に追加確認が必要か
