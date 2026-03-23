import test from 'node:test';
import assert from 'node:assert/strict';
import { generateRepositoryZip } from '../src/utils/generateRepositoryZip.ts';
import type { FormState } from '../src/state/actions.ts';

const RUNBOOK_PATHS = [
  'repogenesis/docs/runbooks/README.md',
  'repogenesis/docs/runbooks/production-bootstrap.md',
  'repogenesis/docs/runbooks/production-cutover.md',
  'repogenesis/docs/runbooks/production-checks.md',
  'repogenesis/docs/runbooks/rollback.md',
  'repogenesis/docs/runbooks/incident-response.md',
  'repogenesis/docs/runbooks/skill-install.md',
] as const;
const SINGLE_REPO_FILE_COUNT = 30;

function listZipEntryNames(zipBuffer: Buffer): string[] {
  const names: string[] = [];
  let offset = 0;

  while (offset + 30 <= zipBuffer.length) {
    const signature = zipBuffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      break;
    }

    const compressedSize = zipBuffer.readUInt32LE(offset + 18);
    const fileNameLength = zipBuffer.readUInt16LE(offset + 26);
    const extraLength = zipBuffer.readUInt16LE(offset + 28);
    const nameStart = offset + 30;
    const nameEnd = nameStart + fileNameLength;
    names.push(zipBuffer.subarray(nameStart, nameEnd).toString('utf8'));
    offset = nameEnd + extraLength + compressedSize;
  }

  return names;
}

function makeState(): FormState {
  return {
    project: {
      name: 'RepoGenesis',
      slug: 'repogenesis',
      description: 'Repository structure generator',
      owner: 'Gugenka',
    },
    tech: {
      domains: ['web'],
      primary_language: 'typescript',
      frameworks: ['React', 'Vite'],
      ai_tools: ['claude_code'],
      ai_tool_detail: '',
    },
    security: {
      level: 'medium',
      has_api_keys: true,
      has_user_data: true,
      has_payment_data: false,
      has_ip_sensitive: false,
      has_credentials: false,
    },
    structure: {
      repo_type: 'single',
      repos: [],
    },
    workflow: {
      phases_count: 3,
    },
    planning: {
      tech_decisions: [
        {
          topic: 'AI API',
          choice: 'OpenAI API',
          status: 'adopted',
          rationale: 'Generate structured planning support.',
          decision_date: '2026-03-21',
          notes: '',
        },
      ],
      external_dependencies: [
        {
          name: 'OpenAI API',
          category: 'ai_api',
          status: 'adopted',
          purpose: 'Generate planning support',
          owner: 'AI Platform',
          source: 'https://platform.openai.com/',
          license: 'Commercial',
          env_vars: ['OPENAI_API_KEY'],
          data_outbound: true,
          notes: '',
        },
      ],
    },
    slugManuallyEdited: false,
    securityLevelOverride: null,
  };
}

test('generateRepositoryZip should include the default operational runbook bundle', async () => {
  const result = generateRepositoryZip(makeState());

  assert.equal(result.filename, 'repogenesis.zip');
  assert.equal(result.fileCount, SINGLE_REPO_FILE_COUNT);

  const zipBuffer = Buffer.from(await result.blob.arrayBuffer());
  const zipEntries = listZipEntryNames(zipBuffer);

  assert.equal(zipBuffer.readUInt32LE(0), 0x04034b50);
  assert.equal(zipEntries.includes('repogenesis/docs/AI_TOOLING.md'), true);

  for (const runbookPath of RUNBOOK_PATHS) {
    assert.equal(zipEntries.includes(runbookPath), true, `Missing runbook entry: ${runbookPath}`);
  }

  assert.equal(zipEntries.includes('repogenesis/.repogenesis/manifest.json'), true);
});
