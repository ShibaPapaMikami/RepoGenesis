import type { Dispatch } from 'react';
import type { FormAction, FormState } from '../../state/actions';
import type { SecurityLevel as SecurityLevelType } from '../../constants/enums';
import { SecurityLevel } from '../shared/SecurityLevel';
import { minimumSecurityLevel } from '../../state/selectors';

interface SecuritySectionProps {
  state: FormState;
  dispatch: Dispatch<FormAction>;
}

interface ToggleRowProps {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

function ToggleRow({ label, checked, onChange }: ToggleRowProps) {
  return (
    <label className="toggle-label">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function SecuritySection({ state, dispatch }: SecuritySectionProps) {
  const minLevel = minimumSecurityLevel(state);

  return (
    <section className="form-section">
      <h2>セキュリティ</h2>

      <div className="form-row">
        <label>セキュリティフラグ</label>
        <p className="hint">扱う情報に近いものだけを選んでください。厳密さより「ありそうかどうか」の判断で大丈夫です。</p>
        <div className="toggle-group">
          <ToggleRow
            label="APIキー使用"
            checked={state.security.has_api_keys}
            onChange={(v) => dispatch({ type: 'SET_HAS_API_KEYS', payload: v })}
          />
          <ToggleRow
            label="ユーザーデータ"
            checked={state.security.has_user_data}
            onChange={(v) => dispatch({ type: 'SET_HAS_USER_DATA', payload: v })}
          />
          <ToggleRow
            label="決済データ"
            checked={state.security.has_payment_data}
            onChange={(v) => dispatch({ type: 'SET_HAS_PAYMENT_DATA', payload: v })}
          />
          <ToggleRow
            label="IP機密"
            checked={state.security.has_ip_sensitive}
            onChange={(v) => dispatch({ type: 'SET_HAS_IP_SENSITIVE', payload: v })}
          />
          <ToggleRow
            label="鍵・証明書"
            checked={state.security.has_credentials}
            onChange={(v) => dispatch({ type: 'SET_HAS_CREDENTIALS', payload: v })}
          />
        </div>
      </div>

      <div className="form-row">
        <label>セキュリティレベル</label>
        <p className="hint">フラグから最低ラインを自動計算します。必要があれば、より高いレベルにだけ上げられます。</p>
        <SecurityLevel
          currentLevel={state.security.level}
          minLevel={minLevel}
          onOverride={(level: SecurityLevelType) =>
            dispatch({ type: 'SET_SECURITY_LEVEL_OVERRIDE', payload: level })
          }
        />
      </div>
    </section>
  );
}
