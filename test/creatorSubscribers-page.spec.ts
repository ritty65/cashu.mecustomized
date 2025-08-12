import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { ref } from 'vue';
import { createI18n } from 'vue-i18n';
import { messages as enMessages } from '../src/i18n/en-US/index.ts';
import { useCreatorSubscribersStore } from '../src/stores/creatorSubscribers';
import { useSubscribersStore } from '../src/stores/subscribersStore';

var Chart: any;
const charts: { type: string; inst: any }[] = [];
vi.mock('chart.js', () => {
  Chart = vi.fn((_: any, cfg: any) => {
    const inst = { data: JSON.parse(JSON.stringify(cfg.data)), update: vi.fn() };
    charts.push({ type: cfg.type, inst });
    return inst;
  });
  Chart.register = vi.fn();
  return {
    Chart,
    LineController: vi.fn(),
    DoughnutController: vi.fn(),
    BarController: vi.fn(),
    LineElement: vi.fn(),
    ArcElement: vi.fn(),
    BarElement: vi.fn(),
    PointElement: vi.fn(),
    CategoryScale: vi.fn(),
    LinearScale: vi.fn(),
    Legend: vi.fn(),
    Tooltip: vi.fn(),
  };
});

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
const routerPush = vi.fn();
vi.mock('vue-router', () => ({ useRouter: () => ({ push: routerPush }) }));
vi.mock('src/utils/subscriberCsv', () => ({ default: vi.fn() }));
vi.mock('src/stores/nostr', () => ({
  useNostrStore: () => ({
    initNdkReadOnly: vi.fn().mockResolvedValue(undefined),
    resolvePubkey: (s: string) => s,
    connected: true,
    lastError: null,
  }),
}));
vi.mock('src/composables/useNdk', () => {
  const fetchEvents = vi.fn().mockResolvedValue(new Set());
  return { useNdk: vi.fn().mockResolvedValue({ fetchEvents }) };
});

import { copyNpub } from 'src/utils/clipboard';
import downloadCsv from 'src/utils/subscriberCsv';
import CreatorSubscribersPage from '../src/pages/CreatorSubscribersPage.vue';

const stubs = {
  'q-layout': { template: '<div><slot /></div>' },
  'q-header': { template: '<div><slot /></div>' },
  'q-toolbar': { template: '<div><slot /></div>' },
  'q-toolbar-title': { template: '<div><slot /></div>' },
  'q-btn-group': { template: '<div><slot /></div>' },
  'q-btn-toggle': { template: '<div></div>' },
  'q-page-container': { template: '<div><slot /></div>' },
  'q-page': { template: '<div><slot /></div>' },
  'q-footer': { template: '<div><slot /></div>' },
  'q-input': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  'q-btn': {
    props: ['label', 'ariaLabel'],
    template:
      '<button :data-label="label" :aria-label="ariaLabel" @click="$emit(\'click\', $event)"><slot /></button>',
  },
  'q-chip': { template: '<div class="q-chip" @click="$emit(\'click\')"><slot /></div>' },
  'q-select': {
    props: ['modelValue', 'options'],
    emits: ['update:model-value'],
    template:
      '<select @change="$emit(\'update:model-value\', $event.target.value)"><option v-for="o in options" :value="o.value">{{o.label}}</option></select>',
  },
  'q-tabs': { template: '<div class="q-tabs"><slot /></div>' },
  'q-tab': { props: ['name'], template: '<div class="q-tab" :data-name="name"><slot /></div>' },
  'q-badge': { template: '<span class="q-badge"><slot /></span>' },
  'q-table': {
    props: ['rows'],
    template:
      '<div class="q-table"><div v-for="r in rows" :key="r.id" class="tbody-row">{{ r.name }}</div></div>',
  },
  'q-pagination': { template: '<div></div>' },
  'q-avatar': { template: '<span class="q-avatar"><slot /></span>' },
  'q-td': { template: '<td><slot /></td>' },
  'q-drawer': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="drawer" v-show="modelValue"><slot /></div>',
  },
  'q-space': { template: '<span class="q-space"></span>' },
  'q-banner': { template: '<div><slot /><slot name="action" /></div>' },
  SubscriberFilters: { template: '<div></div>' },
  SubscriptionsCharts: { template: '<div></div>' },
};

