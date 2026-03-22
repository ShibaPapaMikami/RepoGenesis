import type { FormState } from '../state/actions';
import type { IntakeDraft } from './intakeParser';
import type { ConsultationPromptVariant } from './intakeParser';
import type { SimpleIntakeState } from './simpleIntake.ts';
import { normalizeAiTools, type LegacyAiTool } from './aiTools.ts';
import { normalizeIntakeProviderMetadata } from './intakeProvider.ts';
import {
  normalizeRecommendationDecisions,
  type RecommendationDecisions,
} from './recommendations.ts';

const STORAGE_KEY = 'draft_project_brief';
const CONSULTATION_TEXT_KEY = 'consultation_input_text';
const CONSULTATION_DRAFT_KEY = 'consultation_input_draft';
const SIMPLE_INPUT_KEY = 'simple_input_state';
const INPUT_MODE_KEY = 'consultation_input_mode';
const SELECTED_SKILLS_KEY = 'selected_skill_ids';
const CONSULTATION_PROMPT_VARIANT_KEY = 'consultation_prompt_variant';
const UI_TEST_MODE_KEY = 'ui_test_mode';
const RECOMMENDATION_DECISIONS_KEY = 'consultation_recommendation_decisions';

export function saveDraft(state: FormState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function loadDraft(): FormState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return migrateDraft(JSON.parse(raw) as FormState);
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // silently ignore
  }
}

export function saveConsultationText(value: string): void {
  try {
    localStorage.setItem(CONSULTATION_TEXT_KEY, value);
  } catch {
    // silently ignore
  }
}

export function loadConsultationText(): string {
  try {
    return localStorage.getItem(CONSULTATION_TEXT_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveConsultationDraft(value: IntakeDraft | null): void {
  try {
    if (!value) {
      localStorage.removeItem(CONSULTATION_DRAFT_KEY);
      return;
    }
    localStorage.setItem(CONSULTATION_DRAFT_KEY, JSON.stringify(value));
  } catch {
    // silently ignore
  }
}

export function loadConsultationDraft(): IntakeDraft | null {
  try {
    const raw = localStorage.getItem(CONSULTATION_DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as IntakeDraft;
    return migrateConsultationDraft(draft);
  } catch {
    return null;
  }
}

export function saveSimpleIntake(value: SimpleIntakeState): void {
  try {
    localStorage.setItem(SIMPLE_INPUT_KEY, JSON.stringify(value));
  } catch {
    // silently ignore
  }
}

export function loadSimpleIntake(): SimpleIntakeState | null {
  try {
    const raw = localStorage.getItem(SIMPLE_INPUT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SimpleIntakeState;
  } catch {
    return null;
  }
}

export function saveInputMode(mode: 'consultation' | 'simple' | 'detail'): void {
  try {
    localStorage.setItem(INPUT_MODE_KEY, mode);
  } catch {
    // silently ignore
  }
}

export function loadInputMode(): 'consultation' | 'simple' | 'detail' {
  try {
    const raw = localStorage.getItem(INPUT_MODE_KEY);
    return raw === 'detail' || raw === 'simple' ? raw : 'consultation';
  } catch {
    return 'consultation';
  }
}

export function clearConsultationState(): void {
  try {
    localStorage.removeItem(CONSULTATION_TEXT_KEY);
    localStorage.removeItem(CONSULTATION_DRAFT_KEY);
    localStorage.removeItem(SIMPLE_INPUT_KEY);
    localStorage.removeItem(INPUT_MODE_KEY);
    localStorage.removeItem(SELECTED_SKILLS_KEY);
    localStorage.removeItem(RECOMMENDATION_DECISIONS_KEY);
  } catch {
    // silently ignore
  }
}

export function saveRecommendationDecisions(value: RecommendationDecisions): void {
  try {
    localStorage.setItem(RECOMMENDATION_DECISIONS_KEY, JSON.stringify(value));
  } catch {
    // silently ignore
  }
}

export function loadRecommendationDecisions(): RecommendationDecisions {
  try {
    const raw = localStorage.getItem(RECOMMENDATION_DECISIONS_KEY);
    if (!raw) return normalizeRecommendationDecisions(null);
    return normalizeRecommendationDecisions(JSON.parse(raw) as Partial<RecommendationDecisions>);
  } catch {
    return normalizeRecommendationDecisions(null);
  }
}

export function saveSelectedSkills(skillIds: string[]): void {
  try {
    localStorage.setItem(SELECTED_SKILLS_KEY, JSON.stringify(skillIds));
  } catch {
    // silently ignore
  }
}

export function loadSelectedSkills(): string[] {
  try {
    const raw = localStorage.getItem(SELECTED_SKILLS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export function saveConsultationPromptVariant(variant: ConsultationPromptVariant): void {
  try {
    localStorage.setItem(CONSULTATION_PROMPT_VARIANT_KEY, variant);
  } catch {
    // silently ignore
  }
}

export function loadConsultationPromptVariant(): ConsultationPromptVariant {
  try {
    const raw = localStorage.getItem(CONSULTATION_PROMPT_VARIANT_KEY);
    return raw === 'new_business' || raw === 'internal_tool' || raw === 'client_project' || raw === 'personal_project'
      ? raw
      : 'personal_project';
  } catch {
    return 'personal_project';
  }
}

export function saveUiTestMode(enabled: boolean): void {
  try {
    localStorage.setItem(UI_TEST_MODE_KEY, JSON.stringify(enabled));
  } catch {
    // silently ignore
  }
}

export function loadUiTestMode(): boolean {
  try {
    const raw = localStorage.getItem(UI_TEST_MODE_KEY);
    return raw === 'true';
  } catch {
    return false;
  }
}

function migrateDraft(state: FormState): FormState {
  const legacyAiTool = (state.tech as { ai_tool?: LegacyAiTool }).ai_tool;
  return {
    ...state,
    tech: {
      ...state.tech,
      ai_tools: normalizeAiTools(state.tech.ai_tools ?? [], legacyAiTool),
      ai_tool_detail: state.tech.ai_tool_detail ?? '',
    },
    planning: {
      tech_decisions: state.planning?.tech_decisions ?? [],
      external_dependencies: state.planning?.external_dependencies ?? [],
    },
  };
}

function migrateConsultationDraft(draft: IntakeDraft): IntakeDraft {
  return {
    ...draft,
    source: draft.source === 'provider_consultation' ? 'provider_consultation' : 'pasted_consultation',
    provider: normalizeIntakeProviderMetadata((draft as Partial<IntakeDraft>).provider),
    suggestedState: migrateDraft(draft.suggestedState),
  };
}
