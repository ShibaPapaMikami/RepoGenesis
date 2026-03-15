import type { ProjectBrief } from '../schema';
import type { SelectedSkillRecommendation } from '../generateFromSpec';
import { buildSelectedSkillInstallCommands } from '../selectedSkillCommands';

export function generateSkillInstallRunbook(
  brief: ProjectBrief,
  selectedSkills: SelectedSkillRecommendation[] = [],
): string {
  const commandBlock = selectedSkills.length > 0
    ? buildSelectedSkillInstallCommands(brief, selectedSkills, '"$PROJECT_ROOT"', '"$REGISTRY_ROOT"').join('\n')
    : '';
  const recommendedSection = selectedSkills.length > 0
    ? `
## Recommended For This Project
${selectedSkills.map((skill) => `- ${skill.name} (\`${skill.id}\`, ${skill.sourceType}, ${skill.version})`).join('\n')}

## Suggested Next Step
Use the generated selection as the initial install shortlist. Review provider-specific artifacts before installing.

## Generated Install Script
- Script: \`scripts/install-selected-skills.sh\`
- Before running, set \`REPOGENESIS_ROOT\` to your local RepoGenesis checkout.

## Equivalent Commands
\`\`\`bash
PROJECT_ROOT="/path/to/generated-project"
REGISTRY_ROOT="/path/to/RepoGenesis/skills/registry"
cd /path/to/RepoGenesis/generator
npm run build
${commandBlock}
\`\`\`
`
    : '';

  return `# skill-install.md

## Purpose
This runbook explains how to add optional curated skills to ${brief.project.name}.

## Current Policy
- Skills are optional. They are not part of the core repository structure.
- Installed skills must be recorded in \`repogenesis.skills.json\`.
- Initial install mode is \`copy + pin\`.
- Skills must not auto-update without project review.
- Provider-specific artifacts are allowed when required by Codex, Claude Code, or Gemini CLI.

## Manual Install Flow
1. Choose an approved skill from the curated registry.
2. Review the skill owner, source type, risk level, and provider-specific artifacts.
3. Copy the required artifact files into the project.
4. Add or update the matching entry in \`repogenesis.skills.json\` with each installed artifact path.
5. Commit the skill files and manifest change together.

## Manual Update Flow
1. Check the currently pinned version in \`repogenesis.skills.json\`.
2. Review the changelog of the target version.
3. Replace the installed provider-specific artifacts.
4. Update the pinned version and artifact metadata in \`repogenesis.skills.json\`.
5. Review and test before merge.

## Manual Remove Flow
1. Confirm which files belong to the skill.
2. Remove the copied artifacts for each provider.
3. Remove the manifest entry from \`repogenesis.skills.json\`.
4. Review the diff to ensure no project-specific customization is lost.

## Notes
- High-risk skills should require an explicit review before install.
- Project-specific scripts, hooks, and editor settings should not be treated as curated skills by default.
- Gemini CLI artifacts may be commands, context files, or extensions instead of a single \`SKILL.md\`.
${recommendedSection}
`;
}
