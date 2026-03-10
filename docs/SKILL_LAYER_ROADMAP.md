# SKILL_LAYER_ROADMAP.md

## Purpose
RepoGenesis に skill レイヤーを導入する目的は、generator 本体へ運用知識を埋め込まずに、
管理者が承認した再利用ワークフローをプロジェクト単位で安全に導入できるようにすることにある。

この roadmap は、skill を core 構造から分離し、
`registry -> project manifest -> installer` の 3 層で段階導入する順番を定義する。

## Design Principles
- skill は core ではなく optional layer として扱う。
- generator は構造を生成する。skill は運用知識・補助ワークフローとして扱う。
- project が導入した skill と version は repository 内に残す。
- skill の更新は自動反映しない。project ごとに opt-in で更新する。
- tool 固有 skill と AI 非依存 docs を混ぜない。
- 最初は `copy + pin` を採用し、中央 registry の変更で既存 project が暗黙に変わらないようにする。

## Problem Statement
現状の RepoGenesis には skill injection が無く、チームで繰り返し使う運用知識を project へ導入しにくい。
一方で、skill を generator の標準出力に直接埋め込むと次の問題が出る。

- 全 project に不要な skill が混入する
- ツール固有知識が core 構造に侵食する
- skill 更新が generator 更新と結びつき、変更影響が大きくなる
- project ごとに何を導入したか追跡しにくい

したがって、skill は「選択可能なカタログ」として中央管理し、
project 側には導入 manifest と pin 情報を残す方式に寄せるべきである。

## Target Model
```text
central registry
  -> curated skill metadata
  -> skill package content

project repository
  -> repogenesis.skills.json
  -> skills/README.md
  -> installed skill files (copied and pinned)
```

### Central Registry Responsibilities
- skill metadata の管理
- stable / experimental の区分
- owner / risk / compatible tools の明示
- install 対象ファイルの提供

### Project Responsibilities
- どの skill を導入したかを manifest に残す
- install 時の version を pin する
- project 固有に調整した skill は repo 内で管理する

## Phase A: Registry Metadata
**Goal:** skill の「選択可能な単位」を定義する。

### Scope
- registry item schema を定義
- stable / experimental / deprecated の lifecycle を定義
- risk level と reviewer の持ち方を定義
- compatible tools の表現を定義

### Acceptance Criteria
- skill を metadata だけで一覧表示できる
- project が install 前に description / owner / risk を判断できる
- tool 固有 skill と共通知識 skill を区別できる

## Phase B: Project Manifest
**Goal:** project 側に skill 導入履歴を残せるようにする。

### Scope
- `repogenesis.skills.json` schema を定義
- `skills/README.md` を生成対象に追加
- generator は初回生成時に empty manifest を作成できるようにする

### Acceptance Criteria
- project repo に導入済み skill 一覧と pin version が残る
- chat や外部メモに頼らず repo だけで現状を追える
- skill 未導入 project でも manifest 形式が揃う

## Phase C: Manual Install Flow
**Goal:** 最初は最小の導入フローで運用を始める。

### Scope
- 管理者が curated skill を registry に登録
- 利用者は manifest に基づいて skill を手動導入できる
- install mode は `copy + pin`

### Acceptance Criteria
- registry 変更だけでは既存 project が変わらない
- install 後のファイルが repo に存在し、レビュー可能
- manifest と実ファイルの対応が明確

## Phase D: CLI Installer
**Goal:** manifest と install 操作を deterministic にする。

### Scope
- generator package とは別の installer コマンドを定義
- `add`, `remove`, `update`, `list` の最小操作を決める
- manifest と installed files の同期を取る

### Acceptance Criteria
- skill 導入手順が手作業でぶれない
- version pin が更新される
- remove 時に project 側の未追跡変更を検知できる

## Phase E: Web Selection
**Goal:** 非エンジニアでも curated skill を選びやすくする。

### Scope
- app に `推奨 skill` / `選択 skill` UI を追加
- skill の説明、risk、owner を表示
- 初回生成時は manifest だけ作るか、初期導入までやるかを選べるようにする

### Acceptance Criteria
- 非エンジニアでも「どれを入れるか」が説明付きで判断できる
- 誤って high-risk skill を入れにくい
- generator core の入力 UX を壊さない

## Phase F: Update Governance
**Goal:** skill の更新を安全に扱う。

### Scope
- update available の通知設計
- auto-update しない運用ルール
- breaking change policy
- project ごとの rollout 手順

### Acceptance Criteria
- skill 更新が暗黙に入らない
- どの version からどの version へ上げるか追える
- rollback 手順が定義される

## Registry Categories
初期カテゴリはこれに限定する。

- review workflow
- release workflow
- runbook / incident response
- security-sensitive area guidance
- AI tool-specific helpers

以下は後回しにする。

- project 固有 scripts
- hooks
- local editor settings
- runtime code generators

## Non-Goals
- 全 project に skill を自動同梱すること
- registry 側の変更を project に自動配布すること
- skill を generator core の仕様として固定すること
- tool 固有設定を docs 共通層へ混ぜること

## Recommended Implementation Order
1. registry metadata schema
2. project manifest schema
3. empty manifest / README の generator 出力
4. manual install runbook
5. CLI installer
6. Web UI での curated selection

## Immediate Next Step
最初に着手すべきなのは installer ではなく、
`registry item schema` と `repogenesis.skills.json` の契約定義である。

理由は以下。

- 何を registry の責務にし、何を project 側に残すかを先に固定しないと installer がぶれる
- manifest 契約が無いまま UI を作ると、後で導入履歴が追えなくなる
- `copy + pin` か `reference` かの判断を project contract 上で先に固める必要がある
