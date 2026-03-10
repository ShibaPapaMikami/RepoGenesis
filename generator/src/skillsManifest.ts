export type CompatibleTool = 'claude_code' | 'gemini_cli' | 'tool_agnostic';

export interface InstalledSkill {
  id: string;
  version: string;
  installedAt: string;
  installedBy?: string;
  compatibleTool?: CompatibleTool;
  path: string;
  notes?: string;
}

export interface ProjectSkillsManifest {
  version: 1;
  source: 'repogenesis';
  installed: InstalledSkill[];
}

export function createEmptySkillsManifest(): ProjectSkillsManifest {
  return {
    version: 1,
    source: 'repogenesis',
    installed: [],
  };
}
