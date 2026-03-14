import { useEffect, useMemo, useRef, useState } from 'react';

declare global {
  interface Window {
    GugenkaAuth?: {
      init: (config: Record<string, unknown>) => void;
      isInitialized: () => boolean;
      loginWithGoogle: () => Promise<unknown>;
      logout: () => Promise<void>;
      onAuthStateChanged: (
        callback: (
          user: { email: string; name: string; photoURL?: string | null } | null,
          userData: unknown,
        ) => void,
      ) => void;
    };
    firebase?: unknown;
  }
}

interface AuthPanelProps {
  enabled: boolean;
  onSessionChange: (session: { authenticated: boolean; email: string | null }) => void;
  compact?: boolean;
}

type Status = 'disabled' | 'loading' | 'ready' | 'authenticated' | 'error';

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

const APP_NAME = (import.meta.env.VITE_AUTH_APP_NAME as string | undefined) ?? 'RepoGenesis';
const LOGIN_MESSAGE = (import.meta.env.VITE_AUTH_LOGIN_MESSAGE as string | undefined)
  ?? 'Gugenka スタッフでログインしてください';
const ALLOWED_DOMAIN = (import.meta.env.VITE_AUTH_ALLOWED_DOMAIN as string | undefined) ?? 'gugenka.jp';

function hasFirebaseConfig(): boolean {
  return Boolean(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.authDomain && FIREBASE_CONFIG.projectId);
}

function getAuthErrorMessage(status: number, error?: string): string {
  const normalized = error?.trim().toLowerCase();

  if (normalized === 'email is not allowed' || status === 403) {
    return 'このアカウントでは利用できません。Gugenka スタッフ用アカウントでログインしてください。';
  }
  if (normalized === 'email is required' || status === 400) {
    return 'ログイン情報を確認できませんでした。もう一度ログインしてください。';
  }
  if (normalized?.includes('nextauth_secret') || normalized?.includes('session setup failed') || status >= 500) {
    return '認証のサーバー設定で問題が発生しています。管理者に連絡してください。';
  }
  return '認証に失敗しました。時間をおいて再度お試しください。';
}

async function fetchSessionState(): Promise<{ authenticated: boolean; email: string | null }> {
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    let errorMessage: string | undefined;
    try {
      const json = await response.json() as { error?: string };
      errorMessage = json.error;
    } catch {
      // keep fallback
    }
    throw new Error(getAuthErrorMessage(response.status, errorMessage));
  }
  const json = await response.json() as { authenticated?: boolean; email?: string | null };
  return {
    authenticated: Boolean(json.authenticated),
    email: json.email ?? null,
  };
}

