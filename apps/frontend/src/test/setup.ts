import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock localStorage with a functional in-memory implementation so hooks that
// read/write real values (useLocalStorage, usePermission) work as expected.
const localStorageStore = new Map<string, string>()
const localStorageMock = {
  getItem: vi.fn((key: string) => (localStorageStore.has(key) ? localStorageStore.get(key)! : null)),
  setItem: vi.fn((key: string, value: string) => { localStorageStore.set(key, String(value)) }),
  removeItem: vi.fn((key: string) => { localStorageStore.delete(key) }),
  clear: vi.fn(() => { localStorageStore.clear() }),
  key: vi.fn((index: number) => Array.from(localStorageStore.keys())[index] ?? null),
  get length() { return localStorageStore.size },
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  configurable: true,
  writable: true,
})

// Mock navigator.clipboard. Must be configurable/writable so libraries such as
// @testing-library/user-event can redefine it during tests.
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
    readText: vi.fn(),
  },
  configurable: true,
  writable: true,
})