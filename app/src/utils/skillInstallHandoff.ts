import { formatAiToolNames, formatAiToolWrapperFiles, type AiTool } from '../constants/enums.ts';
import { mapAiToolToSkillProvider, type SkillCatalogItem, type SkillProvider } from '../data/skillCatalog.ts';

function resolveSkillProviders(skill: SkillCatalogItem, aiTools: AiTool[]): SkillProvider[] {
  const activeProviders = new Set(
    aiTools
      .map(mapAiToolToSkillProvider)
      .filter((provider): provider is SkillProvider => provider !== null),
  );

  const directMatches = skill.providers.filter((provider) => provider !== 'tool_agnostic' && activeProviders.has(provider));
  if (directMatches.length > 0) {
    return directMatches;
  }

  if (skill.providers.includes('tool_agnostic')) {
    return ['tool_agnostic'];
  }

  return skill.providers.filter((provider) => provider !== 'tool_agnostic');
}

export function buildSkillInstallCommands(
  projectSlug: string,
  aiTools: AiTool[],
  skills: SkillCatalogItem[],
): string[] {
  const targetProjectPlaceholder = `/path/to/unzipped/${projectSlug || 'generated-project'}`;

  return skills.map((skill) => {
    const providers = resolveSkillProviders(skill, aiTools);
    const providerArgs = providers.map((provider) => ` --provider ${provider}`).join('');
    return `node dist/index.js skills add --project "${targetProjectPlaceholder}" --registry "../skills/registry" --skill "${skill.id}"${providerArgs}`;
  });
}

export function buildSkillInstallHandoffText(
  projectSlug: string,
  aiTools: AiTool[],
  skills: SkillCatalogItem[],
): string {
  const toolNames = formatAiToolNames(aiTools);
  const wrapperFiles = formatAiToolWrapperFiles(aiTools);

  return [
    ...(toolNames ? [`# Open the generated project with ${toolNames}`] : []),
    ...(wrapperFiles ? [`# Thin wrapper files: ${wrapperFiles}`] : []),
    'cd /path/to/RepoGenesis/generator',
    'npm run build',
    ...buildSkillInstallCommands(projectSlug, aiTools, skills),
  ].join('\n');
}
