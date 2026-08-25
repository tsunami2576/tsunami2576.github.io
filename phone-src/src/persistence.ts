import type { Orientation } from './phone-machine';

export type PersistedPhoneState = {
  orientation: Orientation;
  gardenGrowth: number;
  storyIndex: number;
  volume: number;
};

const STORAGE_KEY = 'lumi-phone.v1';

const ORIENTATIONS: Orientation[] = ['portrait', 'landscape'];

function clampNumber(value: unknown, min: number, max: number, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}

export function loadPersistedState(storage: Storage | null | undefined): Partial<PersistedPhoneState> {
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Record<keyof PersistedPhoneState, unknown>>;
    const state: Partial<PersistedPhoneState> = {};
    if (ORIENTATIONS.includes(parsed.orientation as Orientation)) {
      state.orientation = parsed.orientation as Orientation;
    }
    if (typeof parsed.gardenGrowth === 'number' && Number.isFinite(parsed.gardenGrowth)) {
      state.gardenGrowth = clampNumber(parsed.gardenGrowth, 0, 100, 38);
    }
    if (typeof parsed.storyIndex === 'number' && Number.isFinite(parsed.storyIndex)) {
      state.storyIndex = Math.floor(clampNumber(parsed.storyIndex, 0, 99, 0));
    }
    if (typeof parsed.volume === 'number' && Number.isFinite(parsed.volume)) {
      state.volume = clampNumber(parsed.volume, 0, 100, 60);
    }
    return state;
  } catch {
    return {};
  }
}

export function savePersistedState(storage: Storage | null | undefined, state: PersistedPhoneState): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 隐私模式或存储被禁用时静默放弃持久化。
  }
}
