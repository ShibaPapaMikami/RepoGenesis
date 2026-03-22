import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { bundleGeneratorToFile, vendoredBundlePath } from './bundle-generator.mjs';

const tempDir = await mkdtemp(join(tmpdir(), 'repogenesis-bundle-check-'));
const tempBundlePath = join(tempDir, 'generateFromSpec.js');

try {
  await bundleGeneratorToFile(tempBundlePath);

  const [expected, actual] = await Promise.all([
    readFile(tempBundlePath, 'utf8'),
    readFile(vendoredBundlePath, 'utf8'),
  ]);

  if (expected !== actual) {
    console.error('Vendored generator bundle is out of sync with generator/dist/generateFromSpec.js');
    console.error('Run `npm run sync:generator-bundle` from app/ after rebuilding generator.');
    process.exitCode = 1;
  } else {
    console.log('Vendored generator bundle is in sync.');
  }
} finally {
  await rm(tempDir, { recursive: true, force: true });
}
