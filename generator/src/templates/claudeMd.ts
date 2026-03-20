import type { ProjectBrief } from '../schema';
import { generateToolGuidance, type GenerateToolGuidanceOptions } from './toolGuidance';

export function generateClaudeMd(
  brief: ProjectBrief,
  options: GenerateToolGuidanceOptions = {},
): string {
  return generateToolGuidance(brief, 'claude_code', options);
}
