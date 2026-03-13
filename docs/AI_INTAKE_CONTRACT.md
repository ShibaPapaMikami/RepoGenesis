# AI_INTAKE_CONTRACT.md

## Purpose
`相談結果を反映` モードで受け取る入力と、RepoGenesis が内部で扱う draft 出力の契約を定義する。
目的は、UI 実装・parser 実装・将来の AI API 連携を同じ provider 非依存の境界に揃えることにある。

この契約は「どの AI を使うか」ではなく、「RepoGenesis が何を受け取り、どこまで deterministic に正規化するか」を固定する。

## Input Model
最初の対象は markdown 形式の貼り付け入力。
完全 JSON は要求しない。

受け入れ対象:
- `## 見出し` 形式
- `### 見出し` 形式
- 見出しのみの行 + 次行本文
- `見出し: 本文` の1行形式

非対応:
- 完全自由文からの高精度意味抽出
- provider 固有の function calling / tool schema 前提の入力

### Required Sections
- `## プロジェクト概要`
- `## 想定ユーザー`
- `## 解決したい課題`
- `## 扱うデータ`
- `## 未確定事項`

### Optional Sections
- `## 最初に作るべきもの`
- `## 外部連携候補`
- `## RepoGenesis入力候補`

### Accepted Heading Set
受け入れる見出し名は次に固定する。

- `プロジェクト概要`
- `想定ユーザー`
- `解決したい課題`
- `最初に作るべきもの`
- `扱うデータ`
- `外部連携候補`
- `未確定事項`
- `RepoGenesis入力候補`

### Example Input
```md
## プロジェクト概要
社内向けのAI活用案件管理ツールを作りたい。

## 想定ユーザー
営業、PM、制作進行。

## 解決したい課題
案件ごとの相談履歴と進行状況が分散している。

## 最初に作るべきもの
まずは案件一覧と相談履歴を見られる画面。

## 扱うデータ
案件名、担当者、顧客とのやりとり要約。個人情報は限定的。

## 外部連携候補
Slack、Google Drive、将来的には社内DB。

## 未確定事項
APIを先に作るべきか、1リポジトリで十分かは未確定。

## RepoGenesis入力候補
- domain: web, ai
- security: medium
```

## Internal Draft Model
parser は貼り付け結果を次の draft へ変換する。

```ts
type IntakeDraft = {
  source: 'pasted_consultation';
  rawText: string;
  sections: Record<string, string>;
  review: {
    facts: string[];
    assumptions: string[];
    openQuestions: string[];
  };
  extracted: {
    summary: string | null;
    users: string[];
    problem: string | null;
    firstDeliverable: string | null;
    dataKinds: string[];
    integrations: string[];
    openQuestions: string[];
    candidateInputs: string[];
  };
  certainty: {
    confirmed: string[];
    provisional: string[];
    unresolved: string[];
  };
  suggestedState: FormState;
};
```

## Mapping Rules
### Deterministic only
- parser は明示的な記述だけを使う
- ルールにない強い意味推定はしない
- あいまいな構成判断は `provisional` または `unresolved` に送る
- `single / multi` は明示があれば優先し、なければ軽いルールベース推定に留める

### Conservative defaults
- `repoType` は未記載なら `single` 仮置きにできるが、`provisional` に記録する
- `hasApiKeys` は外部連携候補があるだけでは `true` にしない
- `hasUserData` は個人情報・顧客情報・アカウント情報の明示がある場合のみ `true`
- `securityLevel` は `payment data` / `credentials` / 強い機密情報が無ければ原則 `medium` 仮置き

### Candidate Input Normalization
`RepoGenesis入力候補` は provider ごとに文体がぶれても、次だけを拾えればよい。

- `domain`
- `security`
- `single / multi`
- `has_api_keys`

例:

- `domain は web と ai が候補`
- `security は medium を想定`
- `single repo を想定`
- `has_api_keys を想定`

### Field Precedence
`suggestedState` を組むときの優先順位は次に固定する。

1. 相談結果から明示的に抽出できた値
2. deterministic な candidate input ルールで拾えた値
3. 既存 form state

ただし例外:

- `project.owner` は相談結果から抽出していないため既存 state を維持する
- `slug` は手動編集済みなら維持し、そうでなければ `project.name` から再生成する
- 再生成 slug が空になる場合は安全な fallback を使う

### Readiness Classification
`review` と `certainty` の意味は次で固定する。

- `facts`: 入力文に明示されている内容
- `assumptions`: 生成のために仮置きした内容
- `openQuestions`: 未確定事項と blocker 候補
- `confirmed`: 明示的に取れた項目名
- `provisional`: 仮置きした項目名
- `unresolved`: 生成前に確認したい項目名

## Output to Form State
`IntakeDraft` から既存 form state へ反映する時は以下を守る。

- 既存 state shape は変えない
- 仮置き値は UI 上で見分けられる必要がある
- `未確定` はチェックリストとして別表示する
- 詳細入力へ遷移しても rawText と openQuestions は失わない
- 以前の別案件 state が残っていても、相談結果から取れた主要値は上書きできる必要がある

## Review Gate Requirements
生成前に最低限次を表示する。

- 確定した内容
- 仮置きした内容
- 未確定事項
- `詳細入力で調整` ボタン

以下は review gate を通すまで確定扱いにしない。

- repoType
- securityLevel
- hasApiKeys
- hasCredentials

## Non-Goals
- 自由文から最終 `ProjectSpec` を直接確定すること
- LLM が repo 境界を自動決定すること
- parser が高度な自然言語理解に依存すること
- provider 固有の prompt 仕様を契約本体に埋め込むこと
- AI 出力を信用して既存 state を無条件に保持または無条件に破棄すること

## Current Acceptance Target
Phase 6 入口時点で最低限次を満たす。

1. markdown を貼れる
2. 見出し揺れを吸収しつつ、許可見出しだけへ正規化できる
3. `summary / users / problem / firstDeliverable / openQuestions / candidateInputs` を抽出できる
4. 既存 form state に対して deterministic な優先順位で `suggestedState` を作れる
5. 未確定事項を review 画面に出せる
6. timeout や AI 出力の揺れがあっても provider 非依存で同じ draft shape に落ちる
