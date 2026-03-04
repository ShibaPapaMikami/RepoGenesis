# @gugenka/auth

Firebase Authentication + Firestore を使用した Google 認証モジュール。  
ドメイン制限・ユーザー管理・権限管理・監査ログ・サーバーサイドセッション機能付き。

## 特徴

- 🔐 Google 認証（Microsoft / Entra ID 拡張ポイントあり）
- 👥 Firestore `allowed_users` コレクションでユーザー管理
- 👑 admin / user 権限管理
- 📋 監査ログ（`audit_logs`）
- 🔑 サーバーサイドセッション（JWT / Edge Runtime 対応）
- 🎨 ログイン UI 自動生成（headless モードで OFF 可能）
- 📦 CDN / npm（ESM + CJS）両対応
- 🏗️ TypeScript 型定義付き

---

## インストール

### npm（GitHub Packages から）

```bash
npm install @gugenka/auth
```

> **前提**: `.npmrc` に GitHub Packages レジストリが設定されていること（後述）

### CDN（script タグ）

```html
<link rel="stylesheet" href="path/to/gugenka-auth.css">
<script src="path/to/gugenka-auth.js"></script>
```

---

## 利用者側の .npmrc 設定

`@gugenka/auth` は GitHub Packages (private) で配布されています。  
利用するプロジェクトのルートに `.npmrc` を作成：

```ini
@gugenka:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

`NPM_TOKEN` は GitHub Personal Access Token（`read:packages` 権限）です。

#### ローカル開発

```bash
export NPM_TOKEN=ghp_xxxxxxxxxxxx
npm install
```

#### Vercel デプロイ

Vercel のプロジェクト設定 → Environment Variables に追加：

| Key | Value | Environments |
|---|---|---|
| `NPM_TOKEN` | `ghp_xxxxxxxxxxxx` | Production, Preview, Development |

`.npmrc` がリポジトリに含まれていれば、Vercel は自動的に `NPM_TOKEN` を使います。

---

## クイックスタート

### CDN 版

```html
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
<link rel="stylesheet" href="gugenka-auth.css">
<script src="gugenka-auth.js"></script>

<script>
  GugenkaAuth.init({
    firebase: { apiKey: "...", authDomain: "...", projectId: "..." },
    useFirestore: true,
    enableAuditLog: true,
    appName: "My App",
  });
  GugenkaAuth.requireLogin();
</script>
```

### npm 版 — Headless（React / Next.js）

```ts
// lib/auth.ts
import { GugenkaAuthCore } from '@gugenka/auth';

const auth = new GugenkaAuthCore();

export function initAuth() {
  if (auth.isInitialized()) return auth;
  auth.init({
    firebase: {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    },
    useFirestore: true,
    enableAuditLog: true,
    headless: true,
  });
  return auth;
}

export { auth };
```

### npm 版 — UI 付き

```ts
import GugenkaAuth from '@gugenka/auth';
import '@gugenka/auth/style.css';

GugenkaAuth.init({ ... });
GugenkaAuth.requireLogin();
```

---

## `@gugenka/auth/server` — サーバーサイドセッション

Next.js の API Route / Middleware / Server Component で JWT セッションを管理。

### 必須環境変数

| 変数名 | 説明 | 例 |
|---|---|---|
| `NEXTAUTH_SECRET` | JWT 署名用シークレット（HS256） | `openssl rand -base64 32` で生成 |

### 使い方

```ts
import {
  signSessionJwt,
  getSessionEmailFromCookies,
  COOKIE_CANDIDATES,
} from '@gugenka/auth/server';
```

#### JWT 発行（API Route）

```ts
// app/api/auth/callback/route.ts
import { signSessionJwt } from '@gugenka/auth/server';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { email } = await req.json();

  const token = await signSessionJwt(email, {
    audience: 'my-app',      // SESSION_AUDIENCE と一致させる
    maxAgeSeconds: 3600,      // 1時間
  });

  cookies().set('__session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  });

  return Response.json({ ok: true });
}
```

#### JWT 検証（Middleware）

```ts
// middleware.ts
import { getSessionEmailFromCookies } from '@gugenka/auth/server';
import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  const email = await getSessionEmailFromCookies(req.cookies, {
    audience: 'my-app',
  });

  if (!email) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}
