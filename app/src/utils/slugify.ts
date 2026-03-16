interface SlugKeywordRule {
  pattern: RegExp;
  token: string;
}

const CJK_PATTERN = /[\u3040-\u30ff\u3400-\u9fff]/u;

const SLUG_KEYWORD_RULES: SlugKeywordRule[] = [
  { pattern: /契約書|契約/u, token: 'contract' },
  { pattern: /レビュー/u, token: 'review' },
  { pattern: /依頼/u, token: 'request' },
  { pattern: /管理/u, token: 'management' },
  { pattern: /会議|ミーティング/u, token: 'meeting' },
  { pattern: /議事録/u, token: 'minutes' },
  { pattern: /音声|録音/u, token: 'audio' },
  { pattern: /文字起こし/u, token: 'transcription' },
  { pattern: /来場者/u, token: 'visitor' },
  { pattern: /データ/u, token: 'data' },
  { pattern: /収集/u, token: 'collection' },
  { pattern: /工場/u, token: 'factory' },
  { pattern: /設備/u, token: 'equipment' },
  { pattern: /メンテナンス|保守|点検/u, token: 'maintenance' },
  { pattern: /記録/u, token: 'records' },
  { pattern: /大学/u, token: 'university' },
  { pattern: /授業/u, token: 'class' },
  { pattern: /質問/u, token: 'question' },
  { pattern: /ボット/u, token: 'bot' },
  { pattern: /法務/u, token: 'legal' },
  { pattern: /社内/u, token: 'internal' },
  { pattern: /\bai\b|ＡＩ|ａｉ|AI/u, token: 'ai' },
  { pattern: /システム/u, token: 'system' },
  { pattern: /ツール/u, token: 'tool' },
  { pattern: /アプリ/u, token: 'app' },
  { pattern: /サービス/u, token: 'service' },
];

function normalizeAsciiSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+/, '')
    .replace(/-+$/g, '')
    .replace(/-{2,}/g, '-');
}

function inferKeywordTokens(input: string): string[] {
  return SLUG_KEYWORD_RULES
    .map((rule, index) => ({ token: rule.token, start: input.search(rule.pattern), index }))
    .filter((match) => match.start >= 0)
    .sort((left, right) => left.start - right.start || left.index - right.index)
    .map((match) => match.token)
    .filter((token, index, list) => list.indexOf(token) === index);
}

/**
 * name → slug 変換。
 * 英字名は通常の slug 化、日本語混在名はキーワード推定を併用して意味のある slug を作る。
 */
export function slugify(input: string): string {
  const asciiSlug = normalizeAsciiSlug(input);
  if (!CJK_PATTERN.test(input)) return asciiSlug;

  const asciiTokens = asciiSlug ? asciiSlug.split('-').filter(Boolean) : [];
  const keywordTokens = inferKeywordTokens(input);
  const mergedTokens = [...asciiTokens];

  for (const token of keywordTokens) {
    if (!mergedTokens.includes(token)) {
      mergedTokens.push(token);
    }
  }

  return mergedTokens.slice(0, 6).join('-');
}

/** slug形式バリデーション: /^[a-z0-9][a-z0-9\-]*$/ */
export function isValidSlug(slug: string): boolean {
  if (slug.length === 0) return false;
  return /^[a-z0-9][a-z0-9-]*$/.test(slug);
}
