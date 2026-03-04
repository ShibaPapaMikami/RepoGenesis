# RepoGenesis — Project Constitution

## What is this project?
RepoGenesis is a Gugenka internal tool that generates standardized AI-ready repository structures from Web Form input. It outputs claude.md, documentation templates, and folder structures that enable session-independent development with Claude CLI.

## Tech Stack
- Frontend: (TBD — to be decided in Phase 1)
- Generator: Node.js
- Output: Markdown files, JSON, folder structure
- Target: Claude CLI consumption

## Development Workflow

### Roles
- **Claude Chat（デスクトップ版）**: 計画・設計・レビュー・議論のみ。直接ファイルを書き込まない。
- **Claude Code CLI**: 実装・ファイル生成・編集・テストの実行。

### Rules
- Chat側はコード生成やファイル書き込みを行わない。設計とCLI向け指示の作成に専念する。
- CLI側はclaude.mdとdocs/を読んでから作業を開始する。
- ChatからCLIへの指示は、何を・なぜ・どのファイルに、を明記すること。
- 実装の判断が必要な場合、CLIはclaude.mdのルールに従い、不明点はユーザーに確認する。

## Absolute Rules

### 1. No Guessing
- Do not infer project state, phase, or intent.
- If information is missing, ask. Do not fill in.
- Never use "想定通り", "自然", "おそらく" or similar assumption language.
- Every claim must have a verifiable source (file, user statement, or tool output).

### 2. Security
- Never output real API keys, tokens, or credentials.
- Never store secrets in markdown or JSON.
- Always use placeholders: `YOUR_API_KEY_HERE`, `YOUR_SECRET_HERE`.
- Never echo back credentials if user pastes them.
- Never suggest committing .env or secret files.
- .env must always be in .gitignore.

### 3. File Authority
- `docs/ACTIVE_CONTEXT.md` is the single source of truth for current project state.
- `docs/ROADMAP.md` is the single source of truth for phase progression.
- `docs/REQUIREMENTS.md` is the single source of truth for what the system must do.
- If any conflict exists between conversation and files, files win.

### 4. Session Protocol
- On every new session or restart, read these files first:
  1. `claude.md` (this file)
  2. `docs/ACTIVE_CONTEXT.md`
  3. `docs/REQUIREMENTS.md`
- Summarize current state before taking any action.
- Never continue work without confirming state from files.

### 5. Work Protocol
- Propose exactly one next step at a time.
- Do not present multiple branching options unless explicitly asked.
- Before writing any file, state what will be written and why.
- After writing, confirm what was written with file path.

### 6. ADR (Architecture Decision Record) Triggers
Create a new ADR when:
- A technology choice is made (framework, library, service)
- A structural decision changes the folder layout
- A security policy is added or modified
- A workflow is formalized

### 7. ACTIVE_CONTEXT Update Triggers
Update ACTIVE_CONTEXT.md when:
- A phase is started or completed
- A blocker is identified or resolved
- A decision is made that changes scope
- Files are created or structurally changed

## Repository Structure
```
RepoGenesis/
├── claude.md                  # This file — project constitution
├── docs/
│   ├── ACTIVE_CONTEXT.md      # Current state (single source of truth)
│   ├── ARCHITECTURE.md        # System architecture
│   ├── REQUIREMENTS.md        # Functional requirements
│   ├── ROADMAP.md             # Phase plan
│   └── ADR/
│       └── 0000-template.md   # ADR template
├── prompts/
│   └── restart.md             # Session restart template
├── SECURITY.md                # Security policy
├── .env.example               # Environment variable template
└── .gitignore                 # Git ignore rules
```
