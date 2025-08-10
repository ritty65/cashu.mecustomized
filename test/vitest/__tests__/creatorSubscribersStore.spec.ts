import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useCreatorSubscribersStore } from '@/stores/creatorSubscribers';

const dexieRows = [{ id: '1', name: 'd', npub: 'npub', nip05: '', tierId: 't', tierName: 'T', amountSat: 1, frequency: 'monthly', status: 'active', startDate: 1, lifetimeSat: 1 }];

vi.mock('@/data/dexieSubscribersSource', () => ({
  DexieSubscribersSource: vi.fn().mockImplementation(() => ({
    listByCreator: vi.fn(async () => dexieRows),
    paymentsBySubscriber: vi.fn(async () => []),
  })),
}));

vi.mock('@/data/httpSubscribersSource', () => ({
  HttpSubscribersSource: vi.fn().mockImplementation(() => ({
    listByCreator: vi.fn(async () => [{ ...dexieRows[0], id: 'h1' }]),
    paymentsBySubscriber: vi.fn(async () => []),
  })),
}));

describe('creatorSubscribers store source selection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.unstubAllEnvs();
  });

  it('auto uses dexie when rows exist', async () => {
    const store = useCreatorSubscribersStore();
    store.setSource();
    await store.hydrate('npub');
    expect(store.usedFallback).toBe(false);
    expect(store.subscribers[0].id).toBe('1');
  });

  it('auto falls back to http when dexie empty', async () => {
    dexieRows.length = 0;
    const store = useCreatorSubscribersStore();
    store.setSource();
    await store.hydrate('npub');
    expect(store.usedFallback).toBe(true);
    expect(store.subscribers[0].id).toBe('h1');
  });

  it('forces dexie when env set', async () => {
    vi.stubEnv('VITE_SUBSCRIBERS_SOURCE', 'dexie');
    const store = useCreatorSubscribersStore();
    store.setSource();
    await store.hydrate('npub');
    expect(store.sourceKind).toBe('dexie');
    expect(store.usedFallback).toBe(false);
    expect(store.subscribers[0].id).toBe('1');
  });

  it('forces http when env set', async () => {
    vi.stubEnv('VITE_SUBSCRIBERS_SOURCE', 'http');
    const store = useCreatorSubscribersStore();
    store.setSource();
    await store.hydrate('npub');
    expect(store.sourceKind).toBe('http');
    expect(store.subscribers[0].id).toBe('h1');
  });
});
