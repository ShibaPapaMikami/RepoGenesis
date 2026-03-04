import type { ProjectBrief } from '../schema';

export function generateIssueFeatureRequest(_brief: ProjectBrief): string {
  return `---
name: Feature Request
about: 新機能の提案
title: "feat: "
labels: enhancement
---

## 概要
<!-- 何を実現したいか。1〜2文で。 -->

## 背景・動機
<!-- なぜこの機能が必要か。 -->

## 提案する解決策
<!-- どう実装するか。可能なら具体的に。 -->

## 代替案
<!-- 他に検討した方法があれば。 -->

## 追加情報
<!-- 参考リンク、スクリーンショット等。 -->
`;
}
