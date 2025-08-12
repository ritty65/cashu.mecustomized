import 'fake-indexeddb/auto';

vi.mock('quasar', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    QIcon: actual.QIcon || { name: 'QIcon', template: '<i />' },
    Notify: { create: vi.fn() },
  };
});

import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, vi } from 'vitest';

// Mock stores
vi.mock('src/stores/wallet', () => ({
  useWalletStore: vi.fn(() => ({
    seed: 'a'.repeat(64), // mock seed
    proofs: [],
  })),
}));

vi.mock('src/stores/p2pk', () => ({
  useP2PKStore: vi.fn(() => ({
    sendToLock: vi.fn().mockResolvedValue({}),
    getSecretP2PKPubkey: vi.fn().mockReturnValue(''),
    isLockedToUs: vi.fn().mockReturnValue(false),
    getTokenPubkey: vi.fn().mockReturnValue(null),
  })),
}));

vi.mock('src/stores/nostr', () => ({
  useNostrStore: vi.fn(() => ({
    connected: true,
    lastError: null,
    resolvePubkey: (s) => s,
    getProfile: vi.fn().mockResolvedValue(null),
  })),
}));


beforeEach(() => {
  const pinia = createPinia();
  setActivePinia(pinia);
});

import { beforeAll } from 'vitest';
import { Quasar, Dialog } from 'quasar';
import { createI18n } from 'vue-i18n';
import { config } from '@vue/test-utils';

// Mock the global mixin
window.windowMixin = {
  methods: {
    formatCurrency: (v) => `${v} sat`,
  }
};

config.global.plugins = [
  [Quasar, { plugins: { Dialog } }],
  createI18n({
    legacy: false,
    locale: 'en',
    messages: { en: { BucketManager: { helper: { intro: '' }, actions: { edit: '' } } } },
  }),
];
config.global.stubs = { 'router-link': { template: '<a><slot/></a>' }, InfoTooltip: true };
config.global.directives = {
  'focus-trap': {},
};
