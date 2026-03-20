import type { FormState } from '../state/actions.ts';
import { buildProjectSpec } from './buildProjectSpec.ts';
import { createZipBlob } from './simpleZip.ts';
import type { SkillCatalogItem } from '../data/skillCatalog.ts';
import type { ProjectSpec } from '../types/projectBrief.ts';
import bundledGenerator from '../vendor/generateFromSpec.js';

interface SelectedSkillMeta {
  id: string;
  name: string;
  version: string;
  sourceType: SkillCatalogItem['sourceType'];
  providers: SkillCatalogItem['providers'];
}

type GenerateFromSpecFn = (
  input: ProjectSpec,
  options: {
    source: 'projectSpec';
    specVersion: ProjectSpec['specVersion'];
    generatorVersion: string;
    selectedSkills: SelectedSkillMeta[];
  },
) => Map<string, string>;

const generateFromSpec = bundledGenerator.generateFromSpec as GenerateFromSpecFn;

export interface GenerateRepositoryZipResult {
  blob: Blob;
  filename: string;
  fileCount: number;
}

export function generateRepositoryZip(state: FormState, selectedSkills: SkillCatalogItem[] = []): GenerateRepositoryZipResult {
  const spec = buildProjectSpec(state);
  const files = generateFromSpec(spec, {
    source: 'projectSpec',
    specVersion: spec.specVersion,
    generatorVersion: 'web-form',
    selectedSkills: selectedSkills.map((skill) => ({
      id: skill.id,
      name: skill.name,
      version: skill.version,
      sourceType: skill.sourceType,
      providers: skill.providers,
    })),
  });

  const entries = Array.from(files.entries()).map(([relativePath, content]) => ({
    path: `${spec.project.slug}/${relativePath}`,
    content,
  }));

  const blob = createZipBlob(entries);
  return {
    blob,
    filename: `${spec.project.slug}.zip`,
    fileCount: entries.length,
  };
}
