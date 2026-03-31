import type { ReactNode } from 'react';

interface WizardStepDefinition<TStep extends string> {
  id: TStep;
  label: string;
}

interface WizardChromeProps<TStep extends string> {
  saveLabel: string;
  requiresRemoteLogin: boolean;
  testMode: boolean;
  onToggleTestMode: (checked: boolean) => void;
  runtimeLabel: string | null;
  runtimeLabelTitle?: string;
  authControls?: ReactNode;
  showDeveloperTools: boolean;
  onOpenSupportPanel: () => void;
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
  runtimeLabel,
  runtimeLabelTitle,
  authControls,
  showDeveloperTools,
  onOpenSupportPanel,
  activeStep,
  steps,
  canVisitStep,
  onGoToStep,
}: WizardChromeProps<TStep>) {
  return (
    <>
      <header className="app-header app-header-public">
        <div className="app-topbar">
          <div className="app-brand-lockup">
            <p className="app-brand-title">RepoGenesis</p>
            <p className="app-brand-subtitle">AI対応リポジトリ構造ジェネレータ</p>
          </div>
          <div className="app-topbar-copy">
            <span className="app-save-status">{saveLabel}</span>
            <span className="app-save-note">
              {requiresRemoteLogin ? 'ログインは ZIP 生成時だけ必要です' : 'ログインなしで最後まで試せます'}
            </span>
          </div>
          {authControls && <div className="app-auth-slot">{authControls}</div>}
          {showDeveloperTools && (
            <div className="app-devtools" aria-label="開発者向けユーティリティ">
              <label className="app-utility-toggle">
                <input
                  type="checkbox"
                  checked={testMode}
                  onChange={(event) => onToggleTestMode(event.target.checked)}
                />
                テストモード
              </label>
              <button
                type="button"
                className="app-inline-link app-devtools-button"
                onClick={onOpenSupportPanel}
                aria-haspopup="dialog"
              >
                運用ログ
              </button>
            </div>
          )}
          {runtimeLabel && (
            <div className="app-runtime-slot">
              <span
                className="app-build-badge"
                title={runtimeLabelTitle}
                aria-label={`現在の公開バージョン ${runtimeLabel}${runtimeLabelTitle ? `。公開時刻 ${runtimeLabelTitle}` : ''}`}
              >
                {runtimeLabel}
              </span>
            </div>
          )}
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
