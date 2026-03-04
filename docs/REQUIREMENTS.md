# REQUIREMENTS.md — Functional Requirements

## Purpose
Define what RepoGenesis must do. This is the single source of truth for functional requirements.

## Core Requirements

### R1: Web Form Input
- The system must provide a web form that collects project information.
- The form must validate all required fields before submission.
- The form must output `project_brief.json`.

#### project_brief.json Schema

```json
{
  "project": {
    "name": "string (必須) — 表示名。日本語OK",
    "slug": "string (必須) — フォルダ名/URL用。/^[a-z0-9][a-z0-9\\-]*$/",
    "description": "string (必須) — プロジェクト概要。10文字以上",
    "owner": "string (必須) — 責任者名",
    "created_at": "string (自動生成) — ISO8601"
  },
  "tech": {
    "domains": "string[] (必須、1つ以上) — enum: 'web' | 'mobile' | 'unity' | 'xr' | 'ai' | 'infra' | 'cli' | 'iot'",
    "primary_language": "string (必須) — enum: 'typescript' | 'python' | 'csharp' | 'swift' | 'go' | 'rust' | 'kotlin' | 'other'",
    "frameworks": "string[] (任意) — 自由入力の補助情報",
    "ai_tool": "string (必須) — 'claude_cli' | 'other'",
    "ai_tool_detail": "string (任意) — 将来拡張用。ai_tool='other'時の補足"
  },
  "security": {
    "level": "string (必須、保存フィールド) — 'low' | 'medium' | 'high'。フラグから自動算出し、上方向のみ手動上書き可。最終値を保存する。",
    "has_api_keys": "boolean (必須、デフォルトfalse)",
    "has_user_data": "boolean (必須、デフォルトfalse)",
    "has_payment_data": "boolean (必須、デフォルトfalse)",
    "has_ip_sensitive": "boolean (必須、デフォルトfalse)",
    "has_credentials": "boolean (必須、デフォルトfalse)"
  },
  "structure": {
    "repo_type": "string (必須) — 'single' | 'multi'",
    "repos": [
      {
        "name": "string (必須) — リポジトリ名。slug形式。リスト内でユニーク",
        "type": "string (必須) — enum: 'frontend' | 'backend' | 'infra' | 'sdk' | 'unity' | 'mobile' | 'ops'",
        "description": "string (必須) — このリポジトリの責務",
        "owner": "string (必須) — このリポジトリの責任者",
        "depends_on": "string[] (任意) — 依存先リポジトリ名。repos[].nameの集合のみ参照可。自己参照禁止"
      }
    ]
  },
  "workflow": {
    "phases_count": "number (任意) — 1〜10。デフォルト3"
  }
}
```

#### domains 定義

| 値 | 意味 | 備考 |
|---|---|---|
| `web` | Webアプリ/サイト | |
| `mobile` | iOS/Android | |
| `unity` | Unity実装基盤 | XR以外にも使う |
| `xr` | XR体験領域（VR/AR/MR） | 実装手段は問わない。unityやwebと組み合わせて使用 |
| `ai` | AI/ML機能 | |
| `infra` | インフラ/DevOps | |
| `cli` | コマンドラインツール | |
| `iot` | IoTデバイス連携 | |

#### security.level 自動決定ルール

| 条件 | 最低レベル |
|---|---|
| `has_payment_data=true` OR `has_credentials=true` | `high` 強制 |
| `has_user_data=true` OR `has_ip_sensitive=true` | `medium` 以上 |
| 上記いずれもfalse | `low` 可 |

- フォーム側でフラグ変更時に自動算出する。
- ユーザーは上方向のみ手動上書き可（下げることは不可）。
- 最終的に決定された値を `security.level` として保存する。

#### multi時バリデーションルール

| ルール | 内容 |
|---|---|
| repos必須 | `repo_type="multi"` のとき `repos` は1つ以上必須 |
| name一意 | `repos[].name` はリスト内でユニーク |
| depends_on参照整合性 | `repos[].depends_on` の各値は `repos[].name` の集合に存在すること |
| 自己参照禁止 | `repos[].depends_on` に自身のnameを含めない |

