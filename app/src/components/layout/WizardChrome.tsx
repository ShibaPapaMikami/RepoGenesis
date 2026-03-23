interface WizardStepDefinition<TStep extends string> {
  id: TStep;
  label: string;
}

interface WizardChromeProps<TStep extends string> {
  saveLabel: string;
  requiresRemoteLogin: boolean;
  testMode: boolean;
  onToggleTestMode: (checked: boolean) => void;
  buildLabel: string;
  activeStep: TStep;
  steps: WizardStepDefinition<TStep>[];
  canVisitStep: (step: TStep) => boolean;
  onGoToStep: (step: TStep) => void;
}

export function WizardChrome<TStep extends string>({
  saveLabel,
  requiresRemoteLogin,
  testMode,
  onToggleTestMode,
  buildLabel,
  activeStep,
  steps,
  canVisitStep,
  onGoToStep,
}: WizardChromeProps<TStep>) {
  return (
    <>
      <header className="app-header app-header-public">
        <div className="app-topbar">
          <div className="app-topbar-copy">
            <span className="app-save-status">{saveLabel}</span>
            <span className="app-save-note">
              {requiresRemoteLogin ? 'ログインは ZIP 生成時だけ必要です' : 'ログインなしで最後まで試せます'}
            </span>
          </div>
          <label className="app-utility-toggle">
            <input
              type="checkbox"
              checked={testMode}
              onChange={(event) => onToggleTestMode(event.target.checked)}
            />
            テストモード
          </label>
        </div>

        <div className="app-hero-panel">
          <p className="app-kicker">AI Intake Wizard For Better Repos</p>
          <div className="app-hero-grid">
            <div className="app-hero-copy">
              <h1>RepoGenesis</h1>
              <p className="app-hero-title">AI対応リポジトリ構造ジェネレータ</p>
              <p className="app-hero-lead">
                相談メモを、そのまま starter repo に変えるための生成フローです。構成、security、skill、runbook まで 1 本の wizard で固めます。
              </p>
              <div className="app-hero-tags" aria-label="主な特徴">
                <span className="app-hero-tag">Prompt-to-draft</span>
                <span className="app-hero-tag">Runbook-aware</span>
                <span className="app-hero-tag">Skill-ready</span>
              </div>
            </div>
            <aside className="app-hero-aside">
              <p className="app-hero-meta-label">Current build</p>
              <p className="app-version">{buildLabel}</p>
              <p className="app-hero-meta-copy">
                Intake → Options → Review → ZIP の順に進めば、手戻りを抑えた starter repo を作れます。
              </p>
            </aside>
          </div>
        </div>
      </header>

      <nav className="wizard-nav" aria-label="作業ステップ">
        {steps.map((step, index) => {
          const available = canVisitStep(step.id);
          const current = activeStep === step.id;
          return (
            <button
              key={step.id}
              type="button"
              className={`wizard-step${current ? ' wizard-step-current' : ''}${available ? '' : ' wizard-step-locked'}`}
              onClick={() => onGoToStep(step.id)}
              disabled={!available}
              aria-current={current ? 'step' : undefined}
              aria-disabled={!available}
            >
              <span className="wizard-step-index">{index + 1}</span>
              <span>{step.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
