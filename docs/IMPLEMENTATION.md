# IMPLEMENTATION.md — Phase 1: Form Implementation Guide (CLI向け)

## 前提
- 本ドキュメントはClaude Code CLI向けの実装指示書。
- Chat側は設計のみ。CLIがこのファイルを読んで実装する。
- 実装前に必ず `claude.md` と `docs/REQUIREMENTS.md` を読むこと。

---

## Step 1: プロジェクト初期化

```bash
cd /Users/masafumimikami/Documents/WebApp/RepoGenesis
npm create vite@latest app -- --template react-ts
cd app
npm install
```

- `app/` ディレクトリにフロントエンドを配置。
- RepoGenesisルート（docs/, claude.md等）と分離する。

---

## Step 2: ディレクトリ構造の作成

```
app/src/
├── App.tsx
├── components/
│   ├── sections/
│   │   ├── ProjectSection.tsx
│   │   ├── TechSection.tsx
│   │   ├── SecuritySection.tsx
│   │   ├── StructureSection.tsx
│   │   └── WorkflowSection.tsx
│   ├── shared/
│   │   ├── TagInput.tsx
│   │   ├── RepoEntry.tsx
│   │   └── SecurityLevel.tsx
│   └── output/
│       └── JsonOutput.tsx
├── state/
│   ├── formReducer.ts
│   ├── actions.ts
│   └── selectors.ts
├── utils/
│   ├── validation.ts
│   ├── securityCalc.ts
│   ├── slugify.ts
│   └── storage.ts
├── types/
│   └── projectBrief.ts
└── constants/
    └── enums.ts
```

---

## Step 3: 最小実装順序

以下の順番で実装する。各ステップは前のステップに依存する。

### 3-1: 型定義とenum（依存なし）
- `types/projectBrief.ts` — ProjectBrief, RepoEntry の interface
- `constants/enums.ts` — Domain, Language, RepoType, SecurityLevel の enum/union型

### 3-2: State管理（型定義に依存）
- `state/actions.ts` — FormAction union type
- `state/formReducer.ts` — useReducer用reducer。初期値を定義。
- `state/selectors.ts` — effectiveSecurityLevel, repoNameSet, validationErrors, canExport

### 3-3: ユーティリティ（型定義に依存）
- `utils/slugify.ts` — name→slug変換。小文字化、スペース→ハイフン、非英数字除去。
- `utils/securityCalc.ts` — フラグからsecurity.level最低値を算出。
- `utils/validation.ts` — 全フィールドのバリデーション。エラーをRecord<string, string>で返す。
- `utils/storage.ts` — localStorageへのドラフト保存/復元/クリア。キー: `draft_project_brief`。

### 3-4: 共有コンポーネント（state + utilsに依存）
- `shared/TagInput.tsx` — frameworks用。Enter/カンマで追加、×で削除。
- `shared/RepoEntry.tsx` — repos[]の1行。depends_onはマルチセレクト（現在のrepo名リストから自分を除外）。
- `shared/SecurityLevel.tsx` — 自動算出レベル表示 + 手動上書きUI（上方向のみ）。

### 3-5: セクションコンポーネント（共有コンポーネントに依存）
- `sections/ProjectSection.tsx` — name, slug(自動生成+手動編集), description, owner
- `sections/TechSection.tsx` — domains(チェックボックス), primary_language(セレクト), frameworks(TagInput), ai_tool(ラジオ), ai_tool_detail(ai_tool=other時のみ)
- `sections/SecuritySection.tsx` — 5つのトグル + SecurityLevel
- `sections/StructureSection.tsx` — repo_type(ラジオ), multi時にRepoEntry動的追加/削除
- `sections/WorkflowSection.tsx` — phases_count(数値入力)

### 3-6: 出力コンポーネント
- `output/JsonOutput.tsx` — JSONプレビュー表示 + Downloadボタン + Copy JSONボタン

### 3-7: App.tsx統合
- 全セクションを1ページに配置
- useReducerでstate管理
- localStorageからドラフト復元（起動時）
- onChange時にlocalStorageへデバウンス保存（500ms）
- Exportボタン: 全バリデーション実行 → パスしたらJSON生成
- Resetボタン: localStorage + stateをクリア

---

## Step 4: 仕様詳細（実装時に参照）

### created_at の扱い
- stateに保持しない。
- Export（Download/Copy）実行時に `new Date().toISOString()` を付与。
- 再Exportすると値は更新される。

### slug自動生成ルール
- `slugManuallyEdited: boolean` をstateに持つ（初期値: false）。
- slugManuallyEdited=false のとき: nameの変更に連動してslug自動生成。
- ユーザーがslugフィールドを直接編集したら slugManuallyEdited=true にセット。
- 以降nameの変更にslugは追従しない。
- バリデーションは常に `/^[a-z0-9][a-z0-9\-]*$/` で検証。

### security.level 自動算出
- has_payment_data=true OR has_credentials=true → "high" 強制
- has_user_data=true OR has_ip_sensitive=true → "medium" 以上
- 上記いずれもfalse → "low" 可
- ユーザーは算出値以上にのみ手動上書き可。下げることは不可。

### localStorage ドラフト保存
- キー: `draft_project_brief`
- 保存タイミング: stateの変更ごとにデバウンス（500ms）
- 復元タイミング: App.tsx マウント時
- クリア: Resetボタン押下時にlocalStorage.removeItem + stateを初期値に戻す
- 保存対象: formState全体（slugManuallyEdited含む）

### multi-repo バリデーション
- repo_type="multi"のとき repos は1つ以上必須
- repos[].name はリスト内でユニーク
- repos[].depends_on の各値は repos[].name の集合に存在すること
- 自己参照禁止（repos[].depends_on に自身のnameを含めない）

### Export JSON構造
`project_brief.json` のサンプル出力:
```json
{
  "project": {
    "name": "GStudio SaaS版",
    "slug": "gstudio-saas",
    "description": "3D生成のSaaSプラットフォーム",
    "owner": "Masafumi Mikami",
    "created_at": "2025-03-03T12:00:00.000Z"
  },
  "tech": {
    "domains": ["web", "ai"],
    "primary_language": "typescript",
    "frameworks": ["Next.js", "Prisma"],
    "ai_tool": "claude_cli"
  },
  "security": {
    "level": "medium",
    "has_api_keys": true,
    "has_user_data": true,
    "has_payment_data": false,
    "has_ip_sensitive": false,
    "has_credentials": false
  },
  "structure": {
    "repo_type": "single",
    "repos": []
  },
  "workflow": {
    "phases_count": 3
  }
}
```

---

## Step 5: 完了条件

- [ ] 全セクションが1ページに表示される
- [ ] 全必須フィールドのバリデーションが動作する
- [ ] security.levelが自動算出される
- [ ] slug がnameから自動生成される（手動編集後は追従停止）
- [ ] multi-repo時にrepos追加/削除ができる
- [ ] depends_onがマルチセレクトで選択できる
- [ ] Download JSONで正しいproject_brief.jsonがダウンロードされる
- [ ] Copy JSONでクリップボードにコピーされる
- [ ] localStorageにドラフトが保存/復元される
- [ ] Resetで全クリアされる
- [ ] `npm run dev` でローカル起動して動作する
