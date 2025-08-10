import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

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

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useDebounceFn: (fn: any) => fn };
});
vi.mock('quasar', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    copyToClipboard: vi.fn(),
    useQuasar: () => ({ clipboard: { writeText: vi.fn() }, notify: vi.fn() }),
  };
});
vi.mock('src/utils/subscriberCsv', () => ({ default: vi.fn() }));

const profiles: Record<string, any> = {
  npub1alice: { name: 'Alice', nip05: 'alice@example.com' },
  npub1bob: { name: 'Bob', nip05: 'bob@example.com' },
  npub1carol: { name: 'Carol', nip05: 'carol@example.com' },
  npub1dave: { name: 'Dave', nip05: 'dave@example.com' },
  npub1eve: { name: 'Eve', nip05: 'eve@example.com' },
  npub1frank: { name: 'Frank', nip05: 'frank@example.com' },
};

vi.mock('src/stores/nostr', () => ({
  useNostrStore: () => ({
    getProfile: vi.fn(async (npub: string) => profiles[npub] || null),
  }),
}));

import downloadCsv from 'src/utils/subscriberCsv';
import CreatorSubscribersPage from '../src/pages/CreatorSubscribersPage.vue';
import { useCreatorSubscribersStore } from '../src/stores/creatorSubscribers';
import { cashuDb } from '../src/stores/dexie';
import { watch } from 'vue';

const stubs = {
  'q-page': { template: '<div><slot /></div>' },
  'q-input': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  'q-btn': {
    props: ['label'],
    template: '<button :data-label="label" @click="$emit(\'click\')"><slot /></button>',
  },
  'q-menu': { template: '<div><slot /></div>' },
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
  'q-avatar': { template: '<span class="q-avatar"><slot /></span>' },
  'q-td': { template: '<td><slot /></td>' },
  'q-drawer': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<div class="drawer" v-show="modelValue"><slot /></div>',
  },
  'q-space': { template: '<span class="q-space"></span>' },
};

const lockedTokens = [
  // Alice - active weekly, lifetime 5000
  ...Array.from({ length: 5 }).map((_, i) => ({
    id: `a${i}`,
    tokenString: 't',
    amount: 1000,
    owner: 'creator',
    subscriberNpub: 'npub1alice',
    tierId: 't1',
    tierName: 'Bronze',
    unlockTs: 1700000000,
    status: i === 4 ? 'unlockable' : 'claimed',
    subscriptionId: '1',
    frequency: 'weekly',
    intervalDays: 7,
  })),
  // Bob - pending weekly
  {
    id: 'b1',
    tokenString: 't',
    amount: 1000,
    owner: 'creator',
    subscriberNpub: 'npub1bob',
    tierId: 't1',
    tierName: 'Bronze',
    unlockTs: 1700001000,
    status: 'pending',
    subscriptionId: '2',
    frequency: 'weekly',
    intervalDays: 7,
  },
  // Carol - active biweekly, lifetime 4000
  ...Array.from({ length: 2 }).map((_, i) => ({
    id: `c${i}`,
    tokenString: 't',
    amount: 2000,
    owner: 'creator',
    subscriberNpub: 'npub1carol',
    tierId: 't2',
    tierName: 'Silver',
    unlockTs: 1700002000,
    status: i === 1 ? 'unlockable' : 'claimed',
    subscriptionId: '3',
    frequency: 'biweekly',
    intervalDays: 14,
  })),
  // Dave - ended biweekly
  {
    id: 'd1',
    tokenString: 't',
    amount: 2000,
    owner: 'creator',
    subscriberNpub: 'npub1dave',
    tierId: 't2',
    tierName: 'Silver',
    unlockTs: 1690000000,
    status: 'claimed',
    subscriptionId: '4',
    frequency: 'biweekly',
    intervalDays: 14,
  },
  // Eve - active monthly, lifetime 10000
  ...Array.from({ length: 2 }).map((_, i) => ({
    id: `e${i}`,
    tokenString: 't',
    amount: 5000,
    owner: 'creator',
    subscriberNpub: 'npub1eve',
    tierId: 't3',
    tierName: 'Gold',
    unlockTs: 1700003000,
    status: i === 1 ? 'unlockable' : 'claimed',
    subscriptionId: '5',
    frequency: 'monthly',
    intervalDays: 30,
  })),
  // Frank - pending monthly
  {
    id: 'f1',
    tokenString: 't',
    amount: 5000,
    owner: 'creator',
    subscriberNpub: 'npub1frank',
    tierId: 't3',
    tierName: 'Gold',
    unlockTs: 1700004000,
    status: 'pending',
    subscriptionId: '6',
    frequency: 'monthly',
    intervalDays: 30,
  },
];

beforeEach(async () => {
  await cashuDb.lockedTokens.clear();
  await cashuDb.lockedTokens.bulkAdd(lockedTokens as any);
});

async function mountPage() {
  const wrapper = mount(CreatorSubscribersPage, {
    global: {
      plugins: [createTestingPinia({ createSpy: vi.fn, stubActions: false })],
      stubs,
    },
  });
  const store = useCreatorSubscribersStore(wrapper.vm.$pinia);
  await new Promise((resolve) => {
    const stop = watch(
      () => store.subscribers.length,
      (n) => {
        if (n > 0) {
          stop();
          resolve(null);
        }
      }
    );
  });
  return wrapper;
}

