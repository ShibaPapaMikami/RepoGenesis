# SKILL_LAYER_CONTRACT.md

## Purpose
skill layer を導入する前提として、
中央 registry が保持する metadata と、project repository 側に残す manifest の最小契約を定義する。

目的は、generator、installer、Web UI が同じ skill モデルを共有できるようにすることにある。

## Core Separation
skill layer では、次の 3 つを分離する。

1. registry metadata
2. installed skill files
3. project manifest

この契約では、skill 本文そのものではなく、
project に何が導入されているかを追跡するための metadata/manifest を定義する。

## Registry Item Model
registry 側では少なくとも次を持つ。

```ts
type SkillRegistryItem = {
  id: string;
  name: string;
  description: string;
  owner: string;
  version: string;
  status: 'stable' | 'experimental' | 'deprecated';
  riskLevel: 'low' | 'medium' | 'high';
  compatibleTools: Array<'claude_code' | 'gemini_cli' | 'tool_agnostic'>;
  tags: string[];
  installMode: 'copy';
  entryPath: string;
  readmePath?: string;
  reviewRequired: boolean;
};
```

### Rules
- `id` は registry 内で一意
- `version` は skill 本体の version
- `compatibleTools` は UI/installer の絞り込みに使う
- `installMode` は初期実装では `copy` 固定
- `reviewRequired` は high-risk skill の追加確認に使う

## Project Manifest Model
project repository には `repogenesis.skills.json` を置く。

```ts
type ProjectSkillManifest = {
  version: 1;
  source: 'repogenesis';
  installed: Array<{
    id: string;
    version: string;
    installedAt: string;
    installedBy?: string;
    compatibleTool?: 'claude_code' | 'gemini_cli' | 'tool_agnostic';
    path: string;
    notes?: string;
  }>;
};
```

### Rules
- `version` は manifest schema version
- `installed[].version` は registry item version を pin する
- `path` は project 内に copy された skill 実体の配置先
- `installedBy` は任意。後から audit 用に使う

## Initial Repository Surface
skill layer を有効にする初回出力では、少なくとも次を置く。

```text
skills/
  README.md
repogenesis.skills.json
```

### `skills/README.md` responsibilities
- skill の目的
- curated skill の導入方針
- manifest の見方
- 更新時は自動反映しないこと

### `repogenesis.skills.json` responsibilities
- project に導入した skill 一覧
- pin version
- install path

## Install Contract
初期 install は `copy + pin` に固定する。

### Why
- project repo 内に skill 実体が残る
- code review できる
- registry 側変更で既存 project が暗黙に変わらない

### Non-Goals
- symlink install
- remote reference only
- auto-update

## Removal Contract
remove は manifest だけ消せばよい、ではなく、
installer が対象 path の存在と project 側変更を確認する必要がある。

最低限の remove 前提:
- manifest entry がある
- installed path が存在する
- project 側の手修正があれば warning を出す

## Update Contract
update は registry 最新を自動反映しない。

最低限必要な操作:
- 現在 pin の表示
- 利用可能 version の表示
- 明示的な update 実行
- changelog / risk の確認

## Skill Category Guidelines
導入候補にしてよいもの:
- review 手順
- release 手順
- security-sensitive area guidance
- runbook templates
- AI tool helper instructions

初期段階で導入対象にしないもの:
- hooks
- editor settings
- project 固有スクリプト
- runtime の挙動を変えるコード

## Governance Rules
- `stable` のみ project 選択 UI に標準表示する
- `experimental` は管理者または明示許可時のみ表示する
- `deprecated` は新規導入不可、既存 project には migration 案内のみ出す
- `high` risk skill は reviewRequired=true を必須にする

## Compatibility With Generator Philosophy
この契約は `Generator enforces structure, not knowledge.` を維持するためのものである。

- generator core は skill 本文の意味を知らない
- generator は manifest と readme など構造面だけ扱う
- skill 本文の管理と選定は registry / installer / project review に分離する

## Immediate Implementation Target
最初の実装では次だけを満たせばよい。

1. `repogenesis.skills.json` schema を定義する
2. `skills/README.md` を generator が出せるようにする
3. registry item metadata の JSON 仕様を決める
4. installer 実装はまだ入れない
