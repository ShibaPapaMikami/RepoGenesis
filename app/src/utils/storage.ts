import type { FormState } from '../state/actions';
import type { IntakeDraft } from './intakeParser';
import type { SimpleIntakeState } from './simpleIntake.ts';
import { normalizeAiTools, type LegacyAiTool } from './aiTools.ts';

const STORAGE_KEY = 'draft_project_brief';
const CONSULTATION_TEXT_KEY = 'consultation_input_text';
const CONSULTATION_DRAFT_KEY = 'consultation_input_draft';
const SIMPLE_INPUT_KEY = 'simple_input_state';
const INPUT_MODE_KEY = 'consultation_input_mode';
const SELECTED_SKILLS_KEY = 'selected_skill_ids';

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
    return {
      ...draft,
      suggestedState: migrateDraft(draft.suggestedState),
    };
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
  } catch {
    // silently ignore
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

function migrateDraft(state: FormState): FormState {
  const legacyAiTool = (state.tech as { ai_tool?: LegacyAiTool }).ai_tool;
  return {
    ...state,
    tech: {
      ...state.tech,
      ai_tools: normalizeAiTools(state.tech.ai_tools ?? [], legacyAiTool),
      ai_tool_detail: state.tech.ai_tool_detail ?? '',
    },
  };
}
