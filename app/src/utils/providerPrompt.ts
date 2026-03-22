export const EXTERNAL_PROMPT_PROVIDERS = ['chatgpt', 'claude', 'gemini'] as const;
export type ExternalPromptProvider = typeof EXTERNAL_PROMPT_PROVIDERS[number];

export const EXTERNAL_PROMPT_PROVIDER_LABELS: Record<ExternalPromptProvider, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
};

type PromptMode = 'consultation' | 'refinement';

const PROVIDER_GUIDANCE: Record<ExternalPromptProvider, Record<PromptMode, string[]>> = {
  chatgpt: {
    consultation: [
      '返答は指定した見出しだけを使い、前置きや補足説明は付けないでください。',
      '分からない内容は推測で埋めず、`未確定事項` に残してください。',
      '箇条書きでも短文でもよいので、RepoGenesis に貼り戻しやすい形を優先してください。',
    ],
    refinement: [
      'すでに確認できた事実を崩さず、仮置きと未確定事項を分けて整理してください。',
      '現在のフォーム設定に矛盾する提案をする場合は、その理由を `未確定事項` に残してください。',
      '出力は指定見出しだけを使い、RepoGenesis に再貼り付けできる markdown のまま返してください。',
    ],
  },
  claude: {
    consultation: [
      '情報が不足している箇所は強く補完せず、曖昧さを保ったまま `未確定事項` に寄せてください。',
      '業務要件と技術判断を混ぜず、技術的な候補は `RepoGenesis入力候補` へ短くまとめてください。',
      '見出し名は変更せず、そのまま返してください。',
    ],
    refinement: [
      'fact / assumption / open question の境界を崩さず、要件整理だけに集中してください。',
      '既存の採用済み技術判断は尊重し、変更提案がある場合は `未確定事項` に残してください。',
      '出力は簡潔な markdown にし、見出し以外の前置きは書かないでください。',
    ],
  },
  gemini: {
    consultation: [
      '見出し構造を厳密に守り、空欄を作らず、不明な点は `未確定事項` にまとめてください。',
      '技術候補や security の仮置きは `RepoGenesis入力候補` に key-value っぽく短く残してください。',
      '後でフォームへ写しやすいように、過度に長い説明を避けてください。',
    ],
    refinement: [
      '現在の draft とフォーム設定を踏まえて、更新後の markdown 全体をそのまま返してください。',
      'RepoGenesis入力候補 では `domain`, `security_level`, `repo_style`, `ai_api` のような key を優先してください。',
      '未確定な内容を採用済みとして書かず、判断保留のものは `未確定事項` に残してください。',
    ],
  },
};

const MODE_LABELS: Record<PromptMode, string> = {
  consultation: '相談整理',
  refinement: '要件再整理',
};

export function buildProviderGuidedPrompt(
  basePrompt: string,
  provider: ExternalPromptProvider,
  mode: PromptMode,
): string {
  const providerLabel = EXTERNAL_PROMPT_PROVIDER_LABELS[provider];
  const bullets = PROVIDER_GUIDANCE[provider][mode].map((item) => `- ${item}`).join('\n');

  return `# ${providerLabel} 向け ${MODE_LABELS[mode]}プロンプト

このプロンプトは RepoGenesis に貼り戻すためのものです。

## ${providerLabel} に伝えたいこと
${bullets}

## 依頼本文
${basePrompt}
`;
}

export function buildProviderPromptFilename(
  baseFilename: string,
  provider: ExternalPromptProvider,
): string {
  const trimmed = baseFilename.trim();
  const suffix = `-${provider}`;
  if (trimmed.endsWith('.md')) {
    return `${trimmed.slice(0, -3)}${suffix}.md`;
  }
  return `${trimmed}${suffix}.md`;
}
