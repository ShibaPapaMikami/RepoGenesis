import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const scriptDir = resolve(fileURLToPath(new URL('.', import.meta.url)));
const appRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(appRoot, '..');

const generatorDistModuleUrl = pathToFileURL(resolve(workspaceRoot, 'generator/dist/generateFromSpec.js')).href;
const vendoredGeneratorModuleUrl = pathToFileURL(resolve(appRoot, 'src/vendor/generateFromSpec.js')).href;

const fixtureNames = [
  'test_brief_single.json',
  'test_brief_app_export.json',
  'test_brief_codex.json',
  'test_brief_multi.json',
];

function buildGenerateOptions(input) {
  const isProjectSpec = typeof input === 'object' && input !== null && 'specVersion' in input;
  return {
    source: isProjectSpec ? 'projectSpec' : 'legacyBrief',
    specVersion: isProjectSpec ? input.specVersion : '1.0',
    generatorVersion: 'compat-check',
    generatedAt: '2026-03-21T00:00:00.000Z',
    selectedSkills: [],
  };
}

function compareMaps(label, expected, actual) {
  const expectedKeys = Array.from(expected.keys()).sort();
  const actualKeys = Array.from(actual.keys()).sort();

  const missing = expectedKeys.filter((key) => !actual.has(key));
  const unexpected = actualKeys.filter((key) => !expected.has(key));
  const changed = expectedKeys.filter((key) => actual.has(key) && expected.get(key) !== actual.get(key));

  if (missing.length === 0 && unexpected.length === 0 && changed.length === 0) {
    return;
  }

  const lines = [`Generated output mismatch for ${label}`];
  if (missing.length > 0) {
    lines.push(`Missing in vendored bundle: ${missing.join(', ')}`);
  }
  if (unexpected.length > 0) {
    lines.push(`Unexpected in vendored bundle: ${unexpected.join(', ')}`);
  }
  if (changed.length > 0) {
    lines.push(`Changed content: ${changed.join(', ')}`);
  }
  throw new Error(lines.join('\n'));
}

const [{ generateFromSpec: distGenerateFromSpec }, { default: bundledGenerator }] = await Promise.all([
  import(generatorDistModuleUrl),
  import(vendoredGeneratorModuleUrl),
]);

for (const fixtureName of fixtureNames) {
  const fixturePath = resolve(workspaceRoot, 'generator/tests/fixtures', fixtureName);
  const input = JSON.parse(await readFile(fixturePath, 'utf-8'));
  const options = buildGenerateOptions(input);

  const distFiles = distGenerateFromSpec(input, options);
  const vendoredFiles = bundledGenerator.generateFromSpec(input, options);

  compareMaps(fixtureName, distFiles, vendoredFiles);
}

console.log(`Generated output compatibility OK for ${fixtureNames.length} fixtures.`);
