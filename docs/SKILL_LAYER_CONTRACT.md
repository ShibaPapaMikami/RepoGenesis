# SKILL_LAYER_CONTRACT.md

## Purpose
skill layer を導入する前提として、
中央 registry が保持する metadata と、project repository 側に残す manifest の最小契約を定義する。

目的は、generator、installer、Web UI が同じ skill モデルを共有できるようにすることにある。

加えて、Codex / Claude Code / Gemini CLI のように provider ごとに skill の実体形式が異なる場合でも、
project 側では一貫した install 履歴と pin 情報を追えるようにする。

## Core Separation
skill layer では、次の 3 つを分離する。

1. registry metadata
2. provider-specific artifacts
3. installed project files
4. project manifest

この契約では、skill 本文そのものではなく、
project に何が導入されているかを追跡するための metadata/manifest を定義する。

## Provider Model
RepoGenesis では、tool ごとの用語差を次のように扱う。

- `codex`: OpenAI Codex の `skills`
- `claude_code`: Claude Code の `skills`
- `gemini_cli`: Gemini CLI の `custom commands` / `GEMINI.md` / `extensions`
- `tool_agnostic`: AI tool 固有ではない共通 runbook / review 手順 / docs

Gemini CLI は `skill` という名前で統一しない。
代わりに registry 側で `artifactKind` を明示し、
project へは provider ごとの実体を copy + pin で導入する。

## Registry Item Model
registry 側では少なくとも次を持つ。

```ts
type SkillProvider = 'codex' | 'claude_code' | 'gemini_cli' | 'tool_agnostic';
type SkillProviderSupport = {
  provider: SkillProvider;
  supportType: 'official' | 'curated';
};

type SkillArtifact = {
  provider: SkillProvider;
  artifactKind: 'skill' | 'command' | 'context' | 'extension' | 'doc';
  entryPath: string;
  readmePath?: string;
};

type SkillRegistryItem = {
  id: string;
  name: string;
  description: string;
  owner: string;
  version: string;
  status: 'stable' | 'experimental' | 'deprecated';
  riskLevel: 'low' | 'medium' | 'high';
  sourceType: 'official' | 'curated' | 'internal';
  sourceLabel: string;
  sourceUrl?: string;
  tags: string[];
  installMode: 'copy';
  providers: SkillProvider[];
  providerSupport: SkillProviderSupport[];
  artifacts: SkillArtifact[];
  reviewRequired: boolean;
};
```

### Rules
- `id` は registry 内で一意
- `version` は skill 本体の version
- `sourceType` は「公式由来か」「社内 curated か」を UI/運用で見分けるために使う
- `sourceLabel` は UI で人が読む出典ラベルとして使う (`OpenAI official skills`, `RepoGenesis curated` など)
- `providers` は UI/installer の絞り込みに使う
- `providerSupport` は provider ごとに `official` / `curated` を明示する
- `artifacts` は provider ごとの実体配置を定義する
- `installMode` は初期実装では `copy` 固定
- `reviewRequired` は high-risk skill の追加確認に使う
- `sourceUrl` は公式 doc / registry 元ページへの参照として使う

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
    sourceType?: 'official' | 'curated' | 'internal';
    artifacts: Array<{
      provider: 'codex' | 'claude_code' | 'gemini_cli' | 'tool_agnostic';
      artifactKind: 'skill' | 'command' | 'context' | 'extension' | 'doc';
      path: string;
    }>;
    notes?: string;
  }>;
};
```

### Rules
- `version` は manifest schema version
- `installed[].version` は registry item version を pin する
- `artifacts[]` は project 内に copy された provider ごとの実体配置を保持する
- `installedBy` は任意。後から audit 用に使う
- `sourceType` は install 時点の分類を残す。後から registry が変わっても監査履歴を崩さない

## Initial Repository Surface
skill layer を有効にする初回出力では、少なくとも次を置く。

```text
skills/
  README.md
repogenesis.skills.json
```

provider 固有の実体を初回から自動同梱する必要はない。
初期 bootstrap では manifest と `skills/README.md` のみでよい。

## Registry Package Layout
中央 registry の skill package は、少なくとも次のような構造を取れるようにする。

```text
registry/<skill-id>/
  skill.json
  common/
    README.md
  codex/
    SKILL.md
  claude/
    SKILL.md
  gemini/
    GEMINI.md
    commands/
    extensions/
```

Rules:
- `common/` は provider 非依存 docs や補足説明に使う
- provider 配下のファイルは registry 側の原本
- project へ導入する際は、必要な artifact だけを copy する

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
- Claude / Codex / Gemini の違いを project 内 artifact として監査できる

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

公式由来の curated candidate として扱いやすいもの:
- Codex / Claude の skill instructions
- Gemini CLI の custom commands / context files
- provider 固有だが runtime を変えない補助手順

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
- `official` source でも project への自動同梱はしない。必ず opt-in と review を通す
- Gemini 用 artifact は `skill` ではなく `command` / `context` / `extension` として保持できるようにする

## Compatibility With Generator Philosophy
この契約は `Generator enforces structure, not knowledge.` を維持するためのものである。

- generator core は skill 本文の意味を知らない
- generator は manifest と readme など構造面だけ扱う
- skill 本文の管理と選定は registry / installer / project review に分離する

## Immediate Implementation Target
最初の実装では次だけを満たせばよい。

1. `repogenesis.skills.json` schema を provider-aware に定義する
2. `skills/README.md` を generator が出せるようにする
3. registry item metadata の JSON 仕様を `sourceType` / `artifacts[]` 付きで決める
4. Codex を compatible provider に追加する
5. installer 実装はまだ入れない
