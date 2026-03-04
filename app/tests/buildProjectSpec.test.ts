import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProjectSpec, stringifyProjectSpec } from '../src/utils/buildProjectSpec.ts';
import { PROJECT_SPEC_FILENAME, SUPPORTED_SPEC_VERSION } from '../src/constants/spec.ts';
import type { FormState } from '../src/state/actions.ts';

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
      ai_tool: 'claude_cli',
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
    slugManuallyEdited: false,
    securityLevelOverride: null,
  };
}

test('buildProjectSpec should always include supported specVersion', () => {
  const spec = buildProjectSpec(makeState());
  assert.equal(spec.specVersion, SUPPORTED_SPEC_VERSION);
});

test('buildProjectSpec should map form state to ProjectSpec shape', () => {
  const state = makeState();
  const spec = buildProjectSpec(state);

  assert.equal(spec.project.slug, state.project.slug);
  assert.equal(spec.structure.repo_type, state.structure.repo_type);
  assert.equal(spec.workflow.phases_count, state.workflow.phases_count);
  assert.equal(Array.isArray(spec.tech.frameworks), true);
});

test('buildProjectSpec should set ISO created_at timestamp', () => {
  const spec = buildProjectSpec(makeState());
  assert.ok(spec.project.created_at);
  assert.equal(Number.isNaN(Date.parse(spec.project.created_at as string)), false);
});

test('stringifyProjectSpec should place specVersion as first top-level key', () => {
  const json = stringifyProjectSpec(makeState());
  assert.equal(json.startsWith('{\n  "specVersion":'), true);
});

test('project spec download filename should be fixed', () => {
  assert.equal(PROJECT_SPEC_FILENAME, 'project_spec.json');
});
