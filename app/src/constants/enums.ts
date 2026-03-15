export const DOMAINS = ['web', 'mobile', 'unity', 'xr', 'ai', 'infra', 'cli', 'iot'] as const;
export type Domain = typeof DOMAINS[number];

export const DOMAIN_LABELS: Record<Domain, string> = {
  web: 'Webアプリ/サイト',
  mobile: 'iOS/Android',
  unity: 'Unity実装基盤',
  xr: 'XR体験領域（VR/AR/MR）',
  ai: 'AI/ML機能',
  infra: 'インフラ/DevOps',
  cli: 'コマンドラインツール',
  iot: 'IoTデバイス連携',
};

export const PRIMARY_LANGUAGES = ['typescript', 'python', 'csharp', 'swift', 'go', 'rust', 'kotlin', 'other'] as const;
export type PrimaryLanguage = typeof PRIMARY_LANGUAGES[number];

export const LANGUAGE_LABELS: Record<PrimaryLanguage, string> = {
  typescript: 'TypeScript',
  python: 'Python',
  csharp: 'C#',
  swift: 'Swift',
  go: 'Go',
  rust: 'Rust',
  kotlin: 'Kotlin',
  other: 'その他',
};

export const AI_TOOLS = ['codex', 'claude_code', 'gemini_cli', 'other'] as const;
export type AiTool = typeof AI_TOOLS[number];

export const AI_TOOL_LABELS: Record<AiTool, string> = {
  codex: 'Codex',
  claude_code: 'Claude Code',
  gemini_cli: 'Gemini CLI',
  other: 'その他',
};

export const SECURITY_LEVELS = ['low', 'medium', 'high'] as const;
export type SecurityLevel = typeof SECURITY_LEVELS[number];

export const REPO_TYPES = ['single', 'multi'] as const;
export type RepoType = typeof REPO_TYPES[number];

export const REPO_KINDS = ['frontend', 'backend', 'infra', 'sdk', 'unity', 'mobile', 'ops'] as const;
export type RepoKind = typeof REPO_KINDS[number];

export const REPO_KIND_LABELS: Record<RepoKind, string> = {
  frontend: 'フロントエンド',
  backend: 'バックエンド',
  infra: 'インフラ',
  sdk: 'SDK',
  unity: 'Unity',
  mobile: 'モバイル',
  ops: 'Ops',
};
