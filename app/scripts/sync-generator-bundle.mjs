import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(appRoot, '..');
const entryPoint = resolve(workspaceRoot, 'generator/dist/generateFromSpec.js');
const outputFile = resolve(appRoot, 'src/vendor/generateFromSpec.js');

await mkdir(dirname(outputFile), { recursive: true });

await build({
  entryPoints: [entryPoint],
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

console.log(`Bundled local generator to ${outputFile}`);
