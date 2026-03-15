import { z } from 'zod';
import { deriveLegacyAiTool, deriveLegacyAiToolDetail, type AiTool, type LegacyAiTool, normalizeAiTools } from './aiTools';

const domainEnum = z.enum(['web', 'mobile', 'unity', 'xr', 'ai', 'infra', 'cli', 'iot']);
const primaryLanguageEnum = z.enum(['typescript', 'python', 'csharp', 'swift', 'go', 'rust', 'kotlin', 'other']);
const aiToolEnum = z.enum(['codex', 'claude_code', 'gemini_cli', 'other']);
const legacyAiToolEnum = z.enum(['claude_cli', 'other']);
const securityLevelEnum = z.enum(['low', 'medium', 'high']);
const repoTypeEnum = z.enum(['single', 'multi']);
const repoKindEnum = z.enum(['frontend', 'backend', 'infra', 'sdk', 'unity', 'mobile', 'ops']);

const slugRegex = /^[a-z0-9][a-z0-9-]*$/;

const projectSchema = z.object({
  name: z.string().min(1, 'プロジェクト名は必須です'),
  slug: z.string().regex(slugRegex, 'スラッグは英小文字・数字・ハイフンのみ（先頭は英数字）'),
  description: z.string().min(10, '概要は10文字以上で入力してください'),
  owner: z.string().min(1, '責任者は必須です'),
  created_at: z.string(),
});

type NormalizedTech = {
  domains: z.infer<typeof domainEnum>[];
  primary_language: z.infer<typeof primaryLanguageEnum>;
  frameworks: string[];
  ai_tools: AiTool[];
  ai_tool: LegacyAiTool;
  ai_tool_detail: string;
};

const techSchema = z.object({
  domains: z.array(domainEnum).min(1, '技術ドメインを1つ以上選択してください'),
  primary_language: primaryLanguageEnum,
  frameworks: z.array(z.string()).default([]),
  ai_tools: z.array(aiToolEnum).default([]),
  ai_tool: legacyAiToolEnum.optional(),
  ai_tool_detail: z.string().optional().default(''),
}).refine(
  (tech) => normalizeAiTools(tech).length > 0,
  { message: 'AI開発ツールを1つ以上選択してください', path: ['ai_tools'] },
).transform((tech): NormalizedTech => {
  const ai_tools = normalizeAiTools(tech);
  return {
    ...tech,
    ai_tools,
    ai_tool: deriveLegacyAiTool(ai_tools),
    ai_tool_detail: deriveLegacyAiToolDetail(ai_tools, tech.ai_tool_detail),
  };
});

const securitySchema = z.object({
  level: securityLevelEnum,
  has_api_keys: z.boolean(),
  has_user_data: z.boolean(),
  has_payment_data: z.boolean(),
  has_ip_sensitive: z.boolean(),
  has_credentials: z.boolean(),
});

const repoEntrySchema = z.object({
  name: z.string().regex(slugRegex, 'リポジトリ名はslug形式（英小文字・数字・ハイフン）'),
  type: repoKindEnum,
  description: z.string().min(1, 'リポジトリの説明は必須です'),
  owner: z.string().min(1, 'リポジトリの責任者は必須です'),
  depends_on: z.array(z.string()).default([]),
});

const structureSchema = z.object({
  repo_type: repoTypeEnum,
  repos: z.array(repoEntrySchema).default([]),
});

const workflowSchema = z.object({
  phases_count: z.number().int().min(1).max(10).default(3),
});

export const SUPPORTED_SPEC_VERSIONS = ['1.0'] as const;
export type SpecVersion = typeof SUPPORTED_SPEC_VERSIONS[number];

// Brief body without specVersion (used internally by templates)
const briefBodySchema = z.object({
  project: projectSchema,
  tech: techSchema,
  security: securitySchema,
  structure: structureSchema,
  workflow: workflowSchema,
});

type BriefBody = z.infer<typeof briefBodySchema>;

// Shared business rule refinements
const briefRefines: Array<{
  check: (data: BriefBody) => boolean;
  message: string;
  path: string[];
}> = [
  {
    check: (data) => !(data.structure.repo_type === 'multi' && data.structure.repos.length === 0),
    message: 'マルチリポジトリ構成では1つ以上のリポジトリが必要です',
    path: ['structure', 'repos'],
  },
  {
    check: (data) => {
      if (data.structure.repo_type === 'multi') {
        const names = data.structure.repos.map((r) => r.name);
        return new Set(names).size === names.length;
      }
      return true;
    },
    message: 'リポジトリ名が重複しています',
    path: ['structure', 'repos'],
  },
  {
    check: (data) => {
      if (data.structure.repo_type === 'multi') {
        return data.structure.repos.every((repo) => !repo.depends_on.includes(repo.name));
      }
      return true;
    },
    message: 'depends_onに自己参照があります',
    path: ['structure', 'repos'],
  },
  {
    check: (data) => {
      if (data.structure.repo_type === 'multi') {
        const nameSet = new Set(data.structure.repos.map((r) => r.name));
        return data.structure.repos.every(
          (repo) => repo.depends_on.every((dep) => nameSet.has(dep)),
        );
      }
      return true;
    },
    message: 'depends_onに存在しないリポジトリが含まれています',
    path: ['structure', 'repos'],
  },
  {
    check: (data) => {
      const { has_payment_data, has_credentials, has_user_data, has_ip_sensitive } = data.security;
      const levelOrder = ['low', 'medium', 'high'] as const;
      let minIndex = 0;
      if (has_payment_data || has_credentials) {
        minIndex = 2;
      } else if (has_user_data || has_ip_sensitive) {
        minIndex = 1;
      }
      const actualIndex = levelOrder.indexOf(data.security.level);
      return actualIndex >= minIndex;
    },
    message: 'security.levelがフラグから算出される最低レベルを下回っています',
    path: ['security', 'level'],
  },
];

// projectBriefSchema: without specVersion (backward compat for existing CLI)
let briefSchema: z.ZodType<BriefBody> = briefBodySchema as z.ZodType<BriefBody>;
for (const r of briefRefines) {
  briefSchema = briefSchema.refine(r.check, { message: r.message, path: r.path });
}
export const projectBriefSchema = briefSchema;
export type ProjectBrief = z.infer<typeof projectBriefSchema>;

// projectSpecSchema: with specVersion (for app and future CLI)
const specBodySchema = briefBodySchema.extend({
  specVersion: z.string().refine(
    (v): v is SpecVersion => (SUPPORTED_SPEC_VERSIONS as readonly string[]).includes(v),
    { message: `Unsupported specVersion. Supported versions: ${SUPPORTED_SPEC_VERSIONS.join(', ')}` },
  ),
});

type SpecBody = z.infer<typeof specBodySchema>;

let specSchema: z.ZodType<SpecBody> = specBodySchema as z.ZodType<SpecBody>;
for (const r of briefRefines) {
  specSchema = specSchema.refine(
    (data) => r.check(data),
    { message: r.message, path: r.path },
  );
}
export const projectSpecSchema = specSchema;
export type ProjectSpec = z.infer<typeof projectSpecSchema>;
