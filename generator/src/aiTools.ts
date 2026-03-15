export const AI_TOOLS = ['codex', 'claude_code', 'gemini_cli', 'other'] as const;
export type AiTool = typeof AI_TOOLS[number];

export const LEGACY_AI_TOOLS = ['claude_cli', 'other'] as const;
export type LegacyAiTool = typeof LEGACY_AI_TOOLS[number];

interface TechLike {
  ai_tools?: AiTool[];
  ai_tool?: LegacyAiTool;
  ai_tool_detail?: string;
}

const AI_TOOL_LABELS: Record<Exclude<AiTool, 'other'>, string> = {
  codex: 'Codex',
  claude_code: 'Claude Code',
  gemini_cli: 'Gemini CLI',
};

export function normalizeAiTools(tech: TechLike): AiTool[] {
  const normalized = Array.from(new Set(tech.ai_tools ?? [])).filter((tool): tool is AiTool =>
    (AI_TOOLS as readonly string[]).includes(tool),
  );

  if (normalized.length > 0) {
    return normalized;
  }

  if (tech.ai_tool === 'claude_cli') {
    return ['claude_code'];
  }

  if (tech.ai_tool === 'other') {
    return ['other'];
  }

  return [];
}

export function deriveLegacyAiTool(aiTools: AiTool[]): LegacyAiTool {
  return aiTools.includes('claude_code') ? 'claude_cli' : 'other';
}

export function deriveLegacyAiToolDetail(aiTools: AiTool[], detail: string | undefined): string {
  const derived = aiTools
    .filter((tool) => tool !== 'claude_code' && tool !== 'other')
    .map((tool) => AI_TOOL_LABELS[tool]);

  if (aiTools.includes('other') && detail?.trim()) {
    derived.push(detail.trim());
  }

  return Array.from(new Set(derived)).join(', ');
}

export function hasAiTool(tech: TechLike, tool: Exclude<AiTool, 'other'>): boolean {
  return normalizeAiTools(tech).includes(tool);
}

export function formatAiTools(tech: TechLike): string {
  return normalizeAiTools(tech).map((tool) => {
    if (tool === 'other') {
      return tech.ai_tool_detail?.trim() || 'Other';
    }
    return AI_TOOL_LABELS[tool];
  }).join(', ');
}