describe('CreatorSubscribersPage', () => {
  it('shows correct tab counts', async () => {
    const wrapper = await mountPage();
    const badges = wrapper.findAll('.q-badge');
    expect(badges.map((b) => b.text())).toEqual(['6', '2', '2', '2', '2', '1']);
  });

  it('filters by search, status and tier', async () => {
    const wrapper = await mountPage();
    const store = useCreatorSubscribersStore(wrapper.vm.$pinia);
    const rows = () => wrapper.findAll('.tbody-row').map((r) => r.text());

    wrapper.vm.search = 'bob';
    await wrapper.vm.$nextTick();
    expect(rows()).toEqual(['Bob']);

    wrapper.vm.search = '';
    await wrapper.vm.$nextTick();

    store.applyFilters({ statuses: new Set(['pending']), tiers: new Set(), sort: 'next' });
    await wrapper.vm.$nextTick();
    expect(rows()).toEqual(['Bob', 'Frank']);

    store.applyFilters({ statuses: new Set(['pending']), tiers: new Set(['t3']), sort: 'next' });
    await wrapper.vm.$nextTick();
    expect(rows()).toEqual(['Frank']);
  });

  it('sorts subscribers', async () => {
    const wrapper = await mountPage();
    const store = useCreatorSubscribersStore(wrapper.vm.$pinia);
    const rows = () => wrapper.findAll('.tbody-row').map((r) => r.text());

    store.sort = 'first';
    await wrapper.vm.$nextTick();
    expect(rows()[0]).toBe('Dave');

    store.sort = 'amount';
    await wrapper.vm.$nextTick();
    expect(rows()[0]).toBe('Eve');
  });

  it('computes progress and dueSoon correctly', async () => {
    vi.useFakeTimers();
    const wrapper = await mountPage();
    const store = useCreatorSubscribersStore(wrapper.vm.$pinia);
    const alice = store.subscribers[0];
    const start = alice.nextRenewal! * 1000 - 7 * 86400000;

    vi.setSystemTime(start + 3.5 * 86400000);
    expect(wrapper.vm.progressPercent(alice)).toBe(50);

    vi.setSystemTime(alice.nextRenewal! * 1000 - 2 * 86400000);
    expect(wrapper.vm.dueSoon(alice)).toBe(true);

    vi.setSystemTime(alice.nextRenewal! * 1000 - 5 * 86400000);
    expect(wrapper.vm.dueSoon(alice)).toBe(false);
    vi.useRealTimers();
  });

  it('exports all or selected rows to CSV', async () => {
    const wrapper = await mountPage();
    const store = useCreatorSubscribersStore();
    (downloadCsv as unknown as vi.Mock).mockClear();

    await wrapper.find('button[data-label="Export CSV"]').trigger('click');
    expect(downloadCsv).toHaveBeenCalledWith();

    (downloadCsv as unknown as vi.Mock).mockClear();
    wrapper.vm.selected = [store.subscribers[0]];
    await wrapper.vm.$nextTick();
    await wrapper.find('button[data-label="Export selection"]').trigger('click');
    expect(downloadCsv).toHaveBeenCalledWith([store.subscribers[0]]);
  });

  it('updates KPI numbers when searching, switching tabs and applying filters', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1700000000000));
    const wrapper = await mountPage();
    await wrapper.vm.$nextTick();
    const store = useCreatorSubscribersStore(wrapper.vm.$pinia);

    const values = () => [
      String(wrapper.vm.counts.all),
      `${wrapper.vm.activeCount} / ${wrapper.vm.pendingCount}`,
      `${wrapper.vm.lifetimeRevenue} sat`,
      `${wrapper.vm.formattedKpiThisPeriodSat} sat`,
    ];

    expect(values()).toEqual(['6', '3 / 2', '27000 sat', '3,000 sat']);

    wrapper.vm.search = 'bob';
    await wrapper.vm.$nextTick();
    expect(values()).toEqual(['1', '0 / 1', '1000 sat', '0 sat']);

    wrapper.vm.search = '';
    await wrapper.vm.$nextTick();

    store.setActiveTab('weekly');
    await wrapper.vm.$nextTick();
    expect(values()).toEqual(['6', '1 / 1', '6000 sat', '1,000 sat']);

    store.setActiveTab('all');
    await wrapper.vm.$nextTick();
    store.applyFilters({ statuses: new Set(['pending']), tiers: new Set(['t3']), sort: 'next' });
    await wrapper.vm.$nextTick();
    expect(values()).toEqual(['1', '0 / 1', '5000 sat', '0 sat']);

    vi.useRealTimers();
  });

  it('updates charts without re-instantiating on filter and period changes', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1700000000000));
    const wrapper = await mountPage();
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();

    const initialCalls = charts.length;

    wrapper.vm.search = 'bob';
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick();
    expect(wrapper.vm.filtered.map((s: any) => s.name)).toEqual(['Bob']);
    expect(charts.length).toBe(initialCalls);

    wrapper.vm.search = '';
    await wrapper.vm.$nextTick();
    wrapper.vm.togglePeriod();
    await wrapper.vm.$nextTick();

    expect(charts.length).toBe(initialCalls);
    vi.useRealTimers();
  });
});

