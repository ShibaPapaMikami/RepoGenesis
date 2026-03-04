# test — Repository Constitution

## Part of
テスト (workspace: test)

## Repository Info
- **Name**: test
- **Type**: backend
- **Description**: テスト
- **Owner**: 荻谷

## Tech Stack
- Primary Language: swift
- AI Tool: Claude CLI

## Development Workflow

### Roles
- **Claude Chat**: Planning, design, review only.
- **Claude Code CLI**: Implementation, file generation, testing.

### Rules
- Read claude.md and docs/ before starting work.
- If unsure, ask — do not guess.

## Absolute Rules
Same as workspace-level rules. See GLOBAL_CONTEXT.md for cross-repo conventions.

### File Authority
- `docs/ACTIVE_CONTEXT.md` is the source of truth for this repository's current state.
- For workspace-level context, see `../GLOBAL_CONTEXT.md`.

### Session Protocol
1. Read this `claude.md`
2. Read `docs/ACTIVE_CONTEXT.md`
3. Read `../GLOBAL_CONTEXT.md` (workspace context)
4. Summarize state before acting.
