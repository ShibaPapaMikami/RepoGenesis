import { z } from 'zod';

const compatibleToolEnum = z.enum(['claude_code', 'gemini_cli', 'tool_agnostic']);

export const installedSkillSchema = z.object({
  id: z.string().min(1, 'skill id is required'),
  version: z.string().min(1, 'skill version is required'),
  installedAt: z.string().min(1, 'installedAt is required'),
  installedBy: z.string().min(1).optional(),
  compatibleTool: compatibleToolEnum.optional(),
  path: z.string().min(1, 'installed path is required'),
  notes: z.string().min(1).optional(),
});

export const projectSkillsManifestSchema = z.object({
  version: z.literal(1),
  source: z.literal('repogenesis'),
  installed: z.array(installedSkillSchema).default([]),
});

export type InstalledSkill = z.infer<typeof installedSkillSchema>;
export type ProjectSkillsManifest = z.infer<typeof projectSkillsManifestSchema>;

export function createEmptySkillsManifest(): ProjectSkillsManifest {
  return projectSkillsManifestSchema.parse({
    version: 1,
    source: 'repogenesis',
    installed: [],
  });
}
