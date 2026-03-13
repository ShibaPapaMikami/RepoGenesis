# VERSIONING_STANDARD.md

## Purpose
Define how this project exposes version and release identity at runtime and in Git.

## Rules

### 1. Stable releases must be tagged
- Stable releases use Git tags in the form `vMAJOR.MINOR.PATCH`.
- A stable release means:
  - production login works
  - authenticated generation works
  - ZIP download works
  - rollback target is known

### 2. Runtime must expose release identity
- Every deployable web service must expose:
  - release version
  - commit SHA
  - environment
- Exposure method is implementation-specific.
- If shown in UI, prefer a compact low-emphasis label such as `v2.2.13 (4094d23)`.
- Header display is allowed, but not required.
- It must be inspectable without reading source code.

### 3. API services must expose version identity
- APIs should expose release identity through `/healthz`, `/version`, logs, or response headers.
- At minimum, operators must be able to identify:
  - current release
  - current commit
  - deploy environment

### 4. CLI tools must expose version
- CLI tools must provide `--version` or equivalent output.
- Output should include release version when available.

### 5. Release and commit are different
- Release version is the human-facing stable label.
- Commit SHA is the exact deployed code identity.
- Both are required for operational traceability.

### 6. Generator standard
- RepoGenesis should generate a versioning standard document by default.
- RepoGenesis should prefer "traceable runtime identity" over UI-specific styling rules.
- Generated repositories should define release/version policy in repository files, not chat.

## Current RepoGenesis Convention
- Release label: environment variable driven (`VITE_RELEASE_VERSION` when set)
- Commit label: build-time Git SHA (`VERCEL_GIT_COMMIT_SHA` when available)
- Preferred UI label: `v<release> (<commit>)`
- Stable releases: Git tags on `main`