const mockSubscribers = [
    { id: '1', name: 'Alice', npub: 'npub1alice', nip05: 'alice@domain.com', tierId: 't1', tierName: 'Bronze', status: 'active', frequency: 'weekly', amountSat: 1000, nextRenewal: 1700000000, lifetimeSat: 5000, startDate: 1690000000, intervalDays: 7 },
    { id: '2', name: 'Bob', npub: 'npub1bob', nip05: 'bob@domain.com', tierId: 't2', tierName: 'Silver', status: 'pending', frequency: 'monthly', amountSat: 5000, nextRenewal: 1702000000, lifetimeSat: 5000, startDate: 1692000000, intervalDays: 30 },
    { id: '3', name: 'Carol', npub: 'npub1carol', nip05: 'carol@domain.com', tierId: 't3', tierName: 'Gold', status: 'active', frequency: 'weekly', amountSat: 10000, nextRenewal: 1700100000, lifetimeSat: 20000, startDate: 1690100000, intervalDays: 7 },
    { id: '4', name: 'Dave', npub: 'npub1dave', nip05: 'dave@domain.com', tierId: 't1', tierName: 'Bronze', status: 'ended', frequency: 'monthly', amountSat: 1000, lifetimeSat: 1000, startDate: 1680000000, intervalDays: 30 },
    { id: '5', name: 'Eve', npub: 'npub1eve', nip05: 'eve@domain.com', tierId: 't2', tierName: 'Silver', status: 'active', frequency: 'biweekly', amountSat: 2000, nextRenewal: 1701000000, lifetimeSat: 10000, startDate: 1691000000, intervalDays: 14 },
    { id: '6', name: 'Frank', npub: 'npub1frank', nip05: 'frank@domain.com', tierId: 't3', tierName: 'Gold', status: 'pending', frequency: 'biweekly', amountSat: 20000, nextRenewal: 1703000000, lifetimeSat: 20000, startDate: 1693000000, intervalDays: 14 },
];

function mountPage() {
  const i18n = createI18n({ legacy: false, locale: 'en-US', messages: { 'en-US': enMessages } });
  const wrapper = mount(CreatorSubscribersPage, {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn, stubActions: false }), i18n],
      stubs,
    },
  });
  const store = useCreatorSubscribersStore(wrapper.vm.$pinia);
  store.subscribers = mockSubscribers;
  return wrapper;
}

