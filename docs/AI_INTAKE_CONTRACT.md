# AI_INTAKE_CONTRACT.md

## Purpose
`相談結果を反映` モードで受け取る入力と、RepoGenesis が内部で扱う draft 出力の最小契約を定義する。
目的は、UI 実装・parser 実装・将来の AI API 連携を同じ契約に揃えることにある。

## Input Model
最初の対象は markdown 形式の貼り付け入力。
完全 JSON を要求しない。

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
- `## 補足`

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
  extracted: {
    summary: string | null;
    users: string[];
    problem: string | null;
    firstDeliverable: string | null;
    dataKinds: string[];
    integrations: string[];
    candidateInputs: string[];
    openQuestions: string[];
  };
  suggestions: {
    projectName?: string;
    projectDescription?: string;
    domains?: string[];
    securityLevel?: 'low' | 'medium' | 'high';
    repoType?: 'single' | 'multi';
    hasApiKeys?: boolean;
    hasUserData?: boolean;
    hasCredentials?: boolean;
  };
  certainty: {
    confirmed: string[];
    provisional: string[];
    unresolved: string[];
  };
};
```

## Mapping Rules
### Deterministic only
- parser は明示的な記述だけを使う
- ルールにない推測は `unresolved` に送る
- `single / multi` は明記されない限り確定しない

### Conservative defaults
- `repoType` は未記載なら `single` 仮置きにできるが、`provisional` に記録する
- `hasApiKeys` は外部連携候補があるだけでは `true` にしない
- `hasUserData` は個人情報・顧客情報・アカウント情報の明示がある場合のみ `true`
- `securityLevel` は `payment data` / `credentials` / 強い機密情報が無ければ原則 `medium` 仮置き

### Facts / Assumptions / Open Questions
- facts: 入力文中に明示されている内容
- assumptions: 生成のために仮置きした内容
- open questions: 生成前に確認すべき内容

## Output to Form State
`IntakeDraft` から既存 form state へ反映する時は以下を守る。

- 既存 state shape は変えない
- 仮置き値は UI 上で見分けられる必要がある
- `未確定` はチェックリストとして別表示する
- 詳細入力へ遷移しても rawText と openQuestions は失わない

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

## Immediate Implementation Target
Phase A の初回実装では次だけを満たせばよい。

1. markdown を貼れる
2. 見出しごとに分割できる
3. `summary / users / problem / openQuestions` を抽出できる
4. 既存 form state に最低限の draft を反映できる
5. 未確定事項を確認画面に出せる
