import type { ProjectBrief } from '../schema';
import type { SelectedSkillRecommendation } from '../generateFromSpec';

export function generateSkillsReadme(
  brief: ProjectBrief,
  selectedSkills: SelectedSkillRecommendation[] = [],
): string {
  const recommendationLine = selectedSkills.length > 0
    ? `Recommended at generation time: ${selectedSkills.map((skill) => `${skill.name} (${skill.id})`).join(', ')}.`
    : 'No curated skills were pre-selected at generation time.';

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
- Use provider-specific artifacts when needed:
  - Codex / Claude Code: skill instructions
  - Gemini CLI: commands, context files, or extensions
- Keep the source type (\`official\`, \`curated\`, \`internal\`) traceable in the manifest.

## Expected Future Flow
1. A curated registry lists approved skills.
2. This project opts into specific skills and providers.
3. Installed provider-specific artifacts are copied into this repository.
4. \`repogenesis.skills.json\` is updated with the installed versions and artifact paths.

## Current State
No skills are installed by default.
${recommendationLine}

${selectedSkills.length > 0 ? 'Use `scripts/install-selected-skills.sh` after ZIP extraction to install the selected curated skills.' : ''}
`;
}
