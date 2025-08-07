import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import { createI18n } from 'vue-i18n';

/* ---- windowMixin used by many Vue components ---- */
vi.stubGlobal('windowMixin', { created() {} });

/* ---- Quasar notify helper used in some specs ------ */
vi.mock('@/js/notify', () => ({
  notifyError: vi.fn(),
  notifySuccess: vi.fn(),
}));

/* ---- bare‑bones i18n so walletStore.t() works ----- */
config.global.plugins.push(
  createI18n({ legacy: false, locale: 'en', messages: { en: {} } })
);
