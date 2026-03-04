# ADR-0002: Generator — Node CLI with tsc build, zod validation

## Status
Accepted

## Date
2026-03-03

## Context
Phase 2のジェネレータの実行方式、バリデーション手法、出力上書き戦略を決定する必要がある。社内6名が使うCLIツールのため、環境差で動かないリスクを最小化し、スキーマ拡張に耐えるバリデーションが必要。

## Decision
- 実行方式: `tsc` でビルド → `node dist/index.js` で実行。ts-nodeは使わない。
- コマンド化: package.json の `bin` で `repogenesis` コマンドを定義。npm link で使える。
- バリデーション: zod でruntime validation + TS型推論を統一。自作validatorは作らない。
- 出力上書き: デフォルトは既存slugディレクトリがあれば失敗終了。`--force` で削除して再生成。`--merge` はやらない。
- テンプレート: TypeScriptテンプレートリテラル関数。外部テンプレートエンジンは使わない。

## Consequences
### Positive
- tscビルドにより環境差の影響を最小化。distをそのまま配布可能。
- zodでスキーマ定義と型推論が一元化。スキーマ拡張時にバリデーション漏れが起きない。
- 上書き戦略が明確で事故が防げる。

### Negative
- zodが外部依存として追加される（ただし軽量で安定）。
- ビルドステップが必要（開発時のフィードバックが若干遅くなる）。

## Alternatives Considered
- **ts-node実行**: 社内配布時にNode/TS環境差で動かないリスクが高い。却下。
- **自作validator**: スキーマ拡張時に漏れる。zodの型推論統一のメリットが大きい。却下。
- **--merge対応**: 初期段階では複雑すぎる。Phase 3以降の選択肢として保留。
