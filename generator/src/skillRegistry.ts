import type { SkillArtifactKind, SkillProvider } from './skillsManifest';

export type SkillProviderSupportType = 'official' | 'curated';

export interface SkillProviderSupport {
  provider: SkillProvider;
  supportType: SkillProviderSupportType;
}

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
  sourceLabel: string;
  sourceUrl?: string;
  tags: string[];
  installMode: 'copy';
  providers: SkillProvider[];
  providerSupport: SkillProviderSupport[];
  artifacts: SkillRegistryArtifact[];
  reviewRequired: boolean;
}
