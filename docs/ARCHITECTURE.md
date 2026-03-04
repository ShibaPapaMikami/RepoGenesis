# ARCHITECTURE.md — System Architecture

## System Overview
RepoGenesis is a two-stage pipeline:

```
[Web Form] → [project_spec.json] → [Generator] → [Repository Files]
```

For local usage, Web Form can also run Generator directly in browser and download ZIP:

```
[Web Form] → [generateFromSpec] → [ZIP Download]
```

Future Web system (OAuth) keeps generator isolated:

```
[Web UI] → [OAuth/AuthZ] → [Orchestration API] → [generateFromSpec] → [ZIP or Files]
```

### Stage 1: Web Form
- Collects structured project information from user
- Validates input
- Outputs a single JSON file: `project_spec.json` (`specVersion` required)
- Can execute in-browser generation and download a repository ZIP (no backend)
- Manual verification checklist: `docs/ZIP_MANUAL_CHECKLIST.md`

### Stage 2: Generator
- Reads `project_spec.json` (ProjectSpec)
- Applies templates to generate files
- Creates folder structure
- Outputs all files to a target directory

## Data Flow

```
User Input (Browser)
    │
    ▼
Web Form (Frontend)
    │
    ▼
project_spec.json
    │
    ▼
Generator (Node.js)
    │
    ├── claude.md
    ├── docs/ACTIVE_CONTEXT.md
    ├── docs/REQUIREMENTS.md
    ├── docs/ARCHITECTURE.md
    ├── docs/ROADMAP.md
    ├── docs/ADR/0000-template.md
    ├── .repogenesis/manifest.json
    ├── plans/template.md
    ├── prompts/restart.md
    ├── SECURITY.md
    ├── .env.example
    └── .gitignore
```

## Key Design Decisions
- Generator is file-based (no database, no server state)
- All output is static files (markdown, json, gitignore)
- project_spec.json is the single input contract between Form and Generator
- Templates are embedded in the generator (not fetched remotely)
- OAuth/auth is an execution boundary only; it must not change generated content (ADR-0003)

## OAuth Boundary Rule
- `@gugenka/auth` is used for identity and authorization only.
- `generateFromSpec` input is always `ProjectSpec` (+ generation metadata), never auth context.
- Same `ProjectSpec` must produce same file set in CLI and Web.
- Audit trails are stored outside generated repository structure.
- API contract reference: `docs/OAUTH_ORCHESTRATION_API.md`

## Multi-Repo Mode
When multi-repo is enabled:
- Each sub-repo gets its own claude.md and docs/
- A workspace root gets GLOBAL_CONTEXT.md
- project_spec.json includes a `repos[]` array

## Technology
- Frontend: TBD (Phase 1)
- Generator: Node.js (Phase 2)
- Auth (future): `@gugenka/auth` (boundary layer)
- Output format: Markdown, JSON, plain text
- No database required
- No server required for generation (can run locally)
