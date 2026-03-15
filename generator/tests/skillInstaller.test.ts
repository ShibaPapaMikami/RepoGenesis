import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { installSkill, loadProjectSkillsManifest, removeSkill } from '../src/skillInstaller';

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
});
