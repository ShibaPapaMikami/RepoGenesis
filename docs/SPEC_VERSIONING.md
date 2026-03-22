# SPEC_VERSIONING.md

## Purpose

`ProjectSpec` の互換性ルールを固定し、CLI と Web の生成結果ドリフトを防ぐ。

## Current Version

- Supported: `1.0`
- Field: `specVersion` (string, required for ProjectSpec input)

## Compatibility Policy

1. Non-breaking additions (任意フィールド追加) は `1.x` のまま維持できる。
2. Breaking changes (既存フィールドの意味変更、必須化、削除) は `2.0` へ上げる。
3. Unknown `specVersion` は必ずバリデーションエラーにする。

## CLI Input Policy

1. CLI は `ProjectSpec` (`specVersion` あり) を優先して受け付ける。
2. `projectBrief` (`specVersion` なし) は移行用レガシー入力としてのみ許可する。
3. レガシー入力時は warning を出力し、manifest の `source` は `legacyBrief` にする。

## Migration Strategy

1. 旧 `projectBrief` を保持している場合は、まず `repogenesis migrate-spec --input <legacy.json> --output <project_spec.json>` を実行する。
2. 既存の `ProjectSpec` を key order / shape 正規化だけしたい場合も同じコマンドを使う。
3. 既存ファイルを上書きする場合は `--force` を明示する。
4. 移行後の canonical input は `specVersion` を持つ `ProjectSpec` とし、新規入力経路はこれ以外を増やさない。
5. 未対応 `specVersion` は移行対象ではなくエラーとして止める。

### Examples

```bash
# legacy projectBrief -> project_spec.json
repogenesis migrate-spec --input ./legacy-project.json --output ./project_spec.json

# 既存 ProjectSpec を in-place 正規化
repogenesis migrate-spec --input ./project_spec.json --output ./project_spec.json --force
```

## Generated Manifest

各生成結果には `.repogenesis/manifest.json` を必ず含める。

必須項目:
- `specVersion`
- `generatorVersion`
- `generatedAt`
- `source` (`projectSpec` or `legacyBrief`)
- `projectSlug`
- `repoType`
- `fileCount`

## Governance Rule

新しい入力経路を追加する場合は、`ProjectSpec` に準拠しない経路を増やしてはならない。

## Fixture Sync Rule

1. app の Export JSON 契約を変更した場合、`generator/tests/fixtures/test_brief_app_export.json` を同時更新する。
2. CI では app export fixture の E2E を必須とし、`project_spec.json` 契約の回帰を検出する。
3. app 側の契約変更では `npm run test:contract` を実行し、`buildProjectSpec` の `specVersion` と shape を検証する。
4. `Generate Repository (ZIP)` の変更は `npm run build` で `generateFromSpec` 連携の型整合を確認する。
5. 手動検証は `docs/ZIP_MANUAL_CHECKLIST.md` に従う。
