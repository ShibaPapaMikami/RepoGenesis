#!/usr/bin/env node

import { parseArgs } from './args';
import { generate } from './generator';

const args = parseArgs(process.argv);

const result = generate({
  inputPath: args.input,
  outputPath: args.output,
  force: args.force,
});

if (!result.success) {
  console.error(`Error: ${result.error}`);
  process.exit(1);
}

console.log(`Generated ${result.filesCreated.length} files in: ${result.outputDir}`);
console.log('');
console.log('Files created:');
for (const file of result.filesCreated) {
  console.log(`  ${file}`);
}
