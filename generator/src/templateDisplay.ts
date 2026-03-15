export function formatOwner(owner: string): string {
  return owner.trim() || 'TBD';
}

export function formatDomains(domains: string[]): string {
  return domains.length > 0 ? domains.join(', ') : 'unspecified';
}
