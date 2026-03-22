export function canRecoverCookieSession(
  status: number | undefined,
  email: string | null | undefined,
): boolean {
  return status === 401 && typeof email === 'string' && email.trim().length > 0;
}

export async function refreshCookieSession(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) {
    throw new Error('メールアドレスを確認できませんでした');
  }

  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email: normalized }),
  });

  if (!response.ok) {
    let errorMessage: string | undefined;
    try {
      const json = await response.json() as { error?: string };
      errorMessage = json.error;
    } catch {
      // keep fallback
    }
    throw new Error(errorMessage ?? 'セッションの更新に失敗しました');
  }
}
