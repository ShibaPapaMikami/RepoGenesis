import type { SkillArtifactKind, SkillProvider } from './skillsManifest';

export interface SkillRegistryArtifact {
  provider: SkillProvider;
  artifactKind: SkillArtifactKind;
  entryPath: string;
  readmePath?: string;
}

export interface SkillRegistryItem {
  id: string;
  name: string;
  description: string;
  owner: string;
  version: string;
  status: 'stable' | 'experimental' | 'deprecated';
  riskLevel: 'low' | 'medium' | 'high';
  sourceType: 'official' | 'curated' | 'internal';
  sourceUrl?: string;
  tags: string[];
  installMode: 'copy';
  providers: SkillProvider[];
  artifacts: SkillRegistryArtifact[];
  reviewRequired: boolean;
}
