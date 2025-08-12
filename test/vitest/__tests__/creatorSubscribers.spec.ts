import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { useCreatorSubscribersStore } from '../../../src/stores/creatorSubscribers';
import { useSubscribersStore } from '../../../src/stores/subscribersStore';
import type { Subscriber } from '../../../src/types/subscriber';

// Declare mock function before it's used in vi.mock
const fetchEventsMock = vi.fn();

// Mock data
const mockSubscribers: Subscriber[] = [
  { id: '1', npub: 'npub1', name: 'npub1', tierName: 'Tier 1', frequency: 'weekly', status: 'active', amountSat: 100, lifetimeSat: 200, startDate: 1000, nextRenewal: 2000, intervalDays: 7, progress: 0.5, dueSoon: false, tierId: 't1', nip05: '' },
  { id: '2', npub: 'npub2', name: 'npub2', tierName: 'Tier 1', frequency: 'weekly', status: 'active', amountSat: 100, lifetimeSat: 100, startDate: 2000, nextRenewal: 3000, intervalDays: 7, progress: 0.5, dueSoon: false, tierId: 't1', nip05: '' },
  { id: '3', npub: 'npub3', name: 'npub3', tierName: 'Tier 2', frequency: 'biweekly', status: 'active', amountSat: 300, lifetimeSat: 300, startDate: 3000, nextRenewal: 4000, intervalDays: 14, progress: 0.5, dueSoon: false, tierId: 't2', nip05: '' },
  { id: '4', npub: 'npub4', name: 'npub4', tierName: 'Tier 3', frequency: 'monthly', status: 'ended', amountSat: 400, lifetimeSat: 400, startDate: 4000, nextRenewal: 5000, intervalDays: 30, progress: 0.5, dueSoon: false, tierId: 't3', nip05: '' },
];

const mockProfiles: Record<string, { name: string, nip05: string }> = {
  npub1: { name: 'Alice', nip05: 'alice@domain.com' },
  npub2: { name: 'Bob', nip05: 'bob@domain.com' },
};

// Mocks
vi.mock('../../../src/stores/dexie', () => ({
  cashuDb: {
    lockedTokens: { where: vi.fn().mockReturnThis(), equals: vi.fn().mockReturnThis(), and: vi.fn().mockReturnThis(), toArray: vi.fn().mockResolvedValue([]) },
    profiles: { put: vi.fn().mockResolvedValue(undefined) }
  },
  liveQuery: (fn: () => any) => ({
    subscribe: (sub: any) => {
      fn().then(sub.next);
      return { unsubscribe: () => {} };
    },
  }),
}));

vi.mock('../../../src/stores/nostr', () => ({
  useNostrStore: () => ({
    initNdkReadOnly: vi.fn().mockResolvedValue(undefined),
    resolvePubkey: (s: string) => s,
    connected: true,
    lastError: null,
  }),
}));

vi.mock('../../../src/composables/useNdk', () => ({
  useNdk: vi.fn().mockResolvedValue({ fetchEvents: fetchEventsMock }),
}));


describe('CreatorSubscribers Store Logic', () => {
  beforeEach(() => {
    createTestingPinia({ createSpy: vi.fn, stubActions: false });
    vi.clearAllMocks();
    const store = useCreatorSubscribersStore();
    store.$reset();
    store.subscribers = JSON.parse(JSON.stringify(mockSubscribers));

    fetchEventsMock.mockImplementation(async (filter) => {
      const events = new Set<any>();
      for (const author of filter.authors) {
        if (mockProfiles[author]) {
          events.add({
            pubkey: author,
            content: JSON.stringify(mockProfiles[author]),
          });
        }
      }
      return events;
    });
  });

  it('fetches and caches profiles for unique subscribers in batches', async () => {
    const store = useCreatorSubscribersStore();
    await store.fetchProfiles();

    expect(fetchEventsMock).toHaveBeenCalledTimes(1);
    expect(store.profileCache['npub1']).toEqual(mockProfiles.npub1);
    expect(store.profileCache['npub2']).toEqual(mockProfiles.npub2);

    expect(store.subscribers.find(s => s.npub === 'npub1')?.name).toBe('Alice');
    expect(store.subscribers.find(s => s.npub === 'npub2')?.name).toBe('Bob');

    fetchEventsMock.mockClear();
    await store.fetchProfiles();
    expect(fetchEventsMock).not.toHaveBeenCalled();
  });

  it('sorts subscribers by lifetime sats', () => {
    const store = useCreatorSubscribersStore();
    const viewStore = useSubscribersStore();

    viewStore.applyFilters({ sort: 'amount' });

    const sorted = store.filtered;
    expect(sorted[0].npub).toBe('npub4');
    expect(sorted[1].npub).toBe('npub3');
    expect(sorted[2].npub).toBe('npub1');
  });

  it('filters subscribers by status', () => {
    const store = useCreatorSubscribersStore();
    const viewStore = useSubscribersStore();

    viewStore.applyFilters({ status: new Set(['ended']) });

    expect(store.filtered.length).toBe(1);
    expect(store.filtered[0].npub).toBe('npub4');
  });
});
