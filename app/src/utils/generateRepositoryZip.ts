import type { FormState } from '../state/actions.ts';
import { buildProjectSpec } from './buildProjectSpec.ts';
import { createZipBlob } from './simpleZip.ts';
import { generateFromSpec } from '../../../generator/src/generateFromSpec.ts';

export interface GenerateRepositoryZipResult {
  blob: Blob;
  filename: string;
  fileCount: number;
}

export function generateRepositoryZip(state: FormState): GenerateRepositoryZipResult {
  const spec = buildProjectSpec(state);
  const input = spec as unknown as Parameters<typeof generateFromSpec>[0];
  const files = generateFromSpec(input, {
    source: 'projectSpec',
    specVersion: spec.specVersion,
    generatorVersion: 'web-form',
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
