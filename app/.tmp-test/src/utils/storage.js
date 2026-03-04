const STORAGE_KEY = 'draft_project_brief';
export function saveDraft(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    catch {
        // localStorage full or unavailable — silently ignore
    }
}
export function loadDraft() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch {
        return null;
    }
}
export function clearDraft() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    }
    catch {
        // silently ignore
    }
}
