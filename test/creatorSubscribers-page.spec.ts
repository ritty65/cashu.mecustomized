import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';
import { messages as enMessages } from '../src/i18n/en-US/index.ts';
import { useCreatorSubscribersStore } from '../src/stores/creatorSubscribers';
import { useSubscribersStore } from '../src/stores/subscribersStore';
import CreatorSubscribersPage from '../src/pages/CreatorSubscribersPage.vue';
import type { Subscriber } from '../src/types/subscriber';

// Hoist mock declaration
const fetchEventsMock = vi.fn();

// Mocks
vi.mock('@vueuse/core', () => ({
  useDebounceFn: (fn: any) => fn,
  useLocalStorage: (_k: any, v: any) => ref(v),
  onKeyStroke: () => {},
}));
vi.mock('src/utils/clipboard', () => ({ copyNpub: vi.fn() }));
vi.mock('quasar', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useQuasar: () => ({
      notify: vi.fn(),
      screen: { lt: { md: false }, gt: { xs: true } },
    }),
  };
});
vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('src/utils/subscriberCsv', () => ({ default: vi.fn() }));
vi.mock('src/stores/nostr', () => ({
    useNostrStore: () => ({
      initNdkReadOnly: vi.fn().mockResolvedValue(undefined),
      resolvePubkey: (s: string) => s,
      connected: true,
      lastError: null,
    }),
  }));
vi.mock('src/composables/useNdk', () => ({
    useNdk: vi.fn().mockResolvedValue({ fetchEvents: fetchEventsMock }),
}));


const stubs = {
    'q-layout': { template: '<div><slot /></div>' },
    'q-page-container': { template: '<div><slot /></div>' },
    'q-page': { template: '<div><slot /></div>' },
    'q-toolbar': { template: '<div><slot /></div>' },
    'q-input': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
    'q-btn': { props: ['label'], template: '<button :data-label="label"><slot /></button>' },
    'q-badge': { template: '<span class="q-badge"><slot /></span>' },
    'SubscribersTable': { props: ['subscribers'], template: '<div class="subscribers-table"><div v-for="s in subscribers" :key="s.id" class="table-row">{{s.name}}</div></div>' },
    'KpiCard': { props: ['title', 'value'], template: '<div class="kpi-card"><span>{{ title }}</span><span>{{ value }}</span></div>' },
    'q-space': { template: '<span></span>' },
    'q-banner': { template: '<div><slot name="action" /></div>' },
    'q-inner-loading': { template: '<div></div>' },
    'q-linear-progress': { template: '<div></div>' },
};

const mockSubscribers: Subscriber[] = [
    { id: '1', npub: 'npub1alice', name: 'npub1alice', tierName: 'Tier 1', frequency: 'weekly', status: 'active', amountSat: 1000, lifetimeSat: 12000, startDate: 1672531200, nextRenewal: 1704067200, intervalDays: 7, progress: 0.1, dueSoon: true, tierId: 't1', nip05: '' },
    { id: '2', npub: 'npub2bob', name: 'npub2bob', tierName: 'Tier 2', frequency: 'monthly', status: 'pending', amountSat: 5000, lifetimeSat: 5000, startDate: 1675209600, nextRenewal: 1706745600, intervalDays: 30, progress: 0.5, dueSoon: false, tierId: 't2', nip05: '' },
    { id: '3', npub: 'npub3carol', name: 'npub3carol', tierName: 'Tier 1', frequency: 'weekly', status: 'active', amountSat: 1000, lifetimeSat: 1000, startDate: 1701388800, nextRenewal: 1704067200, intervalDays: 7, progress: 0.8, dueSoon: true, tierId: 't1', nip05: '' },
    { id: '4', npub: 'npub4dave', name: 'npub4dave', tierName: 'Tier 3', frequency: 'monthly', status: 'ended', amountSat: 10000, lifetimeSat: 20000, startDate: 1640995200, nextRenewal: 1672531200, intervalDays: 30, progress: 1, dueSoon: false, tierId: 't3', nip05: '' },
    { id: '5', npub: 'npub5eve', name: 'npub5eve', tierName: 'Tier 2', frequency: 'biweekly', status: 'active', amountSat: 2000, lifetimeSat: 24000, startDate: 1656633600, nextRenewal: 1705276800, intervalDays: 14, progress: 0.2, dueSoon: false, tierId: 't2', nip05: '' },
    { id: '6', npub: 'npub6frank', name: 'npub6frank', tierName: 'Tier 3', frequency: 'biweekly', status: 'pending', amountSat: 10000, lifetimeSat: 0, startDate: 1704067200, nextRenewal: 1705276800, intervalDays: 14, progress: 0, dueSoon: false, tierId: 't3', nip05: '' },
];

const mockProfiles = {
    npub1alice: { name: 'Alice', nip05: 'alice@domain.com' },
    npub2bob: { name: 'Bob', nip05: 'bob@domain.com' },
};

async function mountPage() {
  const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': enMessages } });
  const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });

  const store = useCreatorSubscribersStore(pinia);
  store.subscribers = JSON.parse(JSON.stringify(mockSubscribers));

  const wrapper = mount(CreatorSubscribersPage, {
    global: {
      plugins: [pinia, i18n],
      stubs,
    },
  });
  // Wait for async actions triggered on mount
  await new Promise(resolve => setTimeout(resolve, 0));
  return wrapper;
}

describe('CreatorSubscribersPage', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fetchEventsMock.mockImplementation(async (filter) => {
            const events = new Set<any>();
            for (const author of filter.authors) {
                if (mockProfiles[author]) {
                    events.add({ pubkey: author, content: JSON.stringify(mockProfiles[author]) });
                }
            }
            return events;
        });
    });

  it('fetches profiles on mount and displays names', async () => {
    const wrapper = await mountPage();
    expect(fetchEventsMock).toHaveBeenCalledTimes(1);
    const rows = () => wrapper.findAll('.table-row').map((r) => r.text());
    expect(rows()).toContain('Alice');
    expect(rows()).toContain('Bob');
  });

  it('filters by search term', async () => {
    const wrapper = await mountPage();
    const viewStore = useSubscribersStore();

    viewStore.applyFilters({ query: 'Alice' });
    await wrapper.vm.$nextTick();

    const rows = () => wrapper.findAll('.table-row').map((r) => r.text());
    expect(rows().length).toBe(1);
    expect(rows()).toContain('Alice');
  });

  it('shows correct KPI card values', async () => {
    const wrapper = await mountPage();
    const kpis = wrapper.findAll('.kpi-card');
    const kpiText = kpis.map(k => k.findAll('span').map(s => s.text()).join(' ')).join(' | ');
    expect(kpiText).toContain('Total Subscribers 6');
    expect(kpiText).toContain('Active / Pending 3 / 2');
    expect(kpiText).toContain('Lifetime Revenue 62000 sat');
  });
});
