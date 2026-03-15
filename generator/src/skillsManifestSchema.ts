import { z } from 'zod';

const skillProviderEnum = z.enum(['codex', 'claude_code', 'gemini_cli', 'tool_agnostic']);
const skillArtifactKindEnum = z.enum(['skill', 'command', 'context', 'extension', 'doc']);

export const installedSkillArtifactSchema = z.object({
  provider: skillProviderEnum,
  artifactKind: skillArtifactKindEnum,
  path: z.string().min(1, 'installed artifact path is required'),
});

export const installedSkillSchema = z.object({
  id: z.string().min(1, 'skill id is required'),
  version: z.string().min(1, 'skill version is required'),
  installedAt: z.string().min(1, 'installedAt is required'),
  installedBy: z.string().min(1).optional(),
  sourceType: z.enum(['official', 'curated', 'internal']).optional(),
  artifacts: z.array(installedSkillArtifactSchema).min(1, 'at least one installed artifact is required'),
  notes: z.string().min(1).optional(),
});

export const projectSkillsManifestSchema = z.object({
  version: z.literal(1),
  source: z.literal('repogenesis'),
  installed: z.array(installedSkillSchema).default([]),
});
