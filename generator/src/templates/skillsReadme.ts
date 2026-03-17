import type { ProjectBrief } from '../schema';
import type { SelectedSkillRecommendation } from '../generateFromSpec';

export function generateSkillsReadme(
  brief: ProjectBrief,
  selectedSkills: SelectedSkillRecommendation[] = [],
  options?: { bundledAtGeneration?: boolean },
): string {
  const bundledAtGeneration = options?.bundledAtGeneration ?? false;
  const recommendationLine = selectedSkills.length > 0
    ? `Selected AI work guides at generation time: ${selectedSkills.map((skill) => `${skill.name} (${skill.id})`).join(', ')}.`
    : 'No AI work guides were pre-selected at generation time.';
  const currentState = bundledAtGeneration
    ? 'The selected AI work guides are already bundled in this repository and recorded in `repogenesis.skills.json`.'
    : 'No AI work guides are installed by default.';

  return `# skills/README.md

## Purpose
This directory is reserved for optional AI work guides used by ${brief.project.name}.

RepoGenesis does not place project knowledge directly into generator core.
Instead, optional AI work guides can be added here when the project explicitly opts in.

## Rules
- Treat AI work guides as an optional layer, not part of the core repository constitution.
- Record every installed guide and its pinned version in \`repogenesis.skills.json\`.
- Do not auto-update guides without project review.
- Prefer \`copy + pin\` so the installed files remain reviewable in this repository.
- Use provider-specific artifacts when needed:
  - Codex / Claude Code: skill instructions
  - Gemini CLI: commands, context files, or extensions
- Keep the source type (\`official\`, \`curated\`, \`internal\`) traceable in the manifest.
- Bundled guides do not run automatically. They help when you work with this repository in the supported AI tool.

## Expected Future Flow
1. A curated registry lists approved AI work guides.
2. This project opts into specific guides and providers.
3. Installed provider-specific artifacts are copied into this repository.
4. \`repogenesis.skills.json\` is updated with the installed versions and artifact paths.

## Current State
${currentState}
${recommendationLine}

${selectedSkills.length > 0 && !bundledAtGeneration ? 'Use `scripts/install-selected-skills.sh` after ZIP extraction to add the selected AI work guides.' : ''}
`;
}
