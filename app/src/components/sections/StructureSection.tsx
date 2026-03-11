import type { Dispatch } from 'react';
import type { FormAction, FormState } from '../../state/actions';
import type { RepoKind, RepoType } from '../../constants/enums';
import { RepoEntry } from '../shared/RepoEntry';
import { repoNameSet } from '../../state/selectors';

interface StructureSectionProps {
  state: FormState;
  dispatch: Dispatch<FormAction>;
  errors: Record<string, string>;
}

export function StructureSection({ state, dispatch, errors }: StructureSectionProps) {
  const names = Array.from(repoNameSet(state));

  return (
    <section className="form-section">
      <h2>リポジトリ構成</h2>

      <div className="form-row">
        <label>リポジトリタイプ *</label>
        <p className="hint">最初は `single` で十分なことが多いです。画面・API・インフラを明確に分けたいときに `multi` を選んでください。</p>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="repo_type"
              value="single"
              checked={state.structure.repo_type === 'single'}
              onChange={() => dispatch({ type: 'SET_REPO_TYPE', payload: 'single' as RepoType })}
            />
            シングルリポジトリ
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="repo_type"
              value="multi"
              checked={state.structure.repo_type === 'multi'}
              onChange={() => dispatch({ type: 'SET_REPO_TYPE', payload: 'multi' as RepoType })}
            />
            マルチリポジトリ
          </label>
        </div>
      </div>

      {state.structure.repo_type === 'multi' && (
        <div className="form-row">
          <p className="hint">repo 名、役割、担当、依存関係をざっくり埋めれば十分です。完全に固まっていなくても進められます。</p>
          <div className="repos-list">
            {state.structure.repos.map((repo, index) => (
              <RepoEntry
                key={index}
                index={index}
                repo={repo}
                availableNames={names}
                errors={errors}
                onChangeName={(i, v) => dispatch({ type: 'SET_REPO_NAME', payload: { index: i, value: v } })}
                onChangeKind={(i, v) => dispatch({ type: 'SET_REPO_KIND', payload: { index: i, value: v as RepoKind } })}
                onChangeDescription={(i, v) => dispatch({ type: 'SET_REPO_DESCRIPTION', payload: { index: i, value: v } })}
                onChangeOwner={(i, v) => dispatch({ type: 'SET_REPO_OWNER', payload: { index: i, value: v } })}
                onChangeDependsOn={(i, v) => dispatch({ type: 'SET_REPO_DEPENDS_ON', payload: { index: i, value: v } })}
                onRemove={(i) => dispatch({ type: 'REMOVE_REPO', payload: i })}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => dispatch({ type: 'ADD_REPO' })}
            className="btn-add"
          >
            + リポジトリを追加
          </button>

          {errors['structure.repos'] && (
            <span className="error">{errors['structure.repos']}</span>
          )}
        </div>
      )}
    </section>
  );
}
