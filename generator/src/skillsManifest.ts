export type SkillProvider = 'codex' | 'claude_code' | 'gemini_cli' | 'tool_agnostic';
export type SkillArtifactKind = 'skill' | 'command' | 'context' | 'extension' | 'doc';

export interface InstalledSkillArtifact {
  provider: SkillProvider;
  artifactKind: SkillArtifactKind;
  path: string;
}

export interface InstalledSkill {
  id: string;
  version: string;
  installedAt: string;
  installedBy?: string;
  sourceType?: 'official' | 'curated' | 'internal';
  artifacts: InstalledSkillArtifact[];
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
