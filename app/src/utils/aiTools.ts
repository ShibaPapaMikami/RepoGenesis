import { AI_TOOL_LABELS, type AiTool } from '../constants/enums.ts';

export type LegacyAiTool = 'claude_cli' | 'other';

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function normalizeAiTools(aiTools: AiTool[] = [], legacyAiTool?: LegacyAiTool): AiTool[] {
  const normalized = unique(aiTools);
  if (normalized.length > 0) return normalized;
  if (legacyAiTool === 'other') return ['other'];
  return ['claude_code'];
}

export function deriveLegacyAiTool(aiTools: AiTool[]): LegacyAiTool {
  return aiTools.includes('claude_code') ? 'claude_cli' : 'other';
}

export function deriveLegacyAiToolDetail(aiTools: AiTool[], aiToolDetail: string): string {
  const derived = aiTools
    .filter((tool) => tool !== 'claude_code' && tool !== 'other')
    .map((tool) => AI_TOOL_LABELS[tool]);

  if (aiTools.includes('other') && aiToolDetail.trim()) {
    derived.push(aiToolDetail.trim());
  }

  return unique(derived).join(', ');
}
