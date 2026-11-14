import { vi } from 'vitest';

export interface DeterministicStorage extends Storage {
  getStoreSnapshot: () => Record<string, string>;
  seedStore: (entries: Record<string, string>) => void;
}

export function createLocalStorageMock(
  initialEntries: Record<string, string> = {}
): DeterministicStorage {
  let store: Record<string, string> = { ...initialEntries };

  const storage: DeterministicStorage = {
    get length(): number {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number): string | null => {
      const keys = Object.keys(store);
      return keys[index] ?? null;
    }),
    getItem: vi.fn((key: string): string | null => {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    }),
    setItem: vi.fn((key: string, value: string): void => {
      store[String(key)] = String(value);
    }),
    removeItem: vi.fn((key: string): void => {
      delete store[String(key)];
    }),
    clear: vi.fn((): void => {
      store = {};
    }),
    getStoreSnapshot: () => ({ ...store }),
    seedStore: (entries: Record<string, string>) => {
      store = { ...store, ...entries };
    },
  };

  return storage;
}

export const localStorageMock = createLocalStorageMock();
export const sessionStorageMock = createLocalStorageMock();

export function resetStorageMocks(): void {
  localStorageMock.clear();
  sessionStorageMock.clear();
  vi.mocked(localStorageMock.getItem).mockClear();
  vi.mocked(localStorageMock.setItem).mockClear();
  vi.mocked(localStorageMock.removeItem).mockClear();
  vi.mocked(localStorageMock.clear).mockClear();
  vi.mocked(localStorageMock.key).mockClear();
  vi.mocked(sessionStorageMock.getItem).mockClear();
  vi.mocked(sessionStorageMock.setItem).mockClear();
  vi.mocked(sessionStorageMock.removeItem).mockClear();
  vi.mocked(sessionStorageMock.clear).mockClear();
  vi.mocked(sessionStorageMock.key).mockClear();
}
