import { SECURITY_LEVELS, type SecurityLevel as SecurityLevelType } from '../../constants/enums';

const LEVEL_ORDER: SecurityLevelType[] = ['low', 'medium', 'high'];
const LEVEL_LABELS: Record<SecurityLevelType, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

interface SecurityLevelProps {
  currentLevel: SecurityLevelType;
  minLevel: SecurityLevelType;
  onOverride: (level: SecurityLevelType) => void;
}

export function SecurityLevel({ currentLevel, minLevel, onOverride }: SecurityLevelProps) {
  const minIndex = LEVEL_ORDER.indexOf(minLevel);

  // ユーザーは minLevel 以上のみ選択可
  const selectableOptions = SECURITY_LEVELS.filter(
    (_, i) => i >= minIndex,
  );

  return (
    <div className="security-level">
      <div className="security-level-display">
        <span className="security-level-current">
          現在のレベル: <strong className={`level-${currentLevel}`}>{LEVEL_LABELS[currentLevel]}</strong>
        </span>
        <span className="security-level-min">
          （自動算出の最低値: {LEVEL_LABELS[minLevel]}）
        </span>
      </div>
      <div className="security-level-override">
        <label>手動上書き（上方向のみ）:</label>
        <select
          value={currentLevel}
          onChange={(e) => onOverride(e.target.value as SecurityLevelType)}
        >
          {selectableOptions.map((level) => (
            <option key={level} value={level}>
              {LEVEL_LABELS[level]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
