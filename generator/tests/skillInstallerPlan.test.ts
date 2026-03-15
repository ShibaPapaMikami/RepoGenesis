import { describe, expect, it } from 'vitest';
import { createEmptySkillsManifest } from '../src/skillsManifest';
import {
  applySkillInstallPlanToManifest,
  applySkillRemovalToManifest,
  planSkillInstall,
  planSkillRemoval,
} from '../src/skillInstallerPlan';
import type { ProjectBrief } from '../src/schema';
import type { SkillRegistryItem } from '../src/skillRegistry';

const PROJECT: ProjectBrief = {
  project: {
    name: 'Skill Test',
    slug: 'skill-test',
    description: 'Skill installer planning test project',
    owner: 'Tester',
    created_at: '2026-03-15T00:00:00.000Z',
  },
  tech: {
    domains: ['web'],
    primary_language: 'typescript',
    frameworks: [],
    ai_tools: ['claude_code', 'gemini_cli'],
    ai_tool: 'claude_cli',
    ai_tool_detail: '',
  },
  security: {
    level: 'low',
    has_api_keys: false,
    has_user_data: false,
    has_payment_data: false,
    has_ip_sensitive: false,
    has_credentials: false,
  },
  structure: {
    repo_type: 'single',
    repos: [],
  },
  workflow: {
    phases_count: 3,
  },
};

const REGISTRY_ITEM: SkillRegistryItem = {
  id: 'repo-readiness-review',
  name: 'Repo Readiness Review',
  description: 'Review generated repositories',
  owner: 'repogenesis',
  version: '0.1.0',
  status: 'stable',
  riskLevel: 'low',
  sourceType: 'curated',
  tags: ['review'],
  installMode: 'copy',
  providers: ['codex', 'claude_code', 'gemini_cli'],
  artifacts: [
    { provider: 'codex', artifactKind: 'skill', entryPath: 'codex/SKILL.md' },
    { provider: 'claude_code', artifactKind: 'skill', entryPath: 'claude/SKILL.md' },
    { provider: 'gemini_cli', artifactKind: 'command', entryPath: 'gemini/commands/repo-readiness.toml' },
  ],
  reviewRequired: false,
};

describe('skill installer plan', () => {
  it('plans provider-matched artifact installs from project ai tools', () => {
    const plan = planSkillInstall({
      project: PROJECT,
      registryItem: REGISTRY_ITEM,
      manifest: createEmptySkillsManifest(),
    });

    expect(plan.providers).toEqual(['claude_code', 'gemini_cli']);
    expect(plan.artifacts).toEqual([
      {
        provider: 'claude_code',
        artifactKind: 'skill',
        sourcePath: 'claude/SKILL.md',
        targetPath: '.claude/skills/SKILL.md',
      },
      {
        provider: 'gemini_cli',
        artifactKind: 'command',
        sourcePath: 'gemini/commands/repo-readiness.toml',
        targetPath: '.gemini/commands/repo-readiness.toml',
      },
    ]);
  });

  it('warns when a skill is already in the manifest', () => {
    const plan = planSkillInstall({
      project: PROJECT,
      registryItem: REGISTRY_ITEM,
      manifest: {
        version: 1,
        source: 'repogenesis',
        installed: [
          {
            id: 'repo-readiness-review',
            version: '0.0.9',
            installedAt: '2026-03-14T00:00:00.000Z',
            artifacts: [
              {
                provider: 'claude_code',
                artifactKind: 'skill',
                path: '.claude/skills/SKILL.md',
              },
            ],
          },
        ],
      },
    });

    expect(plan.warnings.some((warning) => warning.includes('manifest に既に存在'))).toBe(true);
  });

  it('applies an install plan into manifest state', () => {
    const plan = planSkillInstall({
      project: PROJECT,
      registryItem: REGISTRY_ITEM,
      manifest: createEmptySkillsManifest(),
    });

    const nextManifest = applySkillInstallPlanToManifest({
      manifest: createEmptySkillsManifest(),
      plan,
      installedAt: '2026-03-15T01:00:00.000Z',
      installedBy: 'codex',
    });

    expect(nextManifest.installed).toEqual([
      {
        id: 'repo-readiness-review',
        version: '0.1.0',
        installedAt: '2026-03-15T01:00:00.000Z',
        installedBy: 'codex',
        sourceType: 'curated',
        artifacts: [
          {
            provider: 'claude_code',
            artifactKind: 'skill',
            path: '.claude/skills/SKILL.md',
          },
          {
            provider: 'gemini_cli',
            artifactKind: 'command',
            path: '.gemini/commands/repo-readiness.toml',
          },
        ],
        notes: undefined,
      },
    ]);
  });

  it('plans and applies manifest removal', () => {
    const manifest = {
      version: 1 as const,
      source: 'repogenesis' as const,
      installed: [
        {
          id: 'repo-readiness-review',
          version: '0.1.0',
          installedAt: '2026-03-15T01:00:00.000Z',
          sourceType: 'curated' as const,
          artifacts: [
            {
              provider: 'claude_code' as const,
              artifactKind: 'skill' as const,
              path: '.claude/skills/SKILL.md',
            },
          ],
        },
      ],
    };

    const removal = planSkillRemoval({
      manifest,
      skillId: 'repo-readiness-review',
    });
    expect(removal.found).toBe(true);
    expect(removal.removedArtifacts).toEqual([
      {
        provider: 'claude_code',
        artifactKind: 'skill',
        path: '.claude/skills/SKILL.md',
      },
    ]);

    const nextManifest = applySkillRemovalToManifest({
      manifest,
      skillId: 'repo-readiness-review',
    });
    expect(nextManifest.installed).toEqual([]);
  });

  it('warns when removal target is absent', () => {
    const removal = planSkillRemoval({
      manifest: createEmptySkillsManifest(),
      skillId: 'missing-skill',
    });

    expect(removal.found).toBe(false);
    expect(removal.warnings).toEqual(['manifest に対象 skill が見つかりません。']);
  });
});
