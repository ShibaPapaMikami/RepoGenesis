import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProviderGuidedPrompt, buildProviderPromptFilename } from '../src/utils/providerPrompt.ts';

test('buildProviderGuidedPrompt wraps a consultation prompt for each external provider', () => {
  const basePrompt = '## プロジェクト概要\n社内FAQツール';

  const chatgpt = buildProviderGuidedPrompt(basePrompt, 'chatgpt', 'consultation');
  const claude = buildProviderGuidedPrompt(basePrompt, 'claude', 'consultation');
  const gemini = buildProviderGuidedPrompt(basePrompt, 'gemini', 'consultation');

  assert.match(chatgpt, /# ChatGPT 向け 相談整理プロンプト/);
  assert.match(claude, /# Claude 向け 相談整理プロンプト/);
  assert.match(gemini, /# Gemini 向け 相談整理プロンプト/);
  assert.match(chatgpt, /## 依頼本文/);
  assert.match(claude, /## 依頼本文/);
  assert.match(gemini, /## 依頼本文/);
});

test('buildProviderPromptFilename appends provider suffix before markdown extension', () => {
  assert.equal(
    buildProviderPromptFilename('repogenesis-requirement-refinement-prompt.md', 'chatgpt'),
    'repogenesis-requirement-refinement-prompt-chatgpt.md',
  );
  assert.equal(
    buildProviderPromptFilename('repogenesis-requirement-refinement-prompt', 'claude'),
    'repogenesis-requirement-refinement-prompt-claude.md',
  );
});
