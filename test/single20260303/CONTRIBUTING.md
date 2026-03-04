# Contributing to シングルテスト

## Branch Naming

```
<type>/<short-description>
```

| Type | 用途 |
|------|------|
| `feat/` | 新機能 |
| `fix/` | バグ修正 |
| `refactor/` | リファクタリング |
| `docs/` | ドキュメント |
| `chore/` | 依存・設定等 |
| `test/` | テスト追加・修正 |

例: `feat/add-auth`, `fix/null-check-user`

## Commit Rules (Conventional Commits)

```
<type>(<scope>): <summary>
```

- **type**: feat | fix | refactor | docs | chore | test | ci | perf
- **scope**: 任意。変更対象のモジュール名
- **summary**: 英語、命令形、小文字始まり、末尾にピリオド不要

例:
```
feat(auth): add JWT token refresh
fix(api): handle null response from payment service
docs(readme): update install instructions
```

## Pull Request Rules

### タイトル
Conventional Commits 形式に従う: `feat(scope): summary`

### 本文（必須項目）
PR本文には以下を必ず含めること:

1. **目的** — なぜこの変更が必要か
2. **変更点** — 何を変えたか（箇条書き）
3. **テスト** — どうテストしたか
4. **セキュリティチェック** — 以下を確認済みであること:
   - [ ] API キー・シークレットがコードに含まれていない
   - [ ] .env ファイルがコミットされていない
   - [ ] ログにセンシティブ情報が出力されない

## Security

- **API キー・シークレット・トークンをコードに含めることは禁止。**
- `.env` ファイルは絶対にコミットしない。
- プレースホルダー（`YOUR_API_KEY_HERE`）を使うこと。
- 違反を発見した場合は即座にローテーションし、ADR に記録すること。

## Release Tags

```
vX.Y.Z
```

- [Semantic Versioning](https://semver.org/) に従う
- **X**: 破壊的変更
- **Y**: 後方互換の機能追加
- **Z**: バグ修正
- tag push で CI/CD が発火する前提
