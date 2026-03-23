import { randomUUID } from 'crypto';

export function resolveRequestId(prefix: string, maybeId: unknown): string {
  if (typeof maybeId === 'string' && maybeId.trim().length > 0) {
    return maybeId.trim();
  }
  return `${prefix}-${randomUUID()}`;
}

export function createEntityId(prefix: string): string {
  return `${prefix}-${randomUUID()}`;
}
