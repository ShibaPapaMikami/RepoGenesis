import { describe, expect, it } from 'vitest';
import { createEmptySkillsManifest } from '../src/skillsManifest';
import { projectSkillsManifestSchema } from '../src/skillsManifestSchema';
import { skillRegistryItemSchema } from '../src/skillRegistrySchema';

describe('skills manifest schema', () => {
  it('creates an empty pinned manifest', () => {
    const manifest = createEmptySkillsManifest();
    expect(manifest.version).toBe(1);
    expect(manifest.source).toBe('repogenesis');
    expect(manifest.installed).toEqual([]);
  });

  it('accepts a valid installed skill entry', () => {
    const parsed = projectSkillsManifestSchema.parse({
      version: 1,
      source: 'repogenesis',
      installed: [
        {
          id: 'review-checklist',
          version: '1.2.0',
          installedAt: '2026-03-09T00:00:00.000Z',
          sourceType: 'official',
          artifacts: [
            {
              provider: 'claude_code',
              artifactKind: 'skill',
              path: 'skills/review-checklist/SKILL.md',
            },
            {
              provider: 'gemini_cli',
              artifactKind: 'command',
              path: '.gemini/commands/review-check.toml',
            },
          ],
        },
      ],
    });
    expect(parsed.installed[0].id).toBe('review-checklist');
  });

  it('rejects entries without artifacts', () => {
    expect(() => projectSkillsManifestSchema.parse({
      version: 1,
      source: 'repogenesis',
      installed: [
        {
          id: 'review-checklist',
          version: '1.2.0',
          installedAt: '2026-03-09T00:00:00.000Z',
        },
      ],
    })).toThrow();
  });

  it('accepts a valid registry item with provider-specific artifacts', () => {
    const parsed = skillRegistryItemSchema.parse({
      id: 'review-checklist',
      name: 'Review Checklist',
      description: 'Reusable review flow for code and docs.',
      owner: 'platform',
      version: '1.0.0',
      status: 'stable',
      riskLevel: 'low',
      sourceType: 'official',
      sourceLabel: 'Example official skill',
      sourceUrl: 'https://example.com/skills/review-checklist',
      tags: ['review', 'quality'],
      installMode: 'copy',
      providers: ['codex', 'claude_code', 'gemini_cli'],
      providerSupport: [
        {
          provider: 'codex',
          supportType: 'official',
        },
        {
          provider: 'claude_code',
          supportType: 'curated',
        },
        {
          provider: 'gemini_cli',
          supportType: 'curated',
        },
      ],
      artifacts: [
        {
          provider: 'codex',
          artifactKind: 'skill',
          entryPath: 'codex/SKILL.md',
        },
        {
          provider: 'claude_code',
          artifactKind: 'skill',
          entryPath: 'claude/SKILL.md',
        },
        {
          provider: 'gemini_cli',
          artifactKind: 'command',
          entryPath: 'gemini/commands/review-check.toml',
        },
      ],
      reviewRequired: false,
    });

    expect(parsed.providers).toContain('codex');
  });

  it('rejects registry artifacts whose provider is not declared', () => {
    expect(() => skillRegistryItemSchema.parse({
      id: 'review-checklist',
      name: 'Review Checklist',
      description: 'Reusable review flow for code and docs.',
      owner: 'platform',
      version: '1.0.0',
      status: 'stable',
      riskLevel: 'low',
      sourceType: 'official',
      sourceLabel: 'Example official skill',
      tags: [],
      installMode: 'copy',
      providers: ['claude_code'],
      providerSupport: [
        {
          provider: 'claude_code',
          supportType: 'curated',
        },
      ],
      artifacts: [
        {
          provider: 'gemini_cli',
          artifactKind: 'command',
          entryPath: 'gemini/commands/review-check.toml',
        },
      ],
      reviewRequired: false,
    })).toThrow(/artifact provider gemini_cli must be included in providers/);
  });
});
