import type { Dispatch } from 'react';
import type { FormAction, FormState } from '../../state/actions';

interface WorkflowSectionProps {
  state: FormState;
  dispatch: Dispatch<FormAction>;
  errors: Record<string, string>;
}

export function WorkflowSection({ state, dispatch, errors }: WorkflowSectionProps) {
  return (
    <section className="form-section">
      <h2>ワークフロー</h2>

      <div className="form-row">
        <label htmlFor="phases-count">初期フェーズ数（1〜10、デフォルト3）</label>
        <input
          id="phases-count"
          type="number"
          min={1}
          max={10}
          value={state.workflow.phases_count}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (!isNaN(value)) {
              dispatch({ type: 'SET_PHASES_COUNT', payload: value });
            }
          }}
        />
        {errors['workflow.phases_count'] && (
          <span className="error">{errors['workflow.phases_count']}</span>
        )}
      </div>
    </section>
  );
}
