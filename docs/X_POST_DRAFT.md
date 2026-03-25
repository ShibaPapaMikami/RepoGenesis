# X_POST_DRAFT.md

## Draft 1

個人で作っている RepoGenesis を、公開して試せるところまで持ってきた。

- stable domain: `repo-genesis-omega.vercel.app`
- Render Starter + durable support store
- Vercel BFF + Google login + cookie-session
- authenticated remote ZIP generation
- support panel は internal viewer のみに限定

AI との相談メモを、そのまま starter repo の ZIP まで落とせる。
自分でも使うし、社内でも使うし、外にも見せられる状態になってきた。

#RepoGenesis #Vercel #Render #Firebase #AI開発

## Draft 2

RepoGenesis を「ローカルで ZIP を作るだけのツール」から、「公開 wizard として動く個人プロジェクト」へ前進。

- `docs/AI_TOOLING.md` を中心に provider-neutral 化
- remote ZIP / support audit / deployed smoke を整備
- stable domain は `repo-genesis-omega.vercel.app`
- support panel は internal viewer だけ表示

次は public docs と launch copy をもっと整える。

#RepoGenesis #DevTools #AI開発

## Before Posting

- Firebase Authorized Domains に `repo-genesis-omega.vercel.app` が入っているか
- Render `CORS_ALLOW_ORIGIN` が `https://repo-genesis-omega.vercel.app` か
- stable domain で Google ログインと ZIP 生成が通るか
