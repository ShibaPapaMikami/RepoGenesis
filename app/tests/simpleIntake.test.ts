import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applySimpleIntakeOverrides,
  buildSimpleIntakeDraft,
  buildSimpleIntakeMarkdown,
  initialSimpleIntakeState,
} from '../src/utils/simpleIntake.ts';
import type { FormState } from '../src/state/actions.ts';

function makeState(): FormState {
  return {
    project: {
      name: '',
      slug: '',
      description: '',
      owner: '',
    },
    tech: {
      domains: [],
      primary_language: 'typescript',
      frameworks: [],
      ai_tools: ['claude_code'],
      ai_tool_detail: '',
    },
    security: {
      level: 'low',
      has_api_keys: false,
      has_user_data: false,
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

test('buildSimpleIntakeMarkdown should convert answers into consultation sections', () => {
  const markdown = buildSimpleIntakeMarkdown({
    ...initialSimpleIntakeState,
    summary: '社内向け案件整理ツール',
    usersText: '営業\nPM',
    problem: '相談内容が分散している',
    firstDeliverable: '案件一覧画面',
    dataKindsText: '案件名\n担当者',
    integrationStatus: 'maybe',
    integrationNotes: 'Slack',
  });

  assert.equal(markdown.includes('## プロジェクト概要'), true);
  assert.equal(markdown.includes('## 未確定事項'), true);
  assert.equal(markdown.includes('外部API連携を初回スコープに含めるかは未確定'), true);
});

test('buildSimpleIntakeDraft should reuse parser and reflect owner/security hints', () => {
  const draft = buildSimpleIntakeDraft({
    ...initialSimpleIntakeState,
    variant: 'client_project',
    summary: 'クライアント向け進行管理画面',
    usersText: 'クライアント担当者\n制作ディレクター',
    problem: '進行状況がチャットに散らばっている',
    firstDeliverable: '問い合わせ履歴と進行ステータスを見られる画面',
    dataKindsText: '案件名\n顧客情報',
    integrationStatus: 'yes',
    integrationNotes: 'Backlog',
    owner: 'Gugenka PM',
    dataSensitivity: 'personal',
    repoConfidence: 'multi',
  }, makeState());

  assert.equal(draft.suggestedState.project.owner, 'Gugenka PM');
  assert.equal(draft.suggestedState.security.has_api_keys, true);
  assert.equal(draft.suggestedState.security.has_user_data, true);
  assert.equal(draft.suggestedState.structure.repo_type, 'multi');
  assert.deepEqual(
    draft.suggestedState.structure.repos.map((repo) => repo.name),
    ['frontend', 'backend'],
  );
});

test('applySimpleIntakeOverrides should deterministically layer simple-input specific hints', () => {
  const adjusted = applySimpleIntakeOverrides(makeState(), {
    ...initialSimpleIntakeState,
    owner: 'Gugenka PM',
    dataSensitivity: 'personal',
    integrationStatus: 'yes',
  });

  assert.equal(adjusted.project.owner, 'Gugenka PM');
  assert.equal(adjusted.security.has_user_data, true);
  assert.equal(adjusted.security.has_ip_sensitive, true);
  assert.equal(adjusted.security.has_api_keys, true);
});
