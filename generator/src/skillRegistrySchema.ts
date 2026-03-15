import { z } from 'zod';

const skillProviderEnum = z.enum(['codex', 'claude_code', 'gemini_cli', 'tool_agnostic']);
const skillArtifactKindEnum = z.enum(['skill', 'command', 'context', 'extension', 'doc']);

export const skillRegistryArtifactSchema = z.object({
  provider: skillProviderEnum,
  artifactKind: skillArtifactKindEnum,
  entryPath: z.string().min(1, 'artifact entryPath is required'),
  readmePath: z.string().min(1).optional(),
});

export const skillRegistryItemSchema = z.object({
  id: z.string().min(1, 'skill id is required'),
  name: z.string().min(1, 'skill name is required'),
  description: z.string().min(1, 'skill description is required'),
  owner: z.string().min(1, 'skill owner is required'),
  version: z.string().min(1, 'skill version is required'),
  status: z.enum(['stable', 'experimental', 'deprecated']),
  riskLevel: z.enum(['low', 'medium', 'high']),
  sourceType: z.enum(['official', 'curated', 'internal']),
  sourceUrl: z.string().url().optional(),
  tags: z.array(z.string().min(1)).default([]),
  installMode: z.literal('copy'),
  providers: z.array(skillProviderEnum).min(1, 'at least one provider is required'),
  artifacts: z.array(skillRegistryArtifactSchema).min(1, 'at least one artifact is required'),
  reviewRequired: z.boolean(),
}).superRefine((item, ctx) => {
  for (const artifact of item.artifacts) {
    if (!item.providers.includes(artifact.provider)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['artifacts'],
        message: `artifact provider ${artifact.provider} must be included in providers`,
      });
    }
  }
});
