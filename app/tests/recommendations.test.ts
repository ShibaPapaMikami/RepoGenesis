import test from 'node:test';
import assert from 'node:assert/strict';
import { parseConsultationIntake } from '../src/utils/intakeParser.ts';
import {
  DEFAULT_RECOMMENDATION_DECISIONS,
  deriveDraftRecommendations,
  normalizeRecommendationDecisions,
} from '../src/utils/recommendations.ts';
import type { FormState } from '../src/state/actions.ts';

function makeState(): FormState {
  return {
    project: {
      name: '',
      slug: '',
      description: '',
      owner: 'BizOps',
    },
    tech: {
      domains: ['web'],
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
    planning: {
      tech_decisions: [],
      external_dependencies: [],
    },
    slugManuallyEdited: false,
    securityLevelOverride: null,
  };
}

test('normalizeRecommendationDecisions fills missing keys with pending', () => {
  assert.deepEqual(normalizeRecommendationDecisions({ repo_type: 'accepted' }), {
    repo_type: 'accepted',
    security_level: 'pending',
    phases_count: 'pending',
  });
});

test('deriveDraftRecommendations marks overridden values when current state differs from the suggestion', () => {
  const intake = `## プロジェクト概要
社内案件を一覧化する管理画面

## 想定ユーザー
- 営業

## 解決したい課題
進行管理がばらけている

## 最初に作るべきもの
管理画面と API を分けて進めたい

## 扱うデータ
- 顧客情報

## 外部連携候補
- Slack

## 未確定事項
- 納品方法

## RepoGenesis入力候補
- multi repo を想定
- security_level は medium を想定
- phases は 4 を想定`;

  const state = makeState();
  const draft = parseConsultationIntake(intake, state);
  const recommendations = deriveDraftRecommendations(
    {
      ...state,
      structure: { ...state.structure, repo_type: 'single' },
      security: { ...state.security, level: 'low' },
      workflow: { phases_count: 2 },
    },
    draft,
    DEFAULT_RECOMMENDATION_DECISIONS,
  );

  assert.equal(recommendations[0]?.status, 'overridden');
  assert.equal(recommendations[1]?.status, 'overridden');
  assert.equal(recommendations[2]?.status, 'overridden');
});

test('deriveDraftRecommendations keeps explicit accepted/overridden decisions when values still match the suggestion', () => {
  const intake = `## プロジェクト概要
社内案件を一覧化する管理画面

## 想定ユーザー
- 営業

## 解決したい課題
進行管理がばらけている

## 最初に作るべきもの
管理画面を先に整えたい

## RepoGenesis入力候補
- single repo を想定
- security_level は low を想定
- phases は 3 を想定`;

  const state = makeState();
  const draft = parseConsultationIntake(intake, state);
  const recommendations = deriveDraftRecommendations(state, draft, {
    repo_type: 'accepted',
    security_level: 'pending',
    phases_count: 'overridden',
  });

  assert.equal(recommendations[0]?.status, 'accepted');
  assert.equal(recommendations[1]?.status, 'pending');
  assert.equal(recommendations[2]?.status, 'overridden');
});