#### Webフォーム項目 対応表

| フォームUI | 入力タイプ | スキーマ | バリデーション |
|---|---|---|---|
| プロジェクト名 | テキスト | `project.name` | 必須。空文字不可 |
| スラッグ | テキスト（自動生成+手動修正可） | `project.slug` | 必須。`/^[a-z0-9][a-z0-9\-]*$/` |
| 概要 | テキストエリア | `project.description` | 必須。10文字以上 |
| 責任者 | テキスト | `project.owner` | 必須 |
| 技術ドメイン | チェックボックス群 | `tech.domains` | 必須。1つ以上選択 |
| 主要言語 | セレクトボックス | `tech.primary_language` | 必須。1つ選択 |
| フレームワーク | タグ入力（自由） | `tech.frameworks` | 任意 |
| AI開発ツール | ラジオボタン | `tech.ai_tool` | 必須 |
| AI開発ツール詳細 | テキスト | `tech.ai_tool_detail` | 任意。ai_tool='other'時のみ表示 |
| セキュリティレベル | 表示+手動上書き | `security.level` | 必須。フラグから自動算出。上方向のみ変更可 |
| APIキー使用 | トグル | `security.has_api_keys` | 必須（デフォルトfalse） |
| ユーザーデータ | トグル | `security.has_user_data` | 必須（デフォルトfalse） |
| 決済データ | トグル | `security.has_payment_data` | 必須（デフォルトfalse） |
| IP機密 | トグル | `security.has_ip_sensitive` | 必須（デフォルトfalse） |
| 鍵・証明書 | トグル | `security.has_credentials` | 必須（デフォルトfalse） |
| リポジトリ構成 | ラジオボタン | `structure.repo_type` | 必須 |
| サブリポジトリ定義 | 動的追加フォーム | `structure.repos[]` | multi時のみ表示・必須 |
| 初期フェーズ数 | 数値入力 | `workflow.phases_count` | 任意。1〜10。デフォルト3 |

#### セキュリティフラグ → テンプレ分岐マッピング

| フラグ | 影響するファイル | 影響内容 |
|---|---|---|
| `has_api_keys` | `.env.example`, `.gitignore`, `SECURITY.md` | API_KEY項目追加、シークレットスキャン推奨 |
| `has_user_data` | `SECURITY.md` | 個人情報取扱ポリシー追加 |
| `has_payment_data` | `SECURITY.md`, `claude.md` | PCI DSS参照、決済データ禁止ルール追加 |
| `has_ip_sensitive` | `SECURITY.md`, `.gitignore`, `claude.md` | NDA注意、クライアント情報記載禁止ルール |
| `has_credentials` | `.env.example`, `.gitignore`, `SECURITY.md` | 証明書パス除外、ローテーションポリシー追加 |

### R2: File Generation
- The system must generate the following files from `project_brief.json`:
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
- All generated files must contain usable content (not empty placeholders).
- All generated files must reflect the project information from the form.

### R3: Security
- The system must never include real API keys, tokens, or secrets in output.
- `.env` must always be listed in `.gitignore`.
- `SECURITY.md` content must vary by security level and security flags.
- `.env.example` must use placeholder values only.
- `security.level` varies generated content per the flag-to-template mapping above.

### R4: Multi-Repo Support
- If `repo_type="multi"`, the system must generate per-repo structures.
- A workspace root must include `GLOBAL_CONTEXT.md`.
- Each sub-repo must have its own `claude.md` and `docs/`.
- Multi-repo validation rules (name uniqueness, depends_on integrity, no self-reference) must be enforced at form submission.

### R5: Session Recovery
- `prompts/restart.md` must instruct AI to:
  1. Read `claude.md`
  2. Read `docs/ACTIVE_CONTEXT.md`
  3. Summarize current state before continuing

### R6: Output Delivery
- Generated files must be downloadable as a zip or placed into a target directory.
- File encoding: UTF-8.
- Line endings: LF (Unix-style).

## Non-Requirements
- The system does not manage deployment.
- The system does not store secrets.
- The system does not replace CI/CD.
- The system does not replace human code review.
