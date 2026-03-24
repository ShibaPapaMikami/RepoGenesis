interface IntroSectionProps {
  onResume: () => void;
  hasSavedProgress: boolean;
  resumeStepLabel: string;
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
    body: 'リポジトリ構成、security、Skill（スキル）を整えてから ZIP を生成できます。',
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
  'Skill（スキル）と最終設定を選んで ZIP を生成する',
];

export function IntroSection({
  onResume,
  hasSavedProgress,
  resumeStepLabel,
  saveLabel,
  requiresLoginForRemoteZip,
}: IntroSectionProps) {
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
            社内ツール、クライアント案件、個人プロジェクトまで、相談ベースの文章から構成案・説明・Skill（スキル）をまとめて整えます。
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

      {hasSavedProgress && (
        <div className="intro-resume-card">
          <div>
            <p className="section-kicker">再開できます</p>
            <h4>前回の入力内容がブラウザに残っています</h4>
            <p>
              途中保存された内容を使って <strong>{resumeStepLabel}</strong> から再開できます。新しく始める場合は前回内容を消して Step 2 から進みます。
            </p>
          </div>
          <div className="output-actions">
            <button type="button" onClick={onResume} className="btn-secondary">
              前回の続きを再開
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
