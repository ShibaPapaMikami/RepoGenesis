import * as path from 'path';

const safeIdentifierRegex = /^[a-z0-9][a-z0-9-]*$/;

export function assertSafeIdentifier(value: string, label: string): string {
  if (!safeIdentifierRegex.test(value)) {
    throw new Error(`${label} must be slug-safe (lowercase letters, numbers, hyphens)`);
  }
  return value;
}

export function assertSafeRelativePath(relativePath: string, label: string): string {
  const normalized = relativePath.replace(/\\/g, '/');
  if (normalized.length === 0) {
    throw new Error(`${label} must not be empty`);
  }
  if (path.posix.isAbsolute(normalized)) {
    throw new Error(`${label} must be relative`);
  }

  const collapsed = path.posix.normalize(normalized);
  if (
    collapsed === '.'
    || collapsed === '..'
    || collapsed.startsWith('../')
    || collapsed.includes('/../')
  ) {
    throw new Error(`${label} must stay within the project root`);
  }

  return collapsed;
}

export function ensurePathWithin(basePath: string, candidatePath: string, label: string): string {
  const resolvedBase = path.resolve(basePath);
  const resolvedCandidate = path.resolve(candidatePath);
  const relative = path.relative(resolvedBase, resolvedCandidate);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    return resolvedCandidate;
  }
  throw new Error(`${label} escapes the allowed base path`);
}

export function resolvePathWithin(basePath: string, relativePath: string, label: string): string {
  const safeRelativePath = assertSafeRelativePath(relativePath, label);
  return ensurePathWithin(basePath, path.resolve(basePath, safeRelativePath), label);
}
