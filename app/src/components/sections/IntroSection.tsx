interface IntroSectionProps {
  onStart: () => void;
  saveLabel: string;
  requiresLoginForRemoteZip: boolean;
}

const VALUE_POINTS = [
  {
    title: 'AIとの壁打ちを draft に変換',
    body: 'ChatGPT / Claude / Gemini で整理した内容を、そのまま RepoGenesis 用の draft に変換します。',
  },
  {
    title: '最終確認をして ZIP を生成',
    body: 'リポジトリ構成、security、Skill を整えてから ZIP を生成できます。',
  },
  {
    title: '途中で閉じても続きから再開',
    body: '入力内容と下書きはブラウザに自動保存されるので、途中で閉じても戻れます。',
  },
];

const FLOW_POINTS = [
  '相談用プロンプトをコピーする',
  'AI で整理した内容を貼り付ける',
  'draft を確認して必要な項目だけ直す',
  'Skill と最終設定を選んで ZIP を生成する',
];

export function IntroSection({ onStart, saveLabel, requiresLoginForRemoteZip }: IntroSectionProps) {
  return (
    <section className="form-section intro-section">
      <p className="section-kicker">Step 1</p>
      <h2>このツールでできること</h2>
      <p className="consultation-lead intro-lead">
        RepoGenesis は、AI との相談メモをそのままプロジェクト draft に変換し、GitHub に置ける starter repo の ZIP まで作るためのツールです。
      </p>

      <div className="intro-hero">
        <div className="intro-copy">
          <h3>アイデアや要件メモを、すぐ作業できる形へ整えます</h3>
          <p>
            社内ツール、クライアント案件、個人プロジェクトまで、相談ベースの文章から構成案・説明・Skill をまとめて整えます。
          </p>
          <div className="intro-meta">
            <span className="intro-chip">{saveLabel}</span>
            <span className="intro-chip">
              {requiresLoginForRemoteZip ? 'ログインは ZIP 生成時だけ必要' : 'ログインなしで試せます'}
            </span>
          </div>
        </div>
        <div className="intro-flow-card">
          <h4>進め方</h4>
          <ol>
            {FLOW_POINTS.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ol>
        </div>
      </div>

      <div className="intro-value-grid">
        {VALUE_POINTS.map((point) => (
          <article key={point.title} className="intro-value-card">
            <h4>{point.title}</h4>
            <p>{point.body}</p>
          </article>
        ))}
      </div>

      <div className="output-actions">
        <button type="button" onClick={onStart} className="btn-primary">
          相談を始める
        </button>
      </div>
    </section>
  );
}