```

#### Cookie 名候補

`getSessionEmailFromCookies` は以下の cookie を順番に探します：

1. `__session` — Firebase Hosting 互換
2. `next-auth.session-token`
3. `__Secure-next-auth.session-token`

---

## 設定オプション

| オプション | 型 | デフォルト | 説明 |
|---|---|---|---|
| `firebase` | `object` | **必須** | Firebase設定 |
| `useFirestore` | `boolean` | `false` | Firestore ユーザー管理 |
| `enableAuditLog` | `boolean` | `false` | 監査ログ記録 |
| `headless` | `boolean` | `false` | UI生成をスキップ |
| `appName` | `string` | `'Application'` | ログイン画面タイトル |
| `loginMessage` | `string` | `'ログインしてください'` | ログイン画面メッセージ |
| `appLogo` | `string\|null` | `null` | ロゴ画像URL |
| `allowedDomains` | `string[]` | `[]` | 許可メールドメイン |
| `allowedEmails` | `string[]` | `[]` | 個別許可メールアドレス |
| `persistLogin` | `boolean` | `true` | ログイン永続化 |
| `collections.allowedUsers` | `string` | `'allowed_users'` | ユーザーコレクション名 |
| `collections.auditLogs` | `string` | `'audit_logs'` | 監査ログコレクション名 |
| `providers` | `string[]` | `['google']` | 認証プロバイダ |

---

## API リファレンス

### クライアント — 基本

| メソッド | 説明 |
|---|---|
| `init(config)` | 初期化 |
| `requireLogin()` | ログイン必須化（UI表示） |
| `loginWithGoogle()` | Googleログイン |
| `logout()` | ログアウト |
| `getCurrentUser()` | `{uid, email, name, photoURL, domain}` |
| `getCurrentUserData()` | Firestoreデータ `{role, name, ...}` |
| `onAuthStateChanged(cb)` | `cb(user, userData)` |
| `isAdmin()` | 管理者かどうか |
| `isAllowedUser(email)` | 許可されているか |

### クライアント — 管理者（Firestore）

| メソッド | 説明 |
|---|---|
| `getAllUsers()` | 全ユーザー取得 |
| `addUser(email, name?, role?)` | ユーザー追加 |
| `removeUser(email)` | ユーザー削除 |

### サーバー (`@gugenka/auth/server`)

| 関数 | 説明 |
|---|---|
| `signSessionJwt(email, opts)` | セッション JWT を発行 |
| `getSessionEmailFromCookies(cookies, opts)` | Cookie から email を検証・取得 |
| `COOKIE_CANDIDATES` | 探索する cookie 名の配列 |

---

## Firestore セキュリティルール

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /allowed_users/{email} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/allowed_users/$(request.auth.token.email)).data.role == 'admin';
    }
    match /audit_logs/{logId} {
      allow create: if request.auth != null;
      allow read: if request.auth != null &&
        get(/databases/$(database)/documents/allowed_users/$(request.auth.token.email)).data.role == 'admin';
      allow update, delete: if false;
    }
  }
}
```

### 初期 admin ユーザー

Firestore コンソールで `allowed_users` に追加：

```
ドキュメントID: admin@example.com
  name: "管理者"
  role: "admin"
  addedAt: (timestamp)
```

---

## セキュリティ注意点

1. **Firestore ルール必須** — `isAdmin()` はUI制御のみ。データ保護はルールで
2. **ドメイン制限は多層防御** — `allowedDomains` + `allowed_users` の二重チェック推奨
3. **監査ログは append-only** — `update, delete: if false`
4. **NEXTAUTH_SECRET** — 十分な長さ（32バイト以上）のランダム文字列を使用
5. **Cookie は httpOnly + secure** — XSS からトークンを保護

---

## 開発

