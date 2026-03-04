import type { Dispatch } from 'react';
import type { FormAction, FormState } from '../../state/actions';

interface ProjectSectionProps {
  state: FormState;
  dispatch: Dispatch<FormAction>;
  errors: Record<string, string>;
}

export function ProjectSection({ state, dispatch, errors }: ProjectSectionProps) {
  return (
    <section className="form-section">
      <h2>プロジェクト情報</h2>

      <div className="form-row">
        <label htmlFor="project-name">プロジェクト名 *</label>
        <input
          id="project-name"
          type="text"
          value={state.project.name}
          onChange={(e) => dispatch({ type: 'SET_PROJECT_NAME', payload: e.target.value })}
          placeholder="例: GStudio SaaS版"
        />
        {errors['project.name'] && <span className="error">{errors['project.name']}</span>}
      </div>

      <div className="form-row">
        <label htmlFor="project-slug">
          スラッグ *
          {!state.slugManuallyEdited && (
            <span className="hint">（プロジェクト名から自動生成）</span>
          )}
        </label>
        <input
          id="project-slug"
          type="text"
          value={state.project.slug}
          onChange={(e) => dispatch({ type: 'SET_PROJECT_SLUG', payload: e.target.value })}
          placeholder="例: gstudio-saas"
        />
        {errors['project.slug'] && <span className="error">{errors['project.slug']}</span>}
      </div>

      <div className="form-row">
        <label htmlFor="project-description">概要 *（10文字以上）</label>
        <textarea
          id="project-description"
          value={state.project.description}
          onChange={(e) => dispatch({ type: 'SET_PROJECT_DESCRIPTION', payload: e.target.value })}
          placeholder="プロジェクトの概要を記述してください"
          rows={3}
        />
        {errors['project.description'] && (
          <span className="error">{errors['project.description']}</span>
        )}
      </div>

      <div className="form-row">
        <label htmlFor="project-owner">責任者 *</label>
        <input
          id="project-owner"
          type="text"
          value={state.project.owner}
          onChange={(e) => dispatch({ type: 'SET_PROJECT_OWNER', payload: e.target.value })}
          placeholder="例: Masafumi Mikami"
        />
        {errors['project.owner'] && <span className="error">{errors['project.owner']}</span>}
      </div>
    </section>
  );
}
