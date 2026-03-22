import * as fs from 'fs';
import * as path from 'path';
import { projectBriefSchema, projectSpecSchema, SUPPORTED_SPEC_VERSIONS, type ProjectSpec } from './schema';

export interface MigrateSpecOptions {
  inputPath: string;
  outputPath: string;
  force?: boolean;
}

export interface MigrateSpecResult {
  success: boolean;
  outputPath: string;
  source: 'projectSpec' | 'legacyBrief';
  specVersion?: string;
  error?: string;
}

function toProjectSpec(input: unknown): { source: 'projectSpec' | 'legacyBrief'; spec: ProjectSpec } | { error: string } {
  const specResult = projectSpecSchema.safeParse(input);
  if (specResult.success) {
    return {
      source: 'projectSpec',
      spec: specResult.data,
    };
  }

  if (input !== null && typeof input === 'object' && 'specVersion' in input) {
    const errors = specResult.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    return { error: `Validation failed:\n${errors}` };
  }

  const legacyResult = projectBriefSchema.safeParse(input);
  if (!legacyResult.success) {
    const errors = legacyResult.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    return { error: `Validation failed:\n${errors}` };
  }

  return {
    source: 'legacyBrief',
    spec: {
      specVersion: SUPPORTED_SPEC_VERSIONS[0],
      ...legacyResult.data,
    },
  };
}

function stringifyProjectSpec(spec: ProjectSpec): string {
  return `${JSON.stringify({
    specVersion: spec.specVersion,
    project: spec.project,
    tech: spec.tech,
    security: spec.security,
    structure: spec.structure,
    workflow: spec.workflow,
    planning: spec.planning,
  }, null, 2)}\n`;
}

export function migrateSpec(options: MigrateSpecOptions): MigrateSpecResult {
  let rawJson: string;
  try {
    rawJson = fs.readFileSync(options.inputPath, 'utf-8');
  } catch {
    return {
      success: false,
      outputPath: options.outputPath,
      source: 'legacyBrief',
      error: `Cannot read input file: ${options.inputPath}`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return {
      success: false,
      outputPath: options.outputPath,
      source: 'legacyBrief',
      error: `Invalid JSON in: ${options.inputPath}`,
    };
  }

  const migrated = toProjectSpec(parsed);
  if ('error' in migrated) {
    return {
      success: false,
      outputPath: options.outputPath,
      source: 'legacyBrief',
      error: migrated.error,
    };
  }

  const outputPath = path.resolve(options.outputPath);
  if (fs.existsSync(outputPath) && !options.force) {
    return {
      success: false,
      outputPath,
      source: migrated.source,
      specVersion: migrated.spec.specVersion,
      error: `Output file already exists: ${outputPath}\nUse --force to overwrite.`,
    };
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, stringifyProjectSpec(migrated.spec), 'utf-8');

  return {
    success: true,
    outputPath,
    source: migrated.source,
    specVersion: migrated.spec.specVersion,
  };
}
