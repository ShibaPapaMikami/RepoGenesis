import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installSkill, loadProjectSkillsManifest, removeSkill, updateAllSkills, updateSkill } from '../src/skillInstaller';

let tmpDir: string;
let projectRoot: string;
const registryRoot = path.resolve(__dirname, '../../skills/registry');

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'repogenesis-skill-installer-'));
  projectRoot = path.join(tmpDir, 'project');
  fs.mkdirSync(projectRoot, { recursive: true });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('skill installer', () => {
  it('copies provider artifacts and writes manifest', () => {
    const result = installSkill({
      projectRoot,
      registryRoot,
      skillId: 'repo-readiness-review',
      selectedProviders: ['claude_code', 'gemini_cli'],
      installedBy: 'test',
      installedAt: '2026-03-15T02:00:00.000Z',
    });

    expect(result.copiedFiles).toEqual([
      '.claude/skills/repo-readiness-review/SKILL.md',
      '.gemini/commands/repo-readiness.toml',
    ]);

    const claudeSkill = path.join(projectRoot, '.claude/skills/repo-readiness-review/SKILL.md');
    const geminiCommand = path.join(projectRoot, '.gemini/commands/repo-readiness.toml');
    expect(fs.existsSync(claudeSkill)).toBe(true);
    expect(fs.existsSync(geminiCommand)).toBe(true);

    const manifest = loadProjectSkillsManifest(projectRoot);
    expect(manifest.installed).toEqual([
      {
        id: 'repo-readiness-review',
        version: '0.1.0',
        installedAt: '2026-03-15T02:00:00.000Z',
        installedBy: 'test',
        sourceType: 'curated',
        artifacts: [
          {
            provider: 'claude_code',
            artifactKind: 'skill',
            path: '.claude/skills/repo-readiness-review/SKILL.md',
          },
          {
            provider: 'gemini_cli',
            artifactKind: 'command',
            path: '.gemini/commands/repo-readiness.toml',
          },
        ],
      },
    ]);
  });

  it('removes copied artifacts and updates manifest', () => {
    installSkill({
      projectRoot,
      registryRoot,
      skillId: 'repo-readiness-review',
      selectedProviders: ['claude_code'],
      installedBy: 'test',
      installedAt: '2026-03-15T02:00:00.000Z',
    });

    const result = removeSkill({
      projectRoot,
      skillId: 'repo-readiness-review',
    });

    expect(result.removedFiles).toEqual([
      '.claude/skills/repo-readiness-review/SKILL.md',
    ]);
    expect(fs.existsSync(path.join(projectRoot, '.claude/skills/repo-readiness-review/SKILL.md'))).toBe(false);
    expect(loadProjectSkillsManifest(projectRoot).installed).toEqual([]);
  });

  it('updates installed skills to the registry current version and refreshes artifacts', () => {
    installSkill({
      projectRoot,
      registryRoot,
      skillId: 'repo-readiness-review',
      selectedProviders: ['claude_code'],
      installedBy: 'test',
      installedAt: '2026-03-15T02:00:00.000Z',
    });

    const updatedRegistryRoot = path.join(tmpDir, 'registry-update');
    fs.cpSync(registryRoot, updatedRegistryRoot, { recursive: true });

    const skillJsonPath = path.join(updatedRegistryRoot, 'curated/repo-readiness-review/skill.json');
    const skillJson = JSON.parse(fs.readFileSync(skillJsonPath, 'utf-8'));
    skillJson.version = '0.2.0';
    fs.writeFileSync(skillJsonPath, `${JSON.stringify(skillJson, null, 2)}\n`, 'utf-8');

    const claudeSkillPath = path.join(updatedRegistryRoot, 'curated/repo-readiness-review/claude/SKILL.md');
    fs.writeFileSync(claudeSkillPath, '# Updated review checklist\n', 'utf-8');

    const result = updateSkill({
      projectRoot,
      registryRoot: updatedRegistryRoot,
      skillId: 'repo-readiness-review',
      installedBy: 'updater',
      installedAt: '2026-03-21T01:00:00.000Z',
    });

    expect(result.previousVersion).toBe('0.1.0');
    expect(result.nextVersion).toBe('0.2.0');
    expect(result.removedFiles).toEqual([
      '.claude/skills/repo-readiness-review/SKILL.md',
    ]);
    expect(result.copiedFiles).toEqual([
      '.claude/skills/repo-readiness-review/SKILL.md',
    ]);

    const installedSkillPath = path.join(projectRoot, '.claude/skills/repo-readiness-review/SKILL.md');
    expect(fs.readFileSync(installedSkillPath, 'utf-8')).toContain('Updated review checklist');

    const manifest = loadProjectSkillsManifest(projectRoot);
    expect(manifest.installed).toEqual([
      {
        id: 'repo-readiness-review',
        version: '0.2.0',
        installedAt: '2026-03-21T01:00:00.000Z',
        installedBy: 'updater',
        sourceType: 'curated',
        artifacts: [
          {
            provider: 'claude_code',
            artifactKind: 'skill',
            path: '.claude/skills/repo-readiness-review/SKILL.md',
          },
        ],
      },
    ]);
  });

  it('bulk updates only skills that are outdated or missing artifacts', () => {
    installSkill({
      projectRoot,
      registryRoot,
      skillId: 'repo-readiness-review',
      selectedProviders: ['claude_code'],
      installedBy: 'test',
      installedAt: '2026-03-15T02:00:00.000Z',
    });
    installSkill({
      projectRoot,
      registryRoot,
      skillId: 'gh-fix-ci',
      selectedProviders: ['claude_code'],
      installedBy: 'test',
      installedAt: '2026-03-15T02:00:00.000Z',
    });

    fs.rmSync(path.join(projectRoot, '.claude/skills/gh-fix-ci/SKILL.md'));

    const updatedRegistryRoot = path.join(tmpDir, 'registry-update-all');
    fs.cpSync(registryRoot, updatedRegistryRoot, { recursive: true });

    const readinessJsonPath = path.join(updatedRegistryRoot, 'curated/repo-readiness-review/skill.json');
    const readinessJson = JSON.parse(fs.readFileSync(readinessJsonPath, 'utf-8'));
    readinessJson.version = '0.2.0';
    fs.writeFileSync(readinessJsonPath, `${JSON.stringify(readinessJson, null, 2)}\n`, 'utf-8');

    const readinessSkillPath = path.join(updatedRegistryRoot, 'curated/repo-readiness-review/claude/SKILL.md');
    fs.writeFileSync(readinessSkillPath, '# Updated review checklist\n', 'utf-8');

    const result = updateAllSkills({
      projectRoot,
      registryRoot: updatedRegistryRoot,
      installedBy: 'bulk-updater',
      installedAt: '2026-03-21T03:00:00.000Z',
    });

    expect(result.updated).toHaveLength(2);
    expect(result.updated.map((item) => item.skillId).sort()).toEqual([
      'gh-fix-ci',
      'repo-readiness-review',
    ]);
    expect(result.skipped).toEqual([]);

    const readinessSkill = path.join(projectRoot, '.claude/skills/repo-readiness-review/SKILL.md');
    const ghFixSkill = path.join(projectRoot, '.claude/skills/gh-fix-ci/SKILL.md');
    expect(fs.readFileSync(readinessSkill, 'utf-8')).toContain('Updated review checklist');
    expect(fs.existsSync(ghFixSkill)).toBe(true);

    const manifest = loadProjectSkillsManifest(projectRoot);
    expect([...manifest.installed].sort((a, b) => a.id.localeCompare(b.id))).toEqual([
      {
        id: 'gh-fix-ci',
        version: '0.1.0',
        installedAt: '2026-03-21T03:00:00.000Z',
        installedBy: 'bulk-updater',
        sourceType: 'official',
        artifacts: [
          {
            provider: 'claude_code',
            artifactKind: 'skill',
            path: '.claude/skills/gh-fix-ci/SKILL.md',
          },
        ],
      },
      {
        id: 'repo-readiness-review',
        version: '0.2.0',
        installedAt: '2026-03-21T03:00:00.000Z',
        installedBy: 'bulk-updater',
        sourceType: 'curated',
        artifacts: [
          {
            provider: 'claude_code',
            artifactKind: 'skill',
            path: '.claude/skills/repo-readiness-review/SKILL.md',
          },
        ],
      },
    ]);
  });

  it('skips bulk update for clean up-to-date skills and skills missing from the registry', () => {
    installSkill({
      projectRoot,
      registryRoot,
      skillId: 'repo-readiness-review',
      selectedProviders: ['claude_code'],
      installedBy: 'test',
      installedAt: '2026-03-15T02:00:00.000Z',
    });
    installSkill({
      projectRoot,
      registryRoot,
      skillId: 'gh-fix-ci',
      selectedProviders: ['claude_code'],
      installedBy: 'test',
      installedAt: '2026-03-15T02:00:00.000Z',
    });

    const partialRegistryRoot = path.join(tmpDir, 'partial-registry');
    fs.cpSync(registryRoot, partialRegistryRoot, { recursive: true });
    fs.rmSync(path.join(partialRegistryRoot, 'official/gh-fix-ci'), { recursive: true, force: true });

    const result = updateAllSkills({
      projectRoot,
      registryRoot: partialRegistryRoot,
      installedBy: 'bulk-updater',
      installedAt: '2026-03-21T03:00:00.000Z',
    });

    expect(result.updated).toEqual([]);
    expect([...result.skipped].sort((a, b) => a.skillId.localeCompare(b.skillId))).toEqual([
      {
        skillId: 'gh-fix-ci',
        reason: 'registry entry is missing',
      },
      {
        skillId: 'repo-readiness-review',
        reason: 'already up to date',
      },
    ]);
  });
});
