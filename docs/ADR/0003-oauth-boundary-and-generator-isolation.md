# ADR-0003: OAuth Boundary and Generator Isolation

## Status
Accepted

## Date
2026-03-03

## Context
Phase 3 で OAuth ベースの Web システム（`@gugenka/auth`）統合を検討している。  
ここで認証・認可の責務と生成ロジックの責務を分離しないと、CLI/Web で生成結果がドリフトするリスクが高い。

## Decision
1. OAuth は「誰が実行できるか」の判定に限定する。
2. 生成ロジック（`generateFromSpec`）は auth 情報を入力に含めない。
3. 同一 `ProjectSpec` からの生成結果は、認証有無に関係なく同一でなければならない。
4. Web サーバー導入時も、サーバーは orchestration 層に留める（validation + authorization + invoke）。
5. 監査情報（実行者、時刻、結果）はサーバー側ログに保存し、生成ファイルの構造ルールとは分離する。

## Consequences
### Positive
- CLI/Web/OAuth で生成結果の再現性を維持できる。
- 認証方式の変更（OAuth provider差し替え）が generator に波及しない。
- 責務分離によりテスト戦略が単純になる（generator は pure、auth は境界テスト）。

### Negative
- サーバー層で入力検証と認可を二重で扱う設計コストが増える。
- 監査要件が増えると orchestration 層の実装量は増える。

## Alternatives Considered
- **authコンテキストを template 分岐に使う**: 実行者依存で生成物が変わり再現性を失うため却下。
- **Web 専用 generator 実装を別に持つ**: ロジック二重化によるドリフトが確実に発生するため却下。
