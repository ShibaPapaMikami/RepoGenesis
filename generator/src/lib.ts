export { generateFromSpec } from './generateFromSpec';
export {
  projectBriefSchema,
  projectSpecSchema,
  SUPPORTED_SPEC_VERSIONS,
} from './schema';
export {
  doctor,
} from './doctor';
export {
  createEmptySkillsManifest,
} from './skillsManifest';
export {
  projectSkillsManifestSchema,
} from './skillsManifestSchema';
export {
  skillRegistryItemSchema,
} from './skillRegistrySchema';
export {
  listSelectableSkillRegistryItems,
  loadSkillRegistry,
} from './skillRegistryLoader';
export {
  installSkill,
  loadProjectSkillsManifest,
  removeSkill,
  saveProjectSkillsManifest,
} from './skillInstaller';
export {
  applySkillInstallPlanToManifest,
  applySkillRemovalToManifest,
  planSkillInstall,
  planSkillRemoval,
} from './skillInstallerPlan';
export type {
  ProjectBrief,
  ProjectSpec,
  SpecVersion,
} from './schema';
export type {
  SkillArtifactKind,
  SkillProvider,
  InstalledSkill,
  InstalledSkillArtifact,
  ProjectSkillsManifest,
} from './skillsManifest';
export type {
  SkillRegistryArtifact,
  SkillRegistryItem,
} from './skillRegistry';
