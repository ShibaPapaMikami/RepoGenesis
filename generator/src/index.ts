#!/usr/bin/env node

import { parseArgs } from './args';
import { doctor } from './doctor';
import { generate } from './generator';
import { migrateSpec } from './migrateSpec';
import { installSkill, removeSkill, updateAllSkills, updateSkill } from './skillInstaller';
import { listSelectableSkillRegistryItems } from './skillRegistryLoader';
import { getInstalledSkillStatuses } from './skillStatus';

const args = parseArgs(process.argv);

if (args.command === 'generate') {
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
} else if (args.command === 'migrate-spec') {
  const result = migrateSpec({
    inputPath: args.input,
    outputPath: args.output,
    force: args.force,
  });

  if (!result.success) {
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }

  console.log(`Migrated spec (${result.source} -> ${result.specVersion})`);
  console.log(`Output: ${result.outputPath}`);
} else if (args.command === 'doctor') {
  const result = doctor({ projectRoot: args.project, registryRoot: args.registry });
  console.log(result.success ? `Doctor OK: ${result.projectRoot}` : `Doctor FAILED: ${result.projectRoot}`);

  if (result.errors.length > 0) {
    console.log('Errors:');
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
  }

  if (result.warnings.length > 0) {
    console.log('Warnings:');
    for (const warning of result.warnings) {
      console.log(`  - ${warning}`);
    }
  }

  if (!result.success) {
    process.exit(1);
  }
} else if (args.command === 'skills-list') {
  const items = listSelectableSkillRegistryItems(args.registry, {
    includeExperimental: args.includeExperimental,
  });
  for (const item of items) {
    console.log(`${item.id}\t${item.version}\t${item.sourceType}\t${item.providers.join(',')}`);
  }
} else if (args.command === 'skills-add') {
  const result = installSkill({
    projectRoot: args.project,
    registryRoot: args.registry,
    skillId: args.skillId,
    selectedProviders: args.providers,
    installedBy: args.installedBy,
  });
  console.log(`Installed skill: ${result.skillId}`);
  console.log(`Manifest: ${result.manifestPath}`);
  for (const file of result.copiedFiles) {
    console.log(`  copied: ${file}`);
  }
  for (const warning of result.warnings) {
    console.log(`  warning: ${warning}`);
  }
} else if (args.command === 'skills-status') {
  const items = getInstalledSkillStatuses({
    projectRoot: args.project,
    registryRoot: args.registry,
  });
  for (const item of items) {
    console.log([
      item.id,
      item.installedVersion,
      item.registryVersion ?? '-',
      item.status,
      item.installedProviders.join(','),
    ].join('\t'));
    for (const missingPath of item.missingArtifactPaths) {
      console.log(`  warning: missing artifact ${missingPath}`);
    }
  }
} else if (args.command === 'skills-remove') {
  const result = removeSkill({
    projectRoot: args.project,
    skillId: args.skillId,
  });
  console.log(`Removed skill: ${result.skillId}`);
  console.log(`Manifest: ${result.manifestPath}`);
  for (const file of result.removedFiles) {
    console.log(`  removed: ${file}`);
  }
  for (const warning of result.warnings) {
    console.log(`  warning: ${warning}`);
  }
} else if (args.command === 'skills-update') {
  if (args.all) {
    const result = updateAllSkills({
      projectRoot: args.project,
      registryRoot: args.registry,
      installedBy: args.installedBy,
    });
    console.log(`Bulk skill update completed: ${result.updated.length} updated, ${result.skipped.length} skipped`);
    for (const updated of result.updated) {
      console.log(`Updated skill: ${updated.skillId}`);
      console.log(`  version: ${updated.previousVersion} -> ${updated.nextVersion}`);
      console.log(`  manifest: ${updated.manifestPath}`);
      for (const file of updated.removedFiles) {
        console.log(`  removed: ${file}`);
      }
      for (const file of updated.copiedFiles) {
        console.log(`  copied: ${file}`);
      }
      for (const warning of updated.warnings) {
        console.log(`  warning: ${warning}`);
      }
    }
    for (const skipped of result.skipped) {
      console.log(`Skipped skill: ${skipped.skillId} (${skipped.reason})`);
    }
  } else {
    const result = updateSkill({
      projectRoot: args.project,
      registryRoot: args.registry,
      skillId: args.skillId!,
      selectedProviders: args.providers,
      installedBy: args.installedBy,
    });
    console.log(`Updated skill: ${result.skillId}`);
    console.log(`  version: ${result.previousVersion} -> ${result.nextVersion}`);
    console.log(`Manifest: ${result.manifestPath}`);
    for (const file of result.removedFiles) {
      console.log(`  removed: ${file}`);
    }
    for (const file of result.copiedFiles) {
      console.log(`  copied: ${file}`);
    }
    for (const warning of result.warnings) {
      console.log(`  warning: ${warning}`);
    }
  }
}
