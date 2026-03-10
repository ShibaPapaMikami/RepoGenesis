import type { ProjectBrief } from '../schema';

export function generateSkillsReadme(brief: ProjectBrief): string {
  return `# skills/README.md

## Purpose
This directory is reserved for optional operational skills used by ${brief.project.name}.

RepoGenesis does not place project knowledge directly into generator core.
Instead, curated skills can be added here when the project explicitly opts in.

## Rules
- Treat skills as an optional layer, not part of the core repository constitution.
- Record every installed skill and its pinned version in \`repogenesis.skills.json\`.
- Do not auto-update skills without project review.
- Prefer \`copy + pin\` so the installed files remain reviewable in this repository.

## Expected Future Flow
1. A curated registry lists approved skills.
2. This project opts into specific skills.
3. Installed skill files are copied into this directory.
4. \`repogenesis.skills.json\` is updated with the installed versions.

## Current State
No skills are installed by default.
`;
}
