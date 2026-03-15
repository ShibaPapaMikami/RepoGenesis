# Skill Registry

## Purpose
This directory stores curated skill registry entries that RepoGenesis can reference.

The initial goal is not to vendor every upstream "official" skill body.
Instead, we keep:

- registry metadata
- provider-specific artifact wrappers
- links back to official provider documentation

## Source Policy
- `official`: provider-owned artifacts or content that can be adopted as-is
- `curated`: RepoGenesis-managed wrappers that follow an official provider mechanism
- `internal`: team-local skills that are not intended for general distribution

Current entries are primarily `curated`.
They align to official provider formats for:

- Codex skills
- Claude Code skills
- Gemini CLI commands / context / extensions

## Layout
Each skill should live under:

```text
skills/registry/<source-group>/<skill-id>/
  skill.json
  common/
  codex/
  claude/
  gemini/
```

The registry item is the source of truth.
Artifact files are copied into generated projects only after explicit install.
