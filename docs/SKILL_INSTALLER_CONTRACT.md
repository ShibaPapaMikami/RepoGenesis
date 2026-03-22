# SKILL_INSTALLER_CONTRACT.md

## Purpose
provider-aware skill layer の次段として、
installer が何を読み、何を保証し、何をまだ扱わないかを定義する。

この文書の目的は、CLI installer と将来の Web selection UI が
同じ install/remove/update/list/status 契約に従えるようにすることにある。

## Input Surface
installer が扱う入力は次の 3 つ。

1. central registry metadata
2. project manifest (`repogenesis.skills.json`)
3. project filesystem state

### Registry loading rule
初期実装では registry root を固定ディレクトリとして読む。

```text
skills/registry/
  <source-group>/
    <skill-id>/
      skill.json
```

Rules:
- loader は `skills/registry/**/skill.json` を再帰的に探索する
- `skill.json` は `skillRegistryItemSchema` に通る必要がある
- 不正な entry が 1 件でもあれば、install 実行前に fail する
- `status=stable` のみ標準一覧に出す
- `experimental` は明示フラグがあるときだけ出す
- `deprecated` は `list` では見えるが `add` では選べない

## Installer commands
初期 CLI installer は次を持つ。

- `list`
- `add`
- `status`
- `remove`
- `update`

### `list`
Purpose:
- registry から選択可能な skill を表示する

Minimum output:
- `id`
- `name`
- `version`
- `status`
- `sourceType`
- `riskLevel`
- `providers`
- `reviewRequired`

### `add`
Purpose:
- registry entry を project へ `copy + pin` で導入する

Required inputs:
- `skill id`
- target project root
- target provider set

Rules:
- provider 未指定時は project で有効な AI tool に一致する provider を優先する
- project AI tool と一致しない provider artifact は自動 install しない
- `tool_agnostic` artifact は常に追加候補にできる
- `reviewRequired=true` の場合は確認なし自動 install を禁止する
- manifest は install 完了後にのみ更新する

### `status`
Purpose:
- install 済み skill の pin / registry 差分 / artifact 欠損を表示する

Minimum output:
- `id`
- installed version
- registry version
- `up_to_date | update_available | missing_from_registry`
- installed providers
- missing artifact warnings

### `remove`
Purpose:
- manifest と copied artifact を安全に外す

Rules:
- manifest entry が無ければ fail
- recorded artifact path が無ければ warning
- project 側で手修正された可能性がある場合は warning を返す
- `remove` は manifest と artifact path の両方を対象にする

### `update`
Purpose:
- 既存 pin を別 version へ明示更新する

Rules:
- auto-update 禁止
- sourceType / provider / artifactKind の変更差分を表示する
- update 前に current と target の artifact 一覧差分を出す
- `--all` は clean な `up_to_date` を触らず、outdated または missing artifact の skill だけを対象にする

## Provider resolution rule
provider と project state の対応は次に寄せる。

- project has `codex` -> `codex` artifact を install 候補にする
- project has `claude_code` -> `claude_code` artifact を install 候補にする
- project has `gemini_cli` -> `gemini_cli` artifact を install 候補にする
- provider 非依存 docs は `tool_agnostic` として併用できる

初期実装では、1 つの skill entry から複数 provider artifact を同時 install できる。

## Output guarantees
installer 完了後に最低限保証するもの:

- copied artifact はすべて manifest に載っている
- manifest にある artifact は project 内 path と整合する
- version は registry item version で pin される
- sourceType は install 時点の値で保持される

## Non-goals for first installer
- remote fetch
- symlink install
- binary package management
- skill artifact の自動マージ
- provider 実行可否の完全判定

## Immediate implementation target
最初の installer 実装で満たすべきこと:

1. registry loader
2. stable entry の一覧表示
3. `add/remove/list` の dry-run 可能な設計
4. manifest と artifact path の同期検証

## Current progress
- registry loader: implemented
- stable-only selectable list: implemented
- `add` dry-run plan primitive: implemented
- manifest write/remove dry-run primitive: implemented
- actual file copy / manifest write to disk: implemented
- CLI `skills list/add/status/remove/update`: implemented
- CLI `skills update --all`: implemented
