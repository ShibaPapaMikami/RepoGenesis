import { useEffect, useState } from 'react';
import {
  fetchSupportSnapshot,
  type SupportAuditRecord,
  type SupportFeedbackRecord,
  type SupportFeedbackType,
} from '../../utils/support.ts';

interface SupportPanelProps {
  enabled: boolean;
  sessionEmail: string | null;
}

interface SupportPanelState {
  feedbackItems: SupportFeedbackRecord[];
  auditItems: SupportAuditRecord[];
  feedbackStorePath: string;
  auditStorePath: string;
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function shortStorePath(value: string): string {
  const parts = value.split(/[\\/]/).filter(Boolean);
  if (parts.length <= 2) return value;
  return `.../${parts.slice(-2).join('/')}`;
}

function feedbackTypeLabel(value: SupportFeedbackRecord['type']): string {
  return value === 'bug' ? 'bug' : 'request';
}

function auditResultLabel(value: SupportAuditRecord['result']): string {
  return value === 'success' ? 'success' : 'failure';
}

export function SupportPanel({ enabled, sessionEmail }: SupportPanelProps) {
  const [feedbackType, setFeedbackType] = useState<SupportFeedbackType>('all');
  const [data, setData] = useState<SupportPanelState>({
    feedbackItems: [],
    auditItems: [],
    feedbackStorePath: '',
    auditStorePath: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      setMessage(null);
      setLastLoadedAt(null);
      setData({
        feedbackItems: [],
        auditItems: [],
        feedbackStorePath: '',
        auditStorePath: '',
      });
      return;
    }

    let cancelled = false;

    async function load() {
      setStatus('loading');
      setMessage('運用ログを読み込んでいます...');
      try {
        const snapshot = await fetchSupportSnapshot({ feedbackType });
        if (cancelled) return;
        setData(snapshot);
        setStatus('ready');
        setMessage(null);
        setLastLoadedAt(
          new Date().toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        );
      } catch (error) {
        if (cancelled) return;
        setStatus('error');
        setMessage(error instanceof Error ? error.message : '運用ログの読み込みに失敗しました');
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [enabled, feedbackType]);

  async function handleRefresh() {
    if (!enabled) return;
    setStatus('loading');
    setMessage('運用ログを再読み込みしています...');
    try {
      const snapshot = await fetchSupportSnapshot({ feedbackType });
      setData(snapshot);
      setStatus('ready');
      setMessage(null);
      setLastLoadedAt(
        new Date().toLocaleTimeString('ja-JP', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      );
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : '運用ログの読み込みに失敗しました');
    }
  }

  if (!enabled) return null;

  return (
    <section className="form-section support-panel">
      <div className="support-panel-header">
        <div>
          <p className="section-kicker">Internal Support</p>
          <h2>運用ログ</h2>
          <p className="support-panel-lead">
            remote / cookie-session 構成で保存された feedback と generation audit を read-only で確認します。
          </p>
          {sessionEmail && <p className="support-panel-meta">閲覧中: {sessionEmail}</p>}
          {lastLoadedAt && <p className="support-panel-meta">最終読み込み: {lastLoadedAt}</p>}
        </div>
        <div className="support-panel-actions">
          <label className="support-filter">
            feedback
            <select value={feedbackType} onChange={(event) => setFeedbackType(event.target.value as SupportFeedbackType)}>
              <option value="all">all</option>
              <option value="bug">bug</option>
              <option value="request">request</option>
            </select>
          </label>
          <button type="button" className="btn-secondary" onClick={() => void handleRefresh()}>
            再読み込み
          </button>
        </div>
      </div>

      {message && (
        <div className={`generation-status ${status === 'error' ? 'generation-status-error' : 'generation-status-pending'}`}>
          <p>{message}</p>
        </div>
      )}

      <div className="support-store-summary">
        <p><strong>feedback store:</strong> {data.feedbackStorePath ? shortStorePath(data.feedbackStorePath) : '未取得'}</p>
        <p><strong>audit store:</strong> {data.auditStorePath ? shortStorePath(data.auditStorePath) : '未取得'}</p>
      </div>

      <div className="support-grid">
        <section className="consultation-card support-card">
          <div className="support-card-header">
            <h4>最新 feedback</h4>
            <span className="support-count">{data.feedbackItems.length}件</span>
          </div>
          {data.feedbackItems.length === 0 ? (
            <p className="support-empty">まだ feedback はありません。</p>
          ) : (
            <ul className="support-list">
              {data.feedbackItems.map((item) => (
                <li key={item.feedbackId} className="support-list-item">
                  <div className="support-list-head">
                    <strong>{item.title}</strong>
                    <span className={`support-pill support-pill-${item.type}`}>{feedbackTypeLabel(item.type)}</span>
                  </div>
                  <p>{item.description}</p>
                  <p className="support-list-meta">
                    {formatTimestamp(item.createdAt)} / {item.userId} / requestId: {item.requestId}
                    {item.email ? ` / ${item.email}` : ''}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="consultation-card support-card">
          <div className="support-card-header">
            <h4>最新 generation audit</h4>
            <span className="support-count">{data.auditItems.length}件</span>
          </div>
          {data.auditItems.length === 0 ? (
            <p className="support-empty">まだ generation audit はありません。</p>
          ) : (
            <ul className="support-list">
              {data.auditItems.map((item) => (
                <li key={item.requestId} className="support-list-item">
                  <div className="support-list-head">
                    <strong>{item.requestId}</strong>
                    <span className={`support-pill support-pill-${item.result}`}>{auditResultLabel(item.result)}</span>
                  </div>
                  <p className="support-list-meta">
                    {formatTimestamp(item.timestamp)} / {item.userId}
                  </p>
                  <p className="support-list-meta">
                    repo: {item.repoType ?? 'unknown'} / files: {item.fileCount ?? '-'} / spec: {item.specVersion ?? '-'}
                    {item.errorCode ? ` / error: ${item.errorCode}` : ''}
                  </p>
                  <p className="support-list-meta">
                    slug: {item.projectSlug ?? '-'} / auth: {item.authProvider ?? '-'}:{item.authMode ?? '-'}
                    {item.artifactFilename ? ` / artifact: ${item.artifactFilename}` : ''}
                  </p>
                  {item.selectedSkillIds && item.selectedSkillIds.length > 0 && (
                    <p className="support-list-meta">
                      skills: {item.selectedSkillIds.join(', ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
