import type { ProjectBrief } from '../schema';
import type { SelectedSkillRecommendation } from '../generateFromSpec';
import { buildSelectedSkillInstallCommands } from '../selectedSkillCommands';

export function generateInstallSelectedSkillsScript(
  brief: ProjectBrief,
  selectedSkills: SelectedSkillRecommendation[],
): string {
  const commands = buildSelectedSkillInstallCommands(brief, selectedSkills);

  return `#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPOGENESIS_ROOT="\${REPOGENESIS_ROOT:-/path/to/RepoGenesis}"
GENERATOR_DIR="$REPOGENESIS_ROOT/generator"
REGISTRY_ROOT="$REPOGENESIS_ROOT/skills/registry"

if [ ! -d "$GENERATOR_DIR" ]; then
  echo "generator directory not found: $GENERATOR_DIR" >&2
  echo "Set REPOGENESIS_ROOT to your RepoGenesis checkout before running this script." >&2
  exit 1
fi

cd "$GENERATOR_DIR"
npm run build

${commands.join('\n')}
`;
}
