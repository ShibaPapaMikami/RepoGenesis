import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installSkill } from '../src/skillInstaller';
import { getInstalledSkillStatuses } from '../src/skillStatus';

let tmpDir: string;
let projectRoot: string;
const registryRoot = path.resolve(__dirname, '../../skills/registry');

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-skill-status-'));
  projectRoot = path.join(tmpDir, 'project');
  fs.mkdirSync(projectRoot, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('skill status', () => {
  it('reports installed skills as up to date when manifest matches the registry', () => {
    installSkill({
      projectRoot,
      registryRoot,
      skillId: 'repo-readiness-review',
      selectedProviders: ['claude_code', 'gemini_cli'],
      installedAt: '2026-03-21T00:00:00.000Z',
    });

    const statuses = getInstalledSkillStatuses({
      projectRoot,
      registryRoot,
    });

    expect(statuses).toEqual([
      {
        id: 'repo-readiness-review',
        installedVersion: '0.1.0',
        registryVersion: '0.1.0',
        registryStatus: 'stable',
        status: 'up_to_date',
        installedProviders: ['claude_code', 'gemini_cli'],
        registryProviders: ['codex', 'claude_code', 'gemini_cli'],
        missingArtifactPaths: [],
      },
    ]);
  });

  it('reports update availability and missing artifacts', () => {
    installSkill({
      projectRoot,
      registryRoot,
      skillId: 'repo-readiness-review',
      selectedProviders: ['claude_code'],
      installedAt: '2026-03-21T00:00:00.000Z',
    });

    fs.rmSync(path.join(projectRoot, '.claude/skills/repo-readiness-review/SKILL.md'));

    const updatedRegistryRoot = path.join(tmpDir, 'registry-update');
    fs.cpSync(registryRoot, updatedRegistryRoot, { recursive: true });
    const skillJsonPath = path.join(updatedRegistryRoot, 'curated/repo-readiness-review/skill.json');
    const skillJson = JSON.parse(fs.readFileSync(skillJsonPath, 'utf-8'));
    skillJson.version = '0.2.0';
    fs.writeFileSync(skillJsonPath, `${JSON.stringify(skillJson, null, 2)}\n`, 'utf-8');

    const statuses = getInstalledSkillStatuses({
      projectRoot,
      registryRoot: updatedRegistryRoot,
    });

    expect(statuses).toEqual([
      {
        id: 'repo-readiness-review',
        installedVersion: '0.1.0',
        registryVersion: '0.2.0',
        registryStatus: 'stable',
        status: 'update_available',
        installedProviders: ['claude_code'],
        registryProviders: ['codex', 'claude_code', 'gemini_cli'],
        missingArtifactPaths: ['.claude/skills/repo-readiness-review/SKILL.md'],
      },
    ]);
  });

  it('reports skills that are no longer present in the registry', () => {
    installSkill({
      projectRoot,
      registryRoot,
      skillId: 'repo-readiness-review',
      selectedProviders: ['claude_code'],
      installedAt: '2026-03-21T00:00:00.000Z',
    });

    const emptyRegistryRoot = path.join(tmpDir, 'empty-registry');
    fs.mkdirSync(emptyRegistryRoot, { recursive: true });

    const statuses = getInstalledSkillStatuses({
      projectRoot,
      registryRoot: emptyRegistryRoot,
    });

    expect(statuses).toEqual([
      {
        id: 'repo-readiness-review',
        installedVersion: '0.1.0',
        registryVersion: undefined,
        registryStatus: undefined,
        status: 'missing_from_registry',
        installedProviders: ['claude_code'],
        registryProviders: [],
        missingArtifactPaths: [],
      },
    ]);
  });
});
