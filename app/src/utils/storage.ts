import type { FormState } from '../state/actions';
import type { IntakeDraft } from './intakeParser';

const STORAGE_KEY = 'draft_project_brief';
const CONSULTATION_TEXT_KEY = 'consultation_input_text';
const CONSULTATION_DRAFT_KEY = 'consultation_input_draft';
const INPUT_MODE_KEY = 'consultation_input_mode';

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
    return JSON.parse(raw) as FormState;
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
    return JSON.parse(raw) as IntakeDraft;
  } catch {
    return null;
  }
}

export function saveInputMode(mode: 'consultation' | 'detail'): void {
  try {
    localStorage.setItem(INPUT_MODE_KEY, mode);
  } catch {
    // silently ignore
  }
}

export function loadInputMode(): 'consultation' | 'detail' {
  try {
    const raw = localStorage.getItem(INPUT_MODE_KEY);
    return raw === 'detail' ? 'detail' : 'consultation';
  } catch {
    return 'consultation';
  }
}

export function clearConsultationState(): void {
  try {
    localStorage.removeItem(CONSULTATION_TEXT_KEY);
    localStorage.removeItem(CONSULTATION_DRAFT_KEY);
    localStorage.removeItem(INPUT_MODE_KEY);
  } catch {
    // silently ignore
  }
}
