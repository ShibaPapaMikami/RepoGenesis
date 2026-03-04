# ADR-0001: Frontend Technology — React + Vite (SPA)

## Status
Accepted

## Date
2025-03-03

## Context
RepoGenesisのWebフォームに使うフロントエンド技術を選定する必要がある。フォームは社内6名が使う入力ツールで、動的UI（multi-repo追加/削除、security.level自動算出）を含む。ジェネレータ（json→ファイル生成）との統合方式も判断が必要。

## Decision
- フロントエンド: React + Vite (SPA)
- ジェネレータ: Phase 2でNode CLIとして分離実装
- 配布: ローカル起動（npm run dev）

## Consequences
### Positive
- フォーム=入力、ジェネレータ=生成で責務分離。長期で壊れにくい。
- ビルドが速い。開発体験が良い。
- TypeScript対応。動的フォームとの相性が良い。
- まずproject_brief.jsonを出せれば価値が出る。ジェネレータは後から接続。

### Negative
- フォーム送信→生成→ダウンロードがワンクリックで完結しない（Phase 2でCLIを別途実行する必要がある）。
- 将来Web統合が必要になった場合、Next.js等への移行コストが発生する。

## Alternatives Considered
- **Next.js**: フォーム+ジェネレータを1アプリに統合できるが、認証/運用が重くなる。社内ツールとしてはオーバースペック。Phase 3以降の選択肢として保留。
- **Plain HTML + vanilla JS**: 依存ゼロだが、動的フォーム（repos追加/削除、自動算出）の実装が煩雑。
