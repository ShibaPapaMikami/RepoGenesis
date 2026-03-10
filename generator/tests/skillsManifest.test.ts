import { describe, expect, it } from 'vitest';
import { createEmptySkillsManifest } from '../src/skillsManifest';
import { projectSkillsManifestSchema } from '../src/skillsManifestSchema';

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
          compatibleTool: 'claude_code',
          path: 'skills/review-checklist',
        },
      ],
    });
    expect(parsed.installed[0].id).toBe('review-checklist');
  });

  it('rejects entries without path', () => {
    expect(() => projectSkillsManifestSchema.parse({
      version: 1,
      source: 'repogenesis',
      installed: [
        {
          id: 'review-checklist',
          version: '1.2.0',
          installedAt: '2026-03-09T00:00:00.000Z',
          compatibleTool: 'claude_code',
        },
      ],
    })).toThrow();
  });
});
