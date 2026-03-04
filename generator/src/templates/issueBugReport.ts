import type { ProjectBrief } from '../schema';

export function generateIssueBugReport(_brief: ProjectBrief): string {
  return `---
name: Bug Report
about: バグを報告する
title: "fix: "
labels: bug
---

## 現象
<!-- 何が起きたかを簡潔に。 -->

## 再現手順
1.
2.
3.

## 期待する動作
<!-- 本来どうなるべきか。 -->

## 実際の動作
<!-- 実際に何が起きたか。エラーメッセージがあれば貼る。 -->

## 環境
- OS:
- Node.js:
- バージョン:

## スクリーンショット
<!-- あれば添付。 -->
`;
}
