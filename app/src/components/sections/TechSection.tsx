import type { Dispatch } from 'react';
import type { FormAction, FormState } from '../../state/actions';
import {
  DOMAINS,
  DOMAIN_LABELS,
  PRIMARY_LANGUAGES,
  LANGUAGE_LABELS,
  AI_TOOLS,
  AI_TOOL_LABELS,
  type PrimaryLanguage,
  type AiTool,
} from '../../constants/enums';
import { TagInput } from '../shared/TagInput';

interface TechSectionProps {
  state: FormState;
  dispatch: Dispatch<FormAction>;
  errors: Record<string, string>;
}

export function TechSection({ state, dispatch, errors }: TechSectionProps) {
  return (
    <section className="form-section">
      <h2>技術情報</h2>

      <div className="form-row">
        <label>技術ドメイン *（1つ以上選択）</label>
        <p className="hint">プロダクトの中心に近い領域を選んでください。迷う場合は利用者に見える機能寄りで選ぶと十分です。</p>
        <div className="checkbox-group">
          {DOMAINS.map((domain) => (
            <label key={domain} className="checkbox-label">
              <input
                type="checkbox"
                checked={state.tech.domains.includes(domain)}
                onChange={() => dispatch({ type: 'TOGGLE_DOMAIN', payload: domain })}
              />
              {DOMAIN_LABELS[domain]}
            </label>
          ))}
        </div>
        {errors['tech.domains'] && <span className="error">{errors['tech.domains']}</span>}
      </div>

      <div className="form-row">
        <label htmlFor="primary-language">主要言語 *</label>
        <p className="hint">今の想定で最も中心になる言語を1つ選んでください。未確定でも第一候補で進められます。</p>
        <select
          id="primary-language"
          value={state.tech.primary_language}
          onChange={(e) =>
            dispatch({ type: 'SET_PRIMARY_LANGUAGE', payload: e.target.value as PrimaryLanguage })
          }
        >
          {PRIMARY_LANGUAGES.map((lang) => (
            <option key={lang} value={lang}>
              {LANGUAGE_LABELS[lang]}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>フレームワーク（任意）</label>
        <p className="hint">確定しているものだけで十分です。候補段階なら主要なものを1〜2個入れるだけでも使えます。</p>
        <TagInput
          tags={state.tech.frameworks}
          onChange={(tags) => dispatch({ type: 'SET_FRAMEWORKS', payload: tags })}
          placeholder="例: Next.js, Prisma（Enter/カンマで追加）"
        />
      </div>

      <div className="form-row">
        <label>AI開発ツール *（複数選択可）</label>
        <p className="hint">実際に開発や設計で併用するツールを選んでください。生成物のガイド文に反映されます。</p>
        <div className="checkbox-group">
          {AI_TOOLS.map((tool) => (
            <label key={tool} className="checkbox-label">
              <input
                type="checkbox"
                checked={state.tech.ai_tools.includes(tool)}
                onChange={() => dispatch({ type: 'TOGGLE_AI_TOOL', payload: tool as AiTool })}
              />
              {AI_TOOL_LABELS[tool]}
            </label>
          ))}
        </div>
        {errors['tech.ai_tools'] && <span className="error">{errors['tech.ai_tools']}</span>}
      </div>

      {state.tech.ai_tools.includes('other') && (
        <div className="form-row">
          <label htmlFor="ai-tool-detail">AI開発ツール詳細</label>
          <p className="hint">一覧にない場合だけ具体名を書いてください。</p>
          <input
            id="ai-tool-detail"
            type="text"
            value={state.tech.ai_tool_detail}
            onChange={(e) => dispatch({ type: 'SET_AI_TOOL_DETAIL', payload: e.target.value })}
            placeholder="使用するAIツール名"
          />
        </div>
      )}
    </section>
  );
}
