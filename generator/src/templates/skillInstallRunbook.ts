import type { ProjectBrief } from '../schema';

export function generateSkillInstallRunbook(brief: ProjectBrief): string {
  return `# skill-install.md

## Purpose
This runbook explains how to add optional curated skills to ${brief.project.name}.

## Current Policy
- Skills are optional. They are not part of the core repository structure.
- Installed skills must be recorded in \`repogenesis.skills.json\`.
- Initial install mode is \`copy + pin\`.
- Skills must not auto-update without project review.

## Manual Install Flow
1. Choose an approved skill from the curated registry.
2. Review the skill owner, risk level, and compatible tool.
3. Copy the skill files into \`skills/\`.
4. Add or update the matching entry in \`repogenesis.skills.json\`.
5. Commit the skill files and manifest change together.

## Manual Update Flow
1. Check the currently pinned version in \`repogenesis.skills.json\`.
2. Review the changelog of the target version.
3. Replace the installed files under \`skills/\`.
4. Update the pinned version in \`repogenesis.skills.json\`.
5. Review and test before merge.

## Manual Remove Flow
1. Confirm which files belong to the skill.
2. Remove the copied files from \`skills/\`.
3. Remove the manifest entry from \`repogenesis.skills.json\`.
4. Review the diff to ensure no project-specific customization is lost.

## Notes
- High-risk skills should require an explicit review before install.
- Project-specific scripts, hooks, and editor settings should not be treated as curated skills by default.
`;
}
