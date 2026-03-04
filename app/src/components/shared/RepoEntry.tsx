import { REPO_KINDS, REPO_KIND_LABELS, type RepoKind } from '../../constants/enums';

interface RepoEntryProps {
  index: number;
  repo: {
    name: string;
    type: RepoKind;
    description: string;
    owner: string;
    depends_on: string[];
  };
  availableNames: string[];
  errors: Record<string, string>;
  onChangeName: (index: number, value: string) => void;
  onChangeKind: (index: number, value: RepoKind) => void;
  onChangeDescription: (index: number, value: string) => void;
  onChangeOwner: (index: number, value: string) => void;
  onChangeDependsOn: (index: number, value: string[]) => void;
  onRemove: (index: number) => void;
}

export function RepoEntry({
  index,
  repo,
  availableNames,
  errors,
  onChangeName,
  onChangeKind,
  onChangeDescription,
  onChangeOwner,
  onChangeDependsOn,
  onRemove,
}: RepoEntryProps) {
  const prefix = `structure.repos[${index}]`;

  // depends_on の選択肢: 自分のname以外のrepo名
  const dependsOnOptions = availableNames.filter((n) => n !== repo.name);

  function handleDependsOnChange(selectedName: string) {
    if (repo.depends_on.includes(selectedName)) {
      onChangeDependsOn(index, repo.depends_on.filter((d) => d !== selectedName));
    } else {
      onChangeDependsOn(index, [...repo.depends_on, selectedName]);
    }
  }

  return (
    <div className="repo-entry">
      <div className="repo-entry-header">
        <span className="repo-entry-title">リポジトリ #{index + 1}</span>
        <button type="button" onClick={() => onRemove(index)} className="btn-remove">
          削除
        </button>
      </div>

      <div className="form-row">
        <label>リポジトリ名 (slug形式)</label>
        <input
          type="text"
          value={repo.name}
          onChange={(e) => onChangeName(index, e.target.value)}
          placeholder="my-repo"
        />
        {errors[`${prefix}.name`] && <span className="error">{errors[`${prefix}.name`]}</span>}
      </div>

      <div className="form-row">
        <label>タイプ</label>
        <select value={repo.type} onChange={(e) => onChangeKind(index, e.target.value as RepoKind)}>
          {REPO_KINDS.map((kind) => (
            <option key={kind} value={kind}>
              {REPO_KIND_LABELS[kind]}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <label>説明</label>
        <input
          type="text"
          value={repo.description}
          onChange={(e) => onChangeDescription(index, e.target.value)}
          placeholder="このリポジトリの責務"
        />
        {errors[`${prefix}.description`] && (
          <span className="error">{errors[`${prefix}.description`]}</span>
        )}
      </div>

      <div className="form-row">
        <label>責任者</label>
        <input
          type="text"
          value={repo.owner}
          onChange={(e) => onChangeOwner(index, e.target.value)}
          placeholder="責任者名"
        />
        {errors[`${prefix}.owner`] && (
          <span className="error">{errors[`${prefix}.owner`]}</span>
        )}
      </div>

      {dependsOnOptions.length > 0 && (
        <div className="form-row">
          <label>依存先リポジトリ</label>
          <div className="depends-on-list">
            {dependsOnOptions.map((name) => (
              <label key={name} className="checkbox-label">
                <input
                  type="checkbox"
                  checked={repo.depends_on.includes(name)}
                  onChange={() => handleDependsOnChange(name)}
                />
                {name}
              </label>
            ))}
          </div>
          {errors[`${prefix}.depends_on`] && (
            <span className="error">{errors[`${prefix}.depends_on`]}</span>
          )}
        </div>
      )}
    </div>
  );
}
