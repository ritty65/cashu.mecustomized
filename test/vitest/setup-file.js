import { config } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { Quasar, Dialog, Notify } from 'quasar'
import { vi } from 'vitest'
import 'fake-indexeddb/auto'
import { createI18n } from 'vue-i18n'
import { createRouter, createWebHistory } from 'vue-router'

// Set up Pinia for all tests
setActivePinia(createPinia())

// Mock Quasar
config.global.plugins.push([Quasar, {
  plugins: { Dialog, Notify },
}])

// Mock i18n
const i18n = createI18n({
  legacy: false,
  locale: 'en-US',
  messages: {
    'en-US': { wallet: { mint: { notifications: {} } } } // Add minimal messages to prevent warnings
  }
})
config.global.plugins.push(i18n)

// Mock Vue Router
const router = createRouter({
  history: createWebHistory(),
  routes: [],
})
config.global.plugins.push(router)

// Mock misc globals
config.global.mocks = {
  ...config.global.mocks,
  t: (key) => key, // simple t mock
}

// Mock window.matchMedia, required by Quasar
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
const ResizeObserverMock = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
