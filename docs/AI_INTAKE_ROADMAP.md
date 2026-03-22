# AI_INTAKE_ROADMAP.md

## Purpose
非エンジニアが RepoGenesis を使うときの最大の壁は、`ProjectSpec` を直接考えさせられることにある。
この roadmap は、`要件整理 -> draft 化 -> 確認 -> 生成` の流れを段階的に導入し、
AI を「決定者」ではなく「整理補助」として使うための実装順を定義する。

## Design Principles
- generator は構造を強制する。知識判断エンジンにはしない。
- AI は `facts / assumptions / open questions` を整理するが、最終確定は人間が行う。
- 最初から API 依存にしない。まずは貼り付け取り込みで UX を成立させる。
- `single / multi`, `外部APIあり`, `最初に何を作るか` のような構成判断は、初回入力で強制しない。
- 不明点は `未確定` として保持し、確認画面で可視化する。

## Problem Statement
現行フォームは、非エンジニアに次の判断を早すぎる段階で求めている。

- 外部 API が必要か
- single repo / multi repo のどちらか
- まず何を作るべきか

これらは入力項目ではなく、壁打ちや要件整理の結果として出てくるべき項目である。
したがって、UI を「spec 入力」から「整理結果の反映」に寄せる必要がある。

## Target Flow
1. ChatGPT / Claude などで事前壁打ちする
2. RepoGenesis に相談結果を貼る
3. RepoGenesis が draft を作る
4. `確定事項 / 仮置き事項 / 未確定事項` を分けて見せる
5. 必要なら詳細入力で微調整する
6. ZIP / JSON を生成する

## Phase A: Intake Before AI API
**Goal:** API なしでも「相談結果を反映」できる状態にする。

### Scope
- `相談結果を反映` モードを追加
- 貼り付け入力欄を追加
- 相談用プロンプトを UI からコピーできるようにする
- 最低限の deterministic parser を追加
- `未確定事項` を保持した draft を生成する

### Input Format
まずは markdown ベースの半構造化入力を対象にする。

```md
## プロジェクト概要
## 想定ユーザー
## 解決したい課題
## 最初に作るべきもの
## 扱うデータ
## 外部連携候補
## 未確定事項
## RepoGenesis入力候補
```

### Acceptance Criteria
- 非エンジニアが 1 回の貼り付けで draft を作れる
- 不明な項目は `未確定` として残る
- 詳細入力に遷移しても値が壊れない
- JSON / ZIP 生成の既存挙動を壊さない

## Phase B: Guided Simple Mode
**Goal:** 壁打ちなしでも最低限の draft を作れるようにする。

### Scope
- `かんたん入力` モードを追加
- 5〜8問の質問セットを設計
- 各質問に短い説明と回答例を付ける
- 回答を `ProjectSpec draft` へ変換する
- `未確定` フラグを各セクションで保持する

### Question Categories
- これは何を作るプロジェクトか
- 誰が使うか
- 解決したい課題は何か
- 扱うデータに個人情報/機密情報があるか
- AI 活用が主目的か
- 最初に必要なのは Web 画面 / API / 社内運用設計のどれか

### Acceptance Criteria
- 3 分以内で draft が作れる
- `外部 API` や `repo 分割` を最初から決めなくてよい
- 非エンジニアが「何を答えればよいか分からない」状態を減らせる

## Phase C: Review Gate
**Goal:** AI や簡易入力の曖昧さを、そのまま生成へ流さない。

### Scope
- 生成前サマリー画面
- `確定事項 / 仮置き事項 / 未確定事項` の 3 区分
- `詳細入力で調整` 導線
- 生成前チェックリスト

### Acceptance Criteria
- 何が確定していて、何が仮置きかが画面で明確
- `single / multi` や `security` などの重要項目は確認を通る
- ユーザーが「AI が決めたから正しい」と誤認しにくい

## Phase D: AI API Integration
**Goal:** 壁打ち結果が無いユーザーでも、整理品質を上げる。

### Scope
- AI provider 抽象化レイヤーを追加
- 自然文入力から `facts / assumptions / open questions / spec_draft` を生成
- UI に AI 提案とユーザー確定を分離して表示
- prompt/export なしでも一定品質の draft を生成

### Non-Goals
- AI が最終 spec を自動確定すること
- repo 境界や security を AI が最終決定すること
- generator の判断ロジックを AI に置き換えること

### Acceptance Criteria
- provider を差し替えても UI/生成ロジックが崩れない
- AI 出力をそのまま確定せず review gate を通す
- 不確実な判断は `open questions` に落ちる

## Phase E: Operationalization
**Goal:** AI 補助を本番運用可能な形にする。

### Scope
- 利用ログとフィードバックの永続化
- draft 生成履歴の検索
- prompt/version の監査
- AI 失敗時の fallback UX
- モデル更新時の回帰確認

### Acceptance Criteria
- support コストが増えにくい
- どの prompt / provider / version で draft が作られたか追跡できる
- AI 停止時でも簡易入力・詳細入力で作業継続できる

## Recommended Implementation Order
1. `相談結果を反映` モード
2. `相談用プロンプトをコピー`
3. draft parser + `未確定事項`
4. 生成前レビュー画面
5. `かんたん入力`
6. AI API 抽象化
7. 永続ログ/運用画面

## Phase 6 Boundary
Phase 6 では「AI を使うこと」そのものではなく、AI が入っても壊れない intake 境界を固定する。

### Belongs to intake abstraction
- 貼り付け入力 / かんたん入力を `IntakeDraft` に正規化すること
- `facts / assumptions / open questions` の shape を固定すること
- `draft -> spec` の deterministic mapping を固定すること
- `RepoGenesis入力候補` から planning 候補を provider 非依存で拾うこと
- review gate で `confirmed / provisional / unresolved` を分けて見せること
- provider-neutral な prompt/export 導線を持つこと

### Belongs to later AI assistance
- 特定 provider の API client 実装
- model 選定や provider failover
- AI による recommendation の自動生成
- prompt version / provider version / response metadata の詳細監査
- 高度な意味推定や自由文からの強い自動補完

### Rule of separation
- intake abstraction は provider がなくても動くことを前提にする
- AI assistance は `IntakeDraft` を作る補助層であり、generator の source of truth にはならない
- review gate を通る前の AI 提案は、常に provisional または open questions 扱いに留める

## Immediate Next Step
最初に実装すべきなのは `かんたん入力` ではなく `相談結果を反映` モードである。
理由は以下。

- 既に ChatGPT / Claude を使った事前壁打ちニーズがある
- 入力精度を上げるには、質問数を増やすより整理結果を貼れる方が早い
- API 導入前でも UX 改善の価値を出せる
- provider 依存のない形で UI/データモデルを先に固められる
