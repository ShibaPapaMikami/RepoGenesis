import { z } from 'zod';

const skillProviderEnum = z.enum(['codex', 'claude_code', 'gemini_cli', 'tool_agnostic']);
const skillArtifactKindEnum = z.enum(['skill', 'command', 'context', 'extension', 'doc']);
const skillProviderSupportTypeEnum = z.enum(['official', 'curated']);

export const skillRegistryArtifactSchema = z.object({
  provider: skillProviderEnum,
  artifactKind: skillArtifactKindEnum,
  entryPath: z.string().min(1, 'artifact entryPath is required'),
  readmePath: z.string().min(1).optional(),
});

export const skillRegistryProviderSupportSchema = z.object({
  provider: skillProviderEnum,
  supportType: skillProviderSupportTypeEnum,
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
  sourceLabel: z.string().min(1, 'skill sourceLabel is required'),
  sourceUrl: z.string().url().optional(),
  tags: z.array(z.string().min(1)).default([]),
  installMode: z.literal('copy'),
  providers: z.array(skillProviderEnum).min(1, 'at least one provider is required'),
  providerSupport: z.array(skillRegistryProviderSupportSchema).min(1, 'at least one provider support entry is required'),
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

  const providerSupportEntries = new Set(item.providerSupport.map((entry) => entry.provider));
  for (const entry of item.providerSupport) {
    if (!item.providers.includes(entry.provider)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['providerSupport'],
        message: `providerSupport provider ${entry.provider} must be included in providers`,
      });
    }
  }

  for (const provider of item.providers) {
    if (!providerSupportEntries.has(provider)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['providerSupport'],
        message: `providerSupport entry is required for provider ${provider}`,
      });
    }
  }
});
