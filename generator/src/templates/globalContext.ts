import type { ProjectBrief } from '../schema';
import { getAdoptedDependencySummaryLines, getAdoptedTechSummaryLines } from '../planning';
import { formatOwner } from '../templateDisplay';

export function generateGlobalContext(brief: ProjectBrief): string {
  const { project, structure } = brief;
  const adoptedTech = getAdoptedTechSummaryLines(brief);
  const adoptedDependencies = getAdoptedDependencySummaryLines(brief);

  const repoList = structure.repos.map((r) => {
    const deps = r.depends_on.length > 0 ? ` → depends on: ${r.depends_on.join(', ')}` : '';
    return `- **${r.name}** (${r.type}): ${r.description} — Owner: ${formatOwner(r.owner)}${deps}`;
  }).join('\n');

  const depsWithRelations = structure.repos.filter((r) => r.depends_on.length > 0);
  let depGraph = '';
  if (depsWithRelations.length > 0) {
    const lines = depsWithRelations.map((r) =>
      r.depends_on.map((dep) => `  ${r.name} → ${dep}`).join('\n'),
    ).join('\n');
    depGraph = `

## Dependency Graph
\`\`\`
${lines}
\`\`\``;
  }

  return `# GLOBAL_CONTEXT.md — Multi-Repository Workspace

## Project
${project.name} — ${project.description}

## Owner
${formatOwner(project.owner)}

## Repositories
${repoList}
${depGraph}

## Shared Decisions
${adoptedTech.length > 0 ? adoptedTech.map((line) => `- ${line}`).join('\n') : '- No adopted technology decisions were captured at generation time.'}

## Shared External Dependencies
${adoptedDependencies.length > 0 ? adoptedDependencies.map((line) => `- ${line}`).join('\n') : '- No adopted external dependencies were captured at generation time.'}

## Cross-Repo Conventions
- Each repository has its own \`PROJECT.md\` with repository-specific rules.
- Tool-specific wrappers such as \`CLAUDE.md\` and \`GEMINI.md\` are thin adapters only.
- Shared decisions are documented in this file.
- Workspace-level technology decisions live in \`docs/TECH_DECISIONS.md\`.
- Workspace-level external dependencies live in \`docs/EXTERNAL_DEPENDENCIES.md\`.
- Dependencies between repos should be managed explicitly.
- When a change in one repo affects another, update both repos' \`ACTIVE_CONTEXT.md\`.
`;
}