export function AuthPanel({ enabled, onSessionChange, compact = false }: AuthPanelProps) {
  const [status, setStatus] = useState<Status>(enabled ? 'loading' : 'disabled');
  const [message, setMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const syncedEmailRef = useRef<string | null>(null);
  const initializedRef = useRef(false);

  const missingConfig = useMemo(() => !hasFirebaseConfig(), []);

  useEffect(() => {
    if (!enabled) {
      setStatus('disabled');
      setMessage(null);
      setEmail(null);
      onSessionChange({ authenticated: false, email: null });
      return;
    }

    let cancelled = false;

    async function bootstrap() {
      setStatus('loading');
      try {
        const session = await fetchSessionState();
        if (cancelled) return;
        syncedEmailRef.current = session.email;
        setEmail(session.email);
        onSessionChange(session);
        if (session.authenticated) {
          setStatus('authenticated');
          setMessage('ログイン済みです。ZIP 生成を実行できます。');
        } else {
          setStatus('ready');
          setMessage('ログインすると ZIP 生成が有効になります。');
        }
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : '認証状態の確認に失敗しました');
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [enabled, onSessionChange]);

  useEffect(() => {
    if (!enabled || missingConfig || initializedRef.current) return;

    let attempts = 0;
    const timer = window.setInterval(() => {
      attempts += 1;
      if (!window.firebase || !window.GugenkaAuth) {
        if (attempts >= 40) {
          window.clearInterval(timer);
          setStatus('error');
          setMessage('認証スクリプトの読み込みに失敗しました');
        }
        return;
      }

      window.clearInterval(timer);
      try {
        if (!window.GugenkaAuth.isInitialized()) {
          window.GugenkaAuth.init({
            firebase: FIREBASE_CONFIG,
            headless: true,
            useFirestore: false,
            enableAuditLog: false,
            persistLogin: true,
            appName: APP_NAME,
            loginMessage: LOGIN_MESSAGE,
            allowedDomains: [ALLOWED_DOMAIN],
          });
        }

        window.GugenkaAuth.onAuthStateChanged((user) => {
          if (!user?.email) return;
          setEmail(user.email);
          if (syncedEmailRef.current === user.email.toLowerCase()) {
            setStatus('authenticated');
            setMessage('ログイン済みです。ZIP 生成を実行できます。');
            onSessionChange({ authenticated: true, email: user.email.toLowerCase() });
            return;
          }

          void (async () => {
            setIsBusy(true);
            try {
              const response = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ email: user.email }),
              });
              const data = await response.json() as { error?: string; email?: string };
              if (!response.ok) {
                throw new Error(getAuthErrorMessage(response.status, data.error));
              }
              const normalized = (data.email ?? user.email).toLowerCase();
              syncedEmailRef.current = normalized;
              setEmail(normalized);
              setStatus('authenticated');
              setMessage('ログイン済みです。ZIP 生成を実行できます。');
              onSessionChange({ authenticated: true, email: normalized });
            } catch (error) {
              setStatus('error');
              setMessage(error instanceof Error ? error.message : 'セッション作成に失敗しました');
              onSessionChange({ authenticated: false, email: null });
            } finally {
              setIsBusy(false);
            }
          })();
        });

        initializedRef.current = true;
      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : '認証初期化に失敗しました');
      }
    }, 250);

    return () => {
      window.clearInterval(timer);
    };
  }, [enabled, missingConfig, onSessionChange]);

  async function handleLogin() {
    if (!window.GugenkaAuth) {
      setStatus('error');
      setMessage('認証 UI がまだ読み込まれていません');
      return;
    }
    setIsBusy(true);
    setMessage('Google ログインを開始します...');
    try {
      await window.GugenkaAuth.loginWithGoogle();
    } catch (error) {
      setStatus('error');
      setMessage('Google ログインに失敗しました。もう一度お試しください。');
    } finally {
      setIsBusy(false);
    }
  }

  async function handleLogout() {
    setIsBusy(true);
    try {
      if (window.GugenkaAuth) {
        await window.GugenkaAuth.logout();
      }
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      syncedEmailRef.current = null;
      setEmail(null);
      setStatus('ready');
      setMessage('ログアウトしました');
      onSessionChange({ authenticated: false, email: null });
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'ログアウトに失敗しました');
    } finally {
      setIsBusy(false);
    }
  }

  if (!enabled) return null;

  if (compact) {
    return (
      <section className="form-section auth-panel auth-panel-compact">
        <div className="auth-panel-compact-row">
          <div>
            <p className="section-kicker">Auth</p>
            <p className="auth-panel-subtitle">
              {email ? `ログイン中: ${email}` : 'ZIP生成の前に Gugenka アカウントでログインします。'}
            </p>
            {message && <p className={status === 'error' ? 'error auth-message' : 'auth-message'}>{message}</p>}
          </div>
          <div className="auth-panel-compact-actions">
            <span className={`auth-badge auth-badge-${status}`}>
              {status === 'authenticated' ? '認証済み' : status === 'loading' ? '確認中' : status === 'error' ? 'エラー' : '未認証'}
            </span>
            {!missingConfig && (
              <div className="output-actions">
                <button
                  type="button"
                  onClick={handleLogin}
                  disabled={isBusy}
                  className="btn-primary"
                >
                  {isBusy ? '処理中...' : 'Google でログイン'}
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isBusy || !email}
                  className="btn-secondary"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
        {missingConfig && <p className="error">Vercel に Firebase 認証設定が不足しています。</p>}
      </section>
    );
  }

  return (
    <section className="form-section auth-panel">
      <div className="auth-panel-header">
        <div>
          <h2>認証</h2>
          <p className="auth-panel-subtitle">Gugenka スタッフのログイン状態で ZIP 生成を制御します。</p>
        </div>
        <span className={`auth-badge auth-badge-${status}`}>
          {status === 'authenticated' ? '認証済み' : status === 'loading' ? '確認中' : status === 'error' ? 'エラー' : '未認証'}
        </span>
      </div>

      {missingConfig ? (
        <p className="error">Vercel に Firebase 認証設定が不足しています。</p>
      ) : (
        <>
          <p className="auth-email">{email ? `現在のユーザー: ${email}` : '現在のユーザー: 未ログイン'}</p>
          {message && <p className={status === 'error' ? 'error auth-message' : 'auth-message'}>{message}</p>}
          <div className="output-actions">
            <button
              type="button"
              onClick={handleLogin}
              disabled={isBusy}
              className="btn-primary"
            >
              {isBusy ? '処理中...' : 'Google でログイン'}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isBusy || !email}
              className="btn-secondary"
            >
              ログアウト
            </button>
          </div>
        </>
      )}
    </section>
  );
}
