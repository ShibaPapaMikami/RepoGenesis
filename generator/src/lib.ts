export { generateFromSpec } from './generateFromSpec';
export { migrateSpec } from './migrateSpec';
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
  getInstalledSkillStatuses,
} from './skillStatus';
export {
  installSkill,
  loadProjectSkillsManifest,
  removeSkill,
  saveProjectSkillsManifest,
  updateAllSkills,
  updateSkill,
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
