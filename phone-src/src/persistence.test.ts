import { describe, expect, it } from 'vitest';
import { loadPersistedState, savePersistedState } from './persistence';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (key) => map.get(key) ?? null,
    key: (index) => Array.from(map.keys())[index] ?? null,
    removeItem: (key) => { map.delete(key); },
    setItem: (key, value) => { map.set(key, value); },
  };
}

describe('persistence', () => {
  it('round-trips persisted state through storage', () => {
    const storage = memoryStorage();
    savePersistedState(storage, { orientation: 'landscape', gardenGrowth: 62, storyIndex: 2, volume: 30 });
    expect(loadPersistedState(storage)).toEqual({ orientation: 'landscape', gardenGrowth: 62, storyIndex: 2, volume: 30 });
  });

  it('returns nothing without storage or saved data', () => {
    expect(loadPersistedState(null)).toEqual({});
    expect(loadPersistedState(memoryStorage())).toEqual({});
  });

  it('drops corrupt payloads and clamps out-of-range numbers', () => {
    const storage = memoryStorage();
    storage.setItem('lumi-phone.v1', '{not json');
    expect(loadPersistedState(storage)).toEqual({});

    storage.setItem('lumi-phone.v1', JSON.stringify({
      orientation: 'diagonal',
      gardenGrowth: 999,
      storyIndex: -4,
      volume: 'loud',
    }));
    expect(loadPersistedState(storage)).toEqual({ gardenGrowth: 100, storyIndex: 0 });
  });

  it('survives a failing storage backend', () => {
    const broken = {
      ...memoryStorage(),
      setItem: () => { throw new Error('quota exceeded'); },
    } as Storage;
    expect(() => savePersistedState(broken, { orientation: 'portrait', gardenGrowth: 38, storyIndex: 0, volume: 60 })).not.toThrow();
  });
});
