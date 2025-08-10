import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import { createI18n } from 'vue-i18n';
import { ref } from 'vue';
import { messages as enMessages } from '../src/i18n/en-US/index.ts';
import CreatorSubscribersPage from '../src/pages/CreatorSubscribersPage.vue';
import { useCreatorSubscribersStore } from '../src/stores/creatorSubscribers';

vi.mock('chart.js', () => {
  const Chart = vi.fn((_: any, cfg: any) => ({
    data: JSON.parse(JSON.stringify(cfg.data)),
    update: vi.fn(),
  }));
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

const clipboardWrite = vi.fn();
vi.mock('quasar', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    copyToClipboard: vi.fn(),
    useQuasar: () => ({ clipboard: { writeText: clipboardWrite }, notify: vi.fn() }),
  };
});

const routerPush = vi.fn();
vi.mock('vue-router', () => ({ useRouter: () => ({ push: routerPush }) }));
vi.mock('src/utils/subscriberCsv', () => ({ default: vi.fn() }));
vi.mock('src/stores/nostr', () => ({
  useNostrStore: () => ({ getProfile: vi.fn().mockResolvedValue(null) }),
}));

const { copyToClipboard } = await import('quasar');

const stubs = {
  'q-page': { template: '<div><slot /></div>' },
  'q-input': {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  'q-btn': {
    props: ['label', 'ariaLabel'],
    template:
      '<button :data-label="label" :aria-label="ariaLabel" @click="$emit(\'click\')"><slot /></button>',
  },
  SubscriberFiltersPopover: { template: '<div></div>' },
  SubscriberDrawer: {
    props: ['modelValue', 'sub', 'profile'],
    emits: ['update:modelValue', 'dm', 'openProfile', 'cancel'],
    template:
      '<div class="drawer" v-show="modelValue">\n' +
      '  <button class="dm-btn" @click="$emit(\'dm\')"></button>\n' +
      '  <button class="copy-npub-btn" @click="copy(sub.subscriberNpub || sub.npub)"></button>\n' +
      '  <button class="copy-ln-btn" v-if="profile?.lud16" @click="copy(profile.lud16)"></button>\n' +
      '</div>',
    methods: {
      copy(text: string) {
        if (text) copyToClipboard(text);
      },
    },
  },
};

function mountPage() {
  const i18n = createI18n({ locale: 'en-US', messages: { 'en-US': enMessages } });
  const pinia = createTestingPinia({ createSpy: vi.fn });
  const wrapper = mount(CreatorSubscribersPage, {
    global: { plugins: [pinia, i18n], stubs },
  });
  const store = useCreatorSubscribersStore(pinia);
  store.subscribers = [
    {
      id: '1',
      name: 'Alice',
      npub: 'npubA',
      nip05: '',
      tierId: 't1',
      tierName: 'Tier1',
      amountSat: 1000,
      frequency: 'monthly',
      intervalDays: 30,
      status: 'active',
      startDate: 0,
      nextRenewal: 0,
      lifetimeSat: 0,
      receivedPeriods: 0,
      progress: 0,
      dueSoon: false,
    },
  ] as any;
  return { wrapper, store };
}

describe('CreatorSubscribersPage drawer', () => {
  it('opens drawer, navigates to DM and copies addresses', async () => {
    const { wrapper, store } = mountPage();
    store.profileCache['npubA'] = { name: '', nip05: '', lud16: 'ln@addr' } as any;
    wrapper.vm.openDrawer(store.subscribers[0] as any);
    await wrapper.vm.$nextTick();
    routerPush.mockReset();
    await wrapper.find('.dm-btn').trigger('click');
    expect(routerPush).toHaveBeenCalledWith({
      path: '/nostr-messenger',
      query: { pubkey: 'npubA' },
    });
    (copyToClipboard as unknown as vi.Mock).mockClear();
    await wrapper.find('.copy-npub-btn').trigger('click');
    expect(copyToClipboard).toHaveBeenCalledWith('npubA');
    (copyToClipboard as unknown as vi.Mock).mockClear();
    await wrapper.find('.copy-ln-btn').trigger('click');
    expect(copyToClipboard).toHaveBeenCalledWith('ln@addr');
  });
});

