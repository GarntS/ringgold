import { CONFIG_VERSION, type PersistedState } from './models';

const STORAGE_KEY = 'offline-quilt-solver/v1';

function isPersistedState(value: unknown): value is PersistedState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<PersistedState>;
  return state.version === CONFIG_VERSION
    && !!state.configuration
    && typeof state.configuration === 'object'
    && Array.isArray(state.configuration.squareTypes);
}

export function restoreState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPersistedState(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function persistState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage can be unavailable (private mode or quota exhaustion). The app remains usable.
  }
}
