import { bundleGeneratorToFile, vendoredBundlePath } from './bundle-generator.mjs';

await bundleGeneratorToFile(vendoredBundlePath);

console.log(`Bundled local generator to ${vendoredBundlePath}`);
