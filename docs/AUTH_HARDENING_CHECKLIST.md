# AUTH_HARDENING_CHECKLIST.md

## 目的

暫定設定 `GENERATE_REQUIRE_AUTH=false` から、本番向けに `true` へ安全に戻す。

## 事前確認

1. Vercel(app) と Render(api) が最新コミットで稼働している
2. `https://repo-genesis-omega.vercel.app` から ZIP 生成が成功する
3. フィードバック送信が成功する

## 本番認証復帰手順

1. Render の Environment Variables を更新
   - `GENERATE_REQUIRE_AUTH=true`
   - `AUTH_PROVIDER=gugenka`（維持）
   - `NEXTAUTH_SECRET`（設定済みを維持）
   - `SESSION_AUDIENCE=repogenesis`（維持）
   - `CORS_ALLOW_ORIGIN=https://repo-genesis-omega.vercel.app`（維持）
2. Render で `Deploy latest commit`
3. `GET /healthz` が `{"ok":true}` を返すことを確認

## 動作確認（必須）

1. 許可ユーザーで app にアクセスして ZIP 生成
   - 成功すること
2. 非許可ユーザー（またはセッションなし）で ZIP 生成
   - `401` または `403` になること
3. フィードバック送信
   - 送信成功すること（`FEEDBACK_REQUIRE_AUTH=false` の場合）

## 失敗時ロールバック

1. Render の `GENERATE_REQUIRE_AUTH=false` に戻す
2. Render を再デプロイ
3. app で生成動作を再確認

## 次フェーズ（恒久対応）

1. gugenka セッションの発行元と cookie 共有条件を確定
2. `GENERATE_REQUIRE_AUTH=true` を恒久化
3. `FEEDBACK_REQUIRE_AUTH` 方針を決定（true/false）
4. フィードバック保存先を永続ストレージへ移行
