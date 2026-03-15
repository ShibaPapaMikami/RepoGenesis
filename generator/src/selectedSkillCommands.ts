import { normalizeAiTools } from './aiTools';
import type { ProjectBrief } from './schema';
import type { SkillProvider } from './skillsManifest';
import type { SelectedSkillRecommendation } from './generateFromSpec';

function resolveActiveProviders(brief: ProjectBrief): Set<SkillProvider> {
  const tools = normalizeAiTools(brief.tech);
  const providers = new Set<SkillProvider>();
  if (tools.includes('codex')) providers.add('codex');
  if (tools.includes('claude_code')) providers.add('claude_code');
  if (tools.includes('gemini_cli')) providers.add('gemini_cli');
  return providers;
}

function resolveSkillProviders(
  brief: ProjectBrief,
  skill: SelectedSkillRecommendation,
): SkillProvider[] {
  const activeProviders = resolveActiveProviders(brief);
  const directMatches = skill.providers.filter((provider) => provider !== 'tool_agnostic' && activeProviders.has(provider));

  if (directMatches.length > 0) {
    return directMatches;
  }

  if (skill.providers.includes('tool_agnostic')) {
    return ['tool_agnostic'];
  }

  return skill.providers.filter((provider) => provider !== 'tool_agnostic');
}

export function buildSelectedSkillInstallCommands(
  brief: ProjectBrief,
  selectedSkills: SelectedSkillRecommendation[],
  projectRootExpr = '"$PROJECT_ROOT"',
  registryExpr = '"$REGISTRY_ROOT"',
): string[] {
  return selectedSkills.map((skill) => {
    const providers = resolveSkillProviders(brief, skill);
    const providerArgs = providers.map((provider) => ` --provider ${provider}`).join('');
    return `node dist/index.js skills add --project ${projectRootExpr} --registry ${registryExpr} --skill "${skill.id}"${providerArgs}`;
  });
}
