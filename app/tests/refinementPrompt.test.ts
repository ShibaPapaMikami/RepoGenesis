import test from 'node:test';
import assert from 'node:assert/strict';
import { parseConsultationIntake } from '../src/utils/intakeParser.ts';
import { buildRequirementRefinementPrompt, getRequirementRefinementPromptFilename } from '../src/utils/refinementPrompt.ts';
import type { FormState } from '../src/state/actions.ts';

function makeState(): FormState {
  return {
    project: {
      name: '契約台帳ダッシュボード',
      slug: 'contract-ledger-dashboard',
      description: '契約管理の進捗と期限を追うダッシュボード',
      owner: 'BizOps',
    },
    tech: {
      domains: ['web', 'ai'],
      primary_language: 'typescript',
      frameworks: ['React', 'Vite'],
      ai_tools: ['codex', 'claude_code'],
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
      phases_count: 4,
    },
    planning: {
      tech_decisions: [
        {
          topic: 'Web Framework',
          choice: 'React + Vite',
          status: 'adopted',
          rationale: 'small team and fast setup',
          decision_date: '',
          notes: '',
        },
      ],
      external_dependencies: [
        {
          name: 'OpenAI API',
          category: 'ai_api',
          status: 'adopted',
          purpose: '要約生成',
          owner: 'Platform',
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

test('buildRequirementRefinementPrompt creates provider-neutral markdown prompt from draft and current state', () => {
  const intake = `## プロジェクト概要
契約台帳と期限通知をまとめる社内Webツール

## 想定ユーザー
- 管理部
- PM

## 解決したい課題
契約情報と期限がスプレッドシートに分散している

## 最初に作るべきもの
契約一覧と期限一覧を見られる画面

## 扱うデータ
- 契約名
- 取引先
- 契約期限

## 外部連携候補
- Slack

## 参考実装・関連リンク
- https://github.com/example/contract-ledger-starter

## 未確定事項
- Slack 通知を初回から入れるか未確定

## RepoGenesis入力候補
- domain は web と ai が候補
- security は medium を想定`;

  const draft = parseConsultationIntake(intake, makeState());
  const prompt = buildRequirementRefinementPrompt(makeState(), draft, 'internal_tool');

  assert.match(prompt, /# RepoGenesis 要件整理用プロンプト/);
  assert.match(prompt, /相談タイプ: 社内ツール/);
  assert.match(prompt, /想定AIツール: Codex \/ Claude Code/);
  assert.match(prompt, /### 確認できたこと/);
  assert.match(prompt, /契約一覧と期限一覧を見られる画面/);
  assert.match(prompt, /### 採用済み技術判断/);
  assert.match(prompt, /React \+ Vite/);
  assert.match(prompt, /### 採用済み外部依存/);
  assert.match(prompt, /OPENAI_API_KEY/);
  assert.match(prompt, /### 現在の参考リンク/);
  assert.match(prompt, /https:\/\/github.com\/example\/contract-ledger-starter/);
  assert.match(prompt, /## RepoGenesis入力候補/);
});

test('getRequirementRefinementPromptFilename returns stable markdown filename', () => {
  assert.equal(
    getRequirementRefinementPromptFilename('contract-ledger-dashboard'),
    'contract-ledger-dashboard-requirement-refinement-prompt.md',
  );
  assert.equal(
    getRequirementRefinementPromptFilename(''),
    'repogenesis-requirement-refinement-prompt.md',
  );
});
