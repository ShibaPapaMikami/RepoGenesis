import { describe, expect, it } from 'vitest';
import { projectBriefSchema } from '../src/schema';
import { bundleSelectedSkillsFromRegistry } from '../src/selectedSkillBundle';

const BRIEF = projectBriefSchema.parse({
  specVersion: '1.0',
  project: {
    name: 'Bundled Skill Test',
    slug: 'bundled-skill-test',
    description: 'Validate selected skill bundling',
    owner: 'Tester',
    created_at: '2026-03-15T00:00:00.000Z',
  },
  tech: {
    domains: ['web'],
    primary_language: 'typescript',
    frameworks: ['React'],
    ai_tools: ['codex'],
    ai_tool: 'other',
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
});

describe('selected skill bundle', () => {
  it('bundles registry artifacts and pre-populates the project skill manifest', () => {
    const bundled = bundleSelectedSkillsFromRegistry({
      project: BRIEF,
      selectedSkills: [
        {
          id: 'repo-readiness-review',
          name: 'Repo Readiness Review',
          version: '0.1.0',
          sourceType: 'curated',
          providers: ['codex', 'claude_code', 'gemini_cli'],
        },
      ],
      installedAt: '2026-03-15T00:00:00.000Z',
      installedBy: 'test',
    });

    expect(bundled.warnings).toEqual([]);
    expect(bundled.files).toContainEqual([
      'skills/installed/repo-readiness-review/SKILL.md',
      expect.stringContaining('# Repo Readiness Review'),
    ]);
    expect(bundled.manifest.installed).toHaveLength(1);
    expect(bundled.manifest.installed[0].id).toBe('repo-readiness-review');
    expect(bundled.manifest.installed[0].artifacts).toEqual([
      {
        provider: 'codex',
        artifactKind: 'skill',
        path: 'skills/installed/repo-readiness-review/SKILL.md',
      },
    ]);
  });

  it('bundles official skills for the active provider', () => {
    const bundled = bundleSelectedSkillsFromRegistry({
      project: BRIEF,
      selectedSkills: [
        {
          id: 'gh-fix-ci',
          name: 'GH Fix CI',
          version: '0.1.0',
          sourceType: 'official',
          providers: ['codex', 'claude_code', 'gemini_cli'],
        },
      ],
      installedAt: '2026-03-15T00:00:00.000Z',
      installedBy: 'test',
    });

    expect(bundled.warnings).toEqual([]);
    expect(bundled.files).toContainEqual([
      'skills/installed/gh-fix-ci/SKILL.md',
      expect.stringContaining('# GH Fix CI'),
    ]);
    expect(bundled.manifest.installed[0].sourceType).toBe('official');
  });
});
