/**
 * name → slug 変換。
 * 小文字化、スペース→ハイフン、非英数字・ハイフン除去、先頭ハイフン除去。
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+/, '')
    .replace(/-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** slug形式バリデーション: /^[a-z0-9][a-z0-9\-]*$/ */
export function isValidSlug(slug: string): boolean {
  if (slug.length === 0) return false;
  return /^[a-z0-9][a-z0-9-]*$/.test(slug);
}
