import type { ProjectBrief } from '../schema';
import { generateToolGuidance, type GenerateToolGuidanceOptions } from './toolGuidance';

export function generateAgentsMd(
  brief: ProjectBrief,
  options: GenerateToolGuidanceOptions = {},
): string {
  return generateToolGuidance(brief, 'codex', options);
}
