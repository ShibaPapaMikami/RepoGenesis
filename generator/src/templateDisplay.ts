export function formatOwner(owner: string): string {
  return owner.trim() || 'TBD';
}

export function formatDomains(domains: string[]): string {
  return domains.length > 0 ? domains.join(', ') : 'unspecified';
}

export function formatProjectDescription(description: string): string {
  const lines = description
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return 'TBD';

  const normalizedLines = lines.map((line) => line.replace(/^[-*]\s*/, '').replace(/^\d+[.)]\s*/, '').trim());
  const isListLike = lines.every((line) => /^[-*]\s*/.test(line) || /^\d+[.)]\s*/.test(line));

  if (isListLike) {
    return normalizedLines.join(' / ');
  }

  return normalizedLines.join(' ');
}
