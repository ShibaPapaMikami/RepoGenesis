export type RuntimeLabelMode = 'public' | 'admin' | 'hidden';

export function normalizeRuntimeLabelMode(value: string | undefined | null): RuntimeLabelMode {
  const normalized = value?.trim().toLowerCase();
  if (normalized === 'admin') return 'admin';
  if (normalized === 'hidden') return 'hidden';
  return 'public';
}

function parseDeployDate(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

export function formatRuntimeDeployTime(value: string): string {
  const parsed = parseDeployDate(value);
  if (!parsed) return '';
  return new Intl.DateTimeFormat('ja-JP', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(parsed);
}

export function formatRuntimeLabelTitle(value: string): string {
  const parsed = parseDeployDate(value);
  if (!parsed) return '公開時刻は未設定です';
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(parsed);
}

export function buildRuntimeLabel(releaseLabel: string, commitLabel: string, deployTime: string): string {
  const timeLabel = formatRuntimeDeployTime(deployTime);
  const identity = `${releaseLabel} (${commitLabel})`;
  return timeLabel ? `${identity} ${timeLabel}` : identity;
}

export function shouldShowRuntimeLabel(mode: RuntimeLabelMode, isAdminViewer: boolean): boolean {
  if (mode === 'hidden') return false;
  if (mode === 'admin') return isAdminViewer;
  return true;
}
