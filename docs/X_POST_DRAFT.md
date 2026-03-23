# X_POST_DRAFT.md

## Draft 1

RepoGenesis の hosted flow をひと区切り。

- stable domain: `repo-genesis-omega.vercel.app`
- Render Starter + durable support store
- Vercel BFF + Google login + cookie-session
- authenticated remote ZIP generation
- support panel は internal viewer のみに限定

ローカルで良い repo を作るだけでなく、社内向けの公開 wizard として運用できるところまで来た。

#RepoGenesis #Vercel #Render #Firebase #AI開発

## Draft 2

RepoGenesis を「ローカルで ZIP を作るツール」から、「社内に配れる生成基盤」へ前進。

- `docs/AI_TOOLING.md` を中心に provider-neutral 化
- remote ZIP / support audit / deployed smoke を整備
- stable domain は `repo-genesis-omega.vercel.app`
- support panel は internal viewer だけ表示

次は stable domain 前提で auth / smoke / public docs を完全に固定する。

#RepoGenesis #DevTools #AI開発

## Before Posting

- Firebase Authorized Domains に `repo-genesis-omega.vercel.app` が入っているか
- Render `CORS_ALLOW_ORIGIN` が `https://repo-genesis-omega.vercel.app` か
- Vercel Authentication を戻すなら bypass 運用が通るか