```bash
# 依存インストール
npm install

# ビルド（dist/ 生成）
npm run build

# 型チェック
npm run lint

# テスト（ビルド後）
npm run build && npm test

# 開発サーバー（examples 用）
npm run dev
```

### ディレクトリ構成

```
src/
├── core/              # 認証コアロジック (headless)
│   ├── auth.js
│   ├── audit.js
│   ├── config.js
│   ├── firestore.js
│   └── providers.js
├── server/
│   └── session.ts     # サーバーサイド JWT セッション
├── ui/
│   └── login-overlay.js
├── styles/
│   └── gugenka-auth.css
├── index.js           # ESMエントリポイント
├── index.d.ts         # TypeScript型定義
├── gugenka-auth.js    # CDN版 (all-in-one)
└── gugenka-auth.css   # CDN版 CSS

dist/                  # ← npm publish 対象（gitignore）
├── index.mjs / .cjs / .d.ts
├── server.mjs / .cjs / .d.ts
├── gugenka-auth.js    # CDN用
└── gugenka-auth.css
```

---

## リリース手順

```bash
# 1. バージョン更新
npm version patch   # or minor / major

# 2. タグ push → GitHub Actions が自動 publish
git push origin main --tags
```

GitHub Actions (`.github/workflows/publish.yml`) が：
1. `npm ci` → `npm run build` → dist 検証
2. tag と package.json のバージョン一致を確認
3. GitHub Packages に `npm publish`

### 手動 publish（必要な場合）

```bash
npm run build
npm publish
```

---

## CaseStudy 側の移行手順

現在 `packages/auth` として同梱（workspaces）している場合の移行：

### 1. `.npmrc` を追加（プロジェクトルート）

```ini
@gugenka:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NPM_TOKEN}
```

### 2. `package.json` を変更

```diff
- "@gugenka/auth": "workspace:*"
+ "@gugenka/auth": "^2.1.0"
```

### 3. workspaces から除外

```diff
  "workspaces": [
-   "packages/auth",
    "packages/other"
  ]
```

### 4. `packages/auth/` ディレクトリを削除

```bash
rm -rf packages/auth
```

### 5. インストール確認

```bash
npm install
```

### 6. Vercel 環境変数を設定

| Key | Value |
|---|---|
| `NPM_TOKEN` | GitHub PAT (`read:packages`) |
| `NEXTAUTH_SECRET` | JWT シークレット |

### 7. import はそのまま

```ts
// 変更不要 — パスは同じ
import { getSessionEmailFromCookies } from '@gugenka/auth/server';
```

---

## 互換性ポリシー

### Semver 準拠

| バージョン | 内容 |
|---|---|
| `MAJOR` (3.0.0) | 破壊的変更（API シグネチャ変更、削除、exports パス変更） |
| `MINOR` (2.2.0) | 後方互換な機能追加（新メソッド、新 export パス、新オプション） |
| `PATCH` (2.1.1) | バグ修正、ドキュメント更新 |

### 破壊的変更のルール

- 既存の export パス (`.`, `./server`, `./style.css`) は MAJOR まで維持
- `onAuthStateChanged` コールバックの引数は追加のみ（削除・変更は MAJOR）
- `GugenkaAuthConfig` のプロパティ追加は MINOR（optional のみ）
- サーバー側 (`./server`) の関数シグネチャ変更は MAJOR
- `NEXTAUTH_SECRET` / cookie 名の変更は MAJOR
- 非推奨化は MINOR で `@deprecated` 付与 → 次の MAJOR で削除

### Node.js サポート

- `engines.node >= 18` — Active LTS のみ
- EOL バージョンの切り捨ては MINOR で可

---

## Microsoft / Entra ID 対応（将来）

`src/core/providers.js` に拡張ポイントあり。config に `providers: ['google', 'microsoft']` と `microsoftTenantId` を追加して対応予定。

---

## 実績

- VPuro Analytics（サンリオ向け VRChat ダッシュボード）
- gugenka-case-study

## ライセンス

Proprietary — Gugenka Inc.
