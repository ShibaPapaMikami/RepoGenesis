import type { SimpleIntakeState, SimpleDataSensitivity, SimpleIntegrationStatus, SimpleRepoConfidence } from '../../utils/simpleIntake.ts';
import { CONSULTATION_PROMPT_OPTIONS } from '../../utils/intakeParser.ts';

interface SimpleInputSectionProps {
  state: SimpleIntakeState;
  onChange: <K extends keyof SimpleIntakeState>(key: K, value: SimpleIntakeState[K]) => void;
  onApplyTestInput: () => void;
  onBuildDraft: () => void;
  message: string | null;
}

export function SimpleInputSection({
  state,
  onChange,
  onApplyTestInput,
  onBuildDraft,
  message,
}: SimpleInputSectionProps) {
  return (
    <section className="form-section consultation-section">
      <h2>かんたん入力</h2>
      <p className="consultation-lead">
        まずは業務の話だけを入れてください。構成判断が分からない項目は「未確定」のままで進められます。
      </p>

      <div className="simple-grid">
        <div className="form-row">
          <label htmlFor="simple-variant">相談の種類</label>
          <select
            id="simple-variant"
            value={state.variant}
            onChange={(e) => onChange('variant', e.target.value as SimpleIntakeState['variant'])}
          >
            {CONSULTATION_PROMPT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="simple-owner">責任者</label>
          <input
            id="simple-owner"
            type="text"
            value={state.owner}
            onChange={(e) => onChange('owner', e.target.value)}
            placeholder="例: Gugenka 企画チーム"
          />
        </div>
      </div>

      <div className="form-row">
        <label htmlFor="simple-summary">何を作るか</label>
        <textarea
          id="simple-summary"
          rows={3}
          value={state.summary}
          onChange={(e) => onChange('summary', e.target.value)}
          placeholder="例: 社内の案件相談と進行管理をまとめるAI活用ツール"
        />
      </div>

      <div className="form-row">
        <label htmlFor="simple-problem">いま困っていること</label>
        <textarea
          id="simple-problem"
          rows={3}
          value={state.problem}
          onChange={(e) => onChange('problem', e.target.value)}
          placeholder="例: 相談履歴と判断ログがSlackとスプレッドシートに分散している"
        />
      </div>

      <div className="simple-grid">
        <div className="form-row">
          <label htmlFor="simple-users">誰が使うか</label>
          <textarea
            id="simple-users"
            rows={4}
            value={state.usersText}
            onChange={(e) => onChange('usersText', e.target.value)}
            placeholder={'例:\n営業\nPM\n制作進行'}
          />
        </div>

        <div className="form-row">
          <label htmlFor="simple-first">まず作るもの</label>
          <textarea
            id="simple-first"
            rows={4}
            value={state.firstDeliverable}
            onChange={(e) => onChange('firstDeliverable', e.target.value)}
            placeholder="例: 案件一覧と相談履歴を見られる管理画面"
          />
        </div>
      </div>

      <div className="simple-grid">
        <div className="form-row">
          <label htmlFor="simple-data">扱うデータ</label>
          <textarea
            id="simple-data"
            rows={4}
            value={state.dataKindsText}
            onChange={(e) => onChange('dataKindsText', e.target.value)}
            placeholder={'例:\n案件名\n担当者\n顧客情報'}
          />
        </div>

        <div className="form-row">
          <label htmlFor="simple-unresolved">まだ決めていないこと</label>
          <textarea
            id="simple-unresolved"
            rows={4}
            value={state.unresolvedNotes}
            onChange={(e) => onChange('unresolvedNotes', e.target.value)}
            placeholder={'例:\n権限管理を初期から入れるか\n将来 multi repo に分けるべきか'}
          />
        </div>
      </div>

      <div className="simple-grid">
        <div className="form-row">
          <label htmlFor="simple-integration-status">外部APIや外部サービス連携</label>
          <select
            id="simple-integration-status"
            value={state.integrationStatus}
            onChange={(e) => onChange('integrationStatus', e.target.value as SimpleIntegrationStatus)}
          >
            <option value="unknown">まだ分からない</option>
            <option value="none">使わない想定</option>
            <option value="maybe">必要かもしれない</option>
            <option value="yes">使う前提</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="simple-data-sensitivity">データの重さ</label>
          <select
            id="simple-data-sensitivity"
            value={state.dataSensitivity}
            onChange={(e) => onChange('dataSensitivity', e.target.value as SimpleDataSensitivity)}
          >
            <option value="none">公開情報や軽い情報が中心</option>
            <option value="internal">社内情報が中心</option>
            <option value="personal">個人情報・顧客情報を扱う</option>
          </select>
        </div>
      </div>

      <div className="simple-grid">
        <div className="form-row">
          <label htmlFor="simple-repo">リポジトリ構成の見込み</label>
          <select
            id="simple-repo"
            value={state.repoConfidence}
            onChange={(e) => onChange('repoConfidence', e.target.value as SimpleRepoConfidence)}
          >
            <option value="unknown">まだ分からない</option>
            <option value="single">まずは 1 リポジトリで足りそう</option>
            <option value="multi">将来は複数に分かれそう</option>
          </select>
        </div>

        <div className="form-row">
          <label htmlFor="simple-integration-notes">連携候補（任意）</label>
          <input
            id="simple-integration-notes"
            type="text"
            value={state.integrationNotes}
            onChange={(e) => onChange('integrationNotes', e.target.value)}
            placeholder="例: Slack, Google Drive, Backlog"
          />
        </div>
      </div>

      <div className="output-actions">
        <button type="button" onClick={onApplyTestInput} className="btn-secondary">
          かんたん入力のテスト入力を適用
        </button>
        <button
          type="button"
          onClick={onBuildDraft}
          className="btn-primary"
          disabled={!state.summary.trim() || !state.problem.trim() || !state.firstDeliverable.trim()}
        >
          かんたん入力から draft を作成
        </button>
      </div>

      {message && <p className="consultation-message">{message}</p>}
    </section>
  );
}
