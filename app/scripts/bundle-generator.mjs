import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(appRoot, '..');

export const generatorEntryPoint = resolve(workspaceRoot, 'generator/dist/generateFromSpec.js');
export const vendoredBundlePath = resolve(appRoot, 'src/vendor/generateFromSpec.js');

export async function bundleGeneratorToFile(outputFile) {
  await mkdir(dirname(outputFile), { recursive: true });

  await build({
    entryPoints: [generatorEntryPoint],
    outfile: outputFile,
    bundle: true,
    format: 'esm',
    minify: true,
    platform: 'browser',
    target: ['es2022'],
    legalComments: 'none',
    banner: {
      js: '// Generated from generator/dist/generateFromSpec.js. Run `npm run sync:generator-bundle` from app/ to refresh.',
    },
  });
}
