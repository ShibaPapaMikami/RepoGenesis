import type { Dispatch } from 'react';
import {
  DEPENDENCY_CATEGORIES,
  DEPENDENCY_CATEGORY_LABELS,
  TECH_DECISION_STATUSES,
  TECH_DECISION_STATUS_LABELS,
} from '../../constants/enums';
import type { FormAction, FormState } from '../../state/actions';

interface PlanningSectionProps {
  state: FormState;
  dispatch: Dispatch<FormAction>;
}

function toCsv(value: string[]): string {
  return value.join(', ');
}

function fromCsv(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function PlanningSection({ state, dispatch }: PlanningSectionProps) {
  return (
    <section className="form-section">
      <h2>技術判断と外部依存</h2>
      <p className="hint">
        ここでは API / モデル / 外部サービス / OSS の採用状況を整理します。`Adopted` は採用済み、`Candidate` は候補、`Open`
        は未確定、`Rejected` は採用しない案です。
      </p>

      <div className="planning-group">
        <div className="planning-group-header">
          <div>
            <h3>技術判断</h3>
            <p className="hint">何を採用するか、なぜそうするかを残します。</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => dispatch({ type: 'ADD_TECH_DECISION' })}>
            技術判断を追加
          </button>
        </div>

        {state.planning.tech_decisions.length === 0 ? (
          <p className="hint">まだ技術判断はありません。AI API、モデル、DB、認証、通知などが決まっていれば追加してください。</p>
        ) : (
          <div className="planning-stack">
            {state.planning.tech_decisions.map((item, index) => (
              <div key={`tech-decision-${index}`} className="planning-item">
                <div className="planning-item-header">
                  <strong>技術判断 {index + 1}</strong>
                  <button type="button" className="btn-secondary btn-small" onClick={() => dispatch({ type: 'REMOVE_TECH_DECISION', payload: index })}>
                    削除
                  </button>
                </div>

                <div className="planning-grid">
                  <div className="form-row">
                    <label htmlFor={`decision-topic-${index}`}>トピック</label>
                    <input
                      id={`decision-topic-${index}`}
                      type="text"
                      value={item.topic}
                      onChange={(event) => dispatch({
                        type: 'SET_TECH_DECISION_FIELD',
                        payload: { index, field: 'topic', value: event.target.value },
                      })}
                      placeholder="例: AI API / Database / Notification"
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor={`decision-choice-${index}`}>選択肢</label>
                    <input
                      id={`decision-choice-${index}`}
                      type="text"
                      value={item.choice}
                      onChange={(event) => dispatch({
                        type: 'SET_TECH_DECISION_FIELD',
                        payload: { index, field: 'choice', value: event.target.value },
                      })}
                      placeholder="例: OpenAI API / Supabase / Slack"
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor={`decision-status-${index}`}>状態</label>
                    <select
                      id={`decision-status-${index}`}
                      value={item.status}
                      onChange={(event) => dispatch({
                        type: 'SET_TECH_DECISION_FIELD',
                        payload: { index, field: 'status', value: event.target.value },
                      })}
                    >
                      {TECH_DECISION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {TECH_DECISION_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <label htmlFor={`decision-date-${index}`}>決定日</label>
                    <input
                      id={`decision-date-${index}`}
                      type="date"
                      value={item.decision_date}
                      onChange={(event) => dispatch({
                        type: 'SET_TECH_DECISION_FIELD',
                        payload: { index, field: 'decision_date', value: event.target.value },
                      })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <label htmlFor={`decision-rationale-${index}`}>採用理由</label>
                  <textarea
                    id={`decision-rationale-${index}`}
                    rows={2}
                    value={item.rationale}
                    onChange={(event) => dispatch({
                      type: 'SET_TECH_DECISION_FIELD',
                      payload: { index, field: 'rationale', value: event.target.value },
                    })}
                    placeholder="なぜこの技術判断にしたか"
                  />
                </div>

                <div className="form-row">
                  <label htmlFor={`decision-notes-${index}`}>補足</label>
                  <textarea
                    id={`decision-notes-${index}`}
                    rows={2}
                    value={item.notes}
                    onChange={(event) => dispatch({
                      type: 'SET_TECH_DECISION_FIELD',
                      payload: { index, field: 'notes', value: event.target.value },
                    })}
                    placeholder="保留条件や確認したいこと"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="planning-group">
        <div className="planning-group-header">
          <div>
            <h3>外部依存</h3>
            <p className="hint">外部 API、サービス、OSS、GitHub リポジトリ、npm package を台帳化します。</p>
          </div>
          <button type="button" className="btn-secondary" onClick={() => dispatch({ type: 'ADD_EXTERNAL_DEPENDENCY' })}>
            外部依存を追加
          </button>
        </div>

        {state.planning.external_dependencies.length === 0 ? (
          <p className="hint">まだ外部依存はありません。採用済みや候補の API / サービス / package があれば追加してください。</p>
        ) : (
          <div className="planning-stack">
            {state.planning.external_dependencies.map((item, index) => (
              <div key={`external-dependency-${index}`} className="planning-item">
                <div className="planning-item-header">
                  <strong>外部依存 {index + 1}</strong>
                  <button type="button" className="btn-secondary btn-small" onClick={() => dispatch({ type: 'REMOVE_EXTERNAL_DEPENDENCY', payload: index })}>
                    削除
                  </button>
                </div>

                <div className="planning-grid">
                  <div className="form-row">
                    <label htmlFor={`dependency-name-${index}`}>名前</label>
                    <input
                      id={`dependency-name-${index}`}
                      type="text"
                      value={item.name}
                      onChange={(event) => dispatch({
                        type: 'SET_EXTERNAL_DEPENDENCY_FIELD',
                        payload: { index, field: 'name', value: event.target.value },
                      })}
                      placeholder="例: OpenAI API / Supabase / Slack"
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor={`dependency-category-${index}`}>カテゴリ</label>
                    <select
                      id={`dependency-category-${index}`}
                      value={item.category}
                      onChange={(event) => dispatch({
                        type: 'SET_EXTERNAL_DEPENDENCY_FIELD',
                        payload: { index, field: 'category', value: event.target.value },
                      })}
                    >
                      {DEPENDENCY_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {DEPENDENCY_CATEGORY_LABELS[category]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <label htmlFor={`dependency-status-${index}`}>状態</label>
                    <select
                      id={`dependency-status-${index}`}
                      value={item.status}
                      onChange={(event) => dispatch({
                        type: 'SET_EXTERNAL_DEPENDENCY_FIELD',
                        payload: { index, field: 'status', value: event.target.value },
                      })}
                    >
                      {TECH_DECISION_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {TECH_DECISION_STATUS_LABELS[status]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <label htmlFor={`dependency-owner-${index}`}>担当</label>
                    <input
                      id={`dependency-owner-${index}`}
                      type="text"
                      value={item.owner}
                      onChange={(event) => dispatch({
                        type: 'SET_EXTERNAL_DEPENDENCY_FIELD',
                        payload: { index, field: 'owner', value: event.target.value },
                      })}
                      placeholder="例: プラットフォーム担当"
                    />
                  </div>
                </div>

                <div className="planning-grid">
                  <div className="form-row">
                    <label htmlFor={`dependency-purpose-${index}`}>用途</label>
                    <input
                      id={`dependency-purpose-${index}`}
                      type="text"
                      value={item.purpose}
                      onChange={(event) => dispatch({
                        type: 'SET_EXTERNAL_DEPENDENCY_FIELD',
                        payload: { index, field: 'purpose', value: event.target.value },
                      })}
                      placeholder="例: AI要約 / 認証 / 通知"
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor={`dependency-source-${index}`}>参照元</label>
                    <input
                      id={`dependency-source-${index}`}
                      type="text"
                      value={item.source}
                      onChange={(event) => dispatch({
                        type: 'SET_EXTERNAL_DEPENDENCY_FIELD',
                        payload: { index, field: 'source', value: event.target.value },
                      })}
                      placeholder="例: https://platform.openai.com/"
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor={`dependency-license-${index}`}>ライセンス/契約種別</label>
                    <input
                      id={`dependency-license-${index}`}
                      type="text"
                      value={item.license}
                      onChange={(event) => dispatch({
                        type: 'SET_EXTERNAL_DEPENDENCY_FIELD',
                        payload: { index, field: 'license', value: event.target.value },
                      })}
                      placeholder="例: MIT / Commercial"
                    />
                  </div>

                  <div className="form-row">
                    <label htmlFor={`dependency-env-${index}`}>環境変数</label>
                    <input
                      id={`dependency-env-${index}`}
                      type="text"
                      value={toCsv(item.env_vars)}
                      onChange={(event) => dispatch({
                        type: 'SET_EXTERNAL_DEPENDENCY_ENV_VARS',
                        payload: { index, value: fromCsv(event.target.value) },
                      })}
                      placeholder="例: OPENAI_API_KEY, SUPABASE_URL"
                    />
                  </div>
                </div>

                <div className="planning-grid planning-grid-tight">
                  <label className="checkbox-row">
                    <input
                      type="checkbox"
                      checked={item.data_outbound}
                      onChange={(event) => dispatch({
                        type: 'SET_EXTERNAL_DEPENDENCY_DATA_OUTBOUND',
                        payload: { index, value: event.target.checked },
                      })}
                    />
                    データの社外送信が発生する
                  </label>
                </div>

                <div className="form-row">
                  <label htmlFor={`dependency-notes-${index}`}>補足</label>
                  <textarea
                    id={`dependency-notes-${index}`}
                    rows={2}
                    value={item.notes}
                    onChange={(event) => dispatch({
                      type: 'SET_EXTERNAL_DEPENDENCY_FIELD',
                      payload: { index, field: 'notes', value: event.target.value },
                    })}
                    placeholder="契約条件、利用時の注意点、未確定事項など"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