describe('CreatorSubscribersPage', () => {
  beforeEach(() => {
    const pinia = createTestingPinia({ createSpy: vi.fn, stubActions: false });
    const creatorSubscribersStore = useCreatorSubscribersStore(pinia);
    const subscribersStore = useSubscribersStore(pinia);
    creatorSubscribersStore.$reset();
    subscribersStore.$reset();
    vi.clearAllMocks();
  });

  it('shows correct tab counts', async () => {
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    const badges = wrapper.findAll('.q-badge');
    // Counts: All: 6, Weekly: 2, Bi-weekly: 2, Monthly: 2, Pending: 2, Ended: 1
    expect(badges.map((b) => b.text())).toEqual(['6', '2', '2', '2', '2', '1']);
  });

  it('converts npub to bech32', () => {
    const wrapper = mountPage();
    const store = useCreatorSubscribersStore(wrapper.vm.$pinia);
    expect(store.subscribers[0].npub).toMatch(/^npub1/);
  });

  it('filters by search, status and tier', async () => {
    const wrapper = mountPage();
    const viewStore = useSubscribersStore(wrapper.vm.$pinia);
    const rows = () => wrapper.findAll('.tbody-row').map((r) => r.text());

    viewStore.applyFilters({ query: 'bob' });
    await wrapper.vm.$nextTick();
    expect(rows()).toEqual(['Bob']);

    viewStore.clearFilters();
    await wrapper.vm.$nextTick();

    viewStore.applyFilters({ status: new Set(['pending']), tier: new Set(), sort: 'next' });
    await wrapper.vm.$nextTick();
    expect(rows()).toEqual(['Bob', 'Frank']);

    viewStore.applyFilters({ status: new Set(['pending']), tier: new Set(['t3']), sort: 'next' });
    await wrapper.vm.$nextTick();
    expect(rows()).toEqual(['Frank']);
  });

  it('sorts subscribers', async () => {
    const wrapper = mountPage();
    const viewStore = useSubscribersStore(wrapper.vm.$pinia);
    const rows = () => wrapper.findAll('.tbody-row').map((r) => r.text());

    viewStore.applyFilters({ sort: 'first' });
    await wrapper.vm.$nextTick();
    expect(rows()[0]).toBe('Dave');

    viewStore.applyFilters({ sort: 'amount' });
    await wrapper.vm.$nextTick();
    expect(rows()[0]).toBe('Frank'); // Frank and Carol have 20000, Frank is later
  });

  it('computes progress and dueSoon correctly', () => {
    vi.useFakeTimers();
    const now = new Date(1700050000000); // A specific time for consistent testing
    vi.setSystemTime(now);
    const wrapper = mountPage();
    const store = useCreatorSubscribersStore(wrapper.vm.$pinia);
    const alice = store.filtered.find(s => s.id === '1');

    const periodSec = alice.intervalDays * 86400;
    const start = (alice.nextRenewal ?? 0) - periodSec;
    const expectedProgress = Math.min(
      Math.max((now.getTime() / 1000 - start) / periodSec, 0),
      1,
    );
    const expectedDueSoon =
      alice.status === 'active' &&
      typeof alice.nextRenewal === 'number' &&
      alice.nextRenewal - now.getTime() / 1000 < 72 * 3600;

    expect(wrapper.vm.progressPercent(alice)).toBe(Math.round(expectedProgress * 100));
    expect(wrapper.vm.dueSoon(alice)).toBe(expectedDueSoon);
    vi.useRealTimers();
  });

  it('exports all or selected rows to CSV', async () => {
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    const store = useCreatorSubscribersStore(wrapper.vm.$pinia);
    (downloadCsv as unknown as vi.Mock).mockClear();

    await wrapper.find('button[aria-label="Export CSV"]').trigger('click');
    expect(downloadCsv).toHaveBeenCalledWith();

    (downloadCsv as unknown as vi.Mock).mockClear();
    wrapper.vm.selected = [store.subscribers[0]];
    await wrapper.vm.$nextTick();
    await wrapper.find('button[aria-label="Export selected"]').trigger('click');
    expect(downloadCsv).toHaveBeenCalledWith([store.subscribers[0]]);
  });

  it('retries loading when retry button clicked', async () => {
    const wrapper = mountPage();
    const store = useCreatorSubscribersStore(wrapper.vm.$pinia);
    store.error = 'oops';
    await wrapper.vm.$nextTick();
    const loadSpy = vi.spyOn(store, 'loadFromDb');
    const fetchSpy = vi.spyOn(store, 'fetchProfiles');
    await wrapper.find('button[aria-label="Retry"]').trigger('click');
    expect(loadSpy).toHaveBeenCalled();
    expect(fetchSpy).toHaveBeenCalled();
  });

  it('clears selection when clear button clicked', async () => {
    const wrapper = mountPage();
    const store = useCreatorSubscribersStore(wrapper.vm.$pinia);
    wrapper.vm.selected = [store.subscribers[0]];
    await wrapper.vm.$nextTick();
    await wrapper.find('button[aria-label="Clear"]').trigger('click');
    expect(wrapper.vm.selected).toEqual([]);
  });

  it('copies npub when drawer action used', async () => {
    const wrapper = mountPage();
    const npub = 'npub1alice';
    wrapper.vm.openDrawer(mockSubscribers[0]);
    await wrapper.vm.$nextTick();
    ;(copyNpub as any).mockReset();
    await wrapper.find('button[aria-label="Copy npub"]').trigger('click');
    expect(copyNpub).toHaveBeenCalledWith(npub);
  });

  it('updates KPI numbers when searching, switching tabs and applying filters', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1700000000000));
    const wrapper = mountPage();
    await wrapper.vm.$nextTick();
    const store = useCreatorSubscribersStore(wrapper.vm.$pinia);
    const viewStore = useSubscribersStore(wrapper.vm.$pinia);

    const values = () => [
      String(wrapper.vm.counts.all),
      `${wrapper.vm.activeCount} / ${wrapper.vm.pendingCount}`,
      `${wrapper.vm.lifetimeRevenue} sat`,
      `${wrapper.vm.formattedKpiThisPeriodSat} sat`,
    ];

    expect(values()).toEqual(['6', '3 / 2', '61000 sat', '12,000 sat']);

    viewStore.applyFilters({ query: 'bob' });
    await wrapper.vm.$nextTick();
    expect(values()).toEqual(['1', '0 / 1', '5000 sat', '0 sat']);

    viewStore.clearFilters();
    await wrapper.vm.$nextTick();

    store.setActiveTab('weekly');
    await wrapper.vm.$nextTick();
    expect(values()).toEqual(['2', '2 / 0', '25000 sat', '10,000 sat']);

    store.setActiveTab('all');
    await wrapper.vm.$nextTick();
    viewStore.applyFilters({ status: new Set(['pending']), tier: new Set(['t3']), sort: 'next' });
    await wrapper.vm.$nextTick();
    expect(values()).toEqual(['1', '0 / 1', '20000 sat', '0 sat']);

    vi.useRealTimers();
  });
});

