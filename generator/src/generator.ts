import * as fs from 'fs';
import * as path from 'path';
import packageJson from '../package.json';
import { projectBriefSchema, projectSpecSchema, SUPPORTED_SPEC_VERSIONS, type SpecVersion } from './schema';
import { writeFile } from './utils/fileWriter';
import { generateFromSpec } from './generateFromSpec';

export interface GenerateOptions {
  inputPath: string;
  outputPath: string;
  force: boolean;
}

export interface GenerateResult {
  success: boolean;
  outputDir: string;
  filesCreated: string[];
  error?: string;
}

/**
 * CLI用アダプタ: read JSON → validate → generateFromSpec → write files
 */
export function generate(options: GenerateOptions): GenerateResult {
  const { inputPath, outputPath, force } = options;

  // 1. Read input file
  let rawJson: string;
  try {
    rawJson = fs.readFileSync(inputPath, 'utf-8');
  } catch {
    return { success: false, outputDir: '', filesCreated: [], error: `Cannot read input file: ${inputPath}` };
  }

  // 2. Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    return { success: false, outputDir: '', filesCreated: [], error: `Invalid JSON in: ${inputPath}` };
  }

  // 3. Validate with zod schema (prefer ProjectSpec; fallback to legacy ProjectBrief)
  let source: 'projectSpec' | 'legacyBrief';
  let resolvedSpecVersion: SpecVersion;
  let specOrBrief: ReturnType<typeof projectSpecSchema.parse> | ReturnType<typeof projectBriefSchema.parse>;
  const specResult = projectSpecSchema.safeParse(parsed);
  if (specResult.success) {
    source = 'projectSpec';
    resolvedSpecVersion = specResult.data.specVersion;
    specOrBrief = specResult.data;
  } else {
    if (parsed !== null && typeof parsed === 'object' && 'specVersion' in parsed) {
      const errors = specResult.error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      return { success: false, outputDir: '', filesCreated: [], error: `Validation failed:\n${errors}` };
    }
    const legacyResult = projectBriefSchema.safeParse(parsed);
    if (!legacyResult.success) {
      const errors = specResult.error.issues
        .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
        .join('\n');
      return { success: false, outputDir: '', filesCreated: [], error: `Validation failed:\n${errors}` };
    }
    source = 'legacyBrief';
    resolvedSpecVersion = SUPPORTED_SPEC_VERSIONS[0];
    specOrBrief = legacyResult.data;
    console.warn(
      '[repogenesis] legacy projectBrief input is deprecated. '
      + `Please add specVersion (${SUPPORTED_SPEC_VERSIONS.join(', ')}) to your input JSON.`,
    );
  }

  const brief = specOrBrief;
  const outputDir = path.join(outputPath, brief.project.slug);

  // 4. Output directory check
  if (fs.existsSync(outputDir)) {
    if (!force) {
      return {
        success: false,
        outputDir,
        filesCreated: [],
        error: `Output directory already exists: ${outputDir}\nUse --force to overwrite.`,
      };
    }
    // --force: remove and recreate
    fs.rmSync(outputDir, { recursive: true, force: true });
  }

  // 5. Generate file map (pure function) and write to disk
  const fileMap = generateFromSpec(brief, {
    source,
    specVersion: resolvedSpecVersion,
    generatorVersion: packageJson.version,
  });
  const filesCreated: string[] = [];

  for (const [relativePath, content] of fileMap) {
    writeFile(outputDir, relativePath, content);
    filesCreated.push(relativePath);
  }

  return { success: true, outputDir, filesCreated };
}
