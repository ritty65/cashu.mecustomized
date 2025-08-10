import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import {
  CashuWallet,
  CheckStateEnum,
  getEncodedToken,
  type Proof,
  type Token,
} from '@cashu/cashu-ts';
import { cashuDb } from '../../../src/stores/dexie';
import { useCreatorSubscribersStore } from '../../../src/stores/creatorSubscribers';

const checkSpy = vi
  .spyOn(CashuWallet.prototype, 'checkProofsStates')
  .mockImplementation(async (proofs: Proof[]) =>
    proofs.map(() => ({ state: CheckStateEnum.UNSPENT, Y: '' }))
  );

beforeEach(async () => {
  setActivePinia(createPinia());
  checkSpy.mockClear();
  await cashuDb.lockedTokens.clear();
});

describe('creatorSubscribers sync', () => {
  it('loads tokens and sets statuses', async () => {
    const now = Math.floor(Date.now() / 1000);
    const entries = [
      {
        id: 's1',
        tokenString: getEncodedToken({
          mint: 'https://mint.test',
          proofs: [{ amount: 1, secret: 'a', C: '', id: '00' } as Proof],
          unit: 'sat',
        } as Token, { version: 3 }),
        owner: 'creator',
        tierId: 't1',
        tierName: 'Tier1',
        intervalKey: 'k1',
        unlockTs: now - 60,
        status: 'pending',
        subscriptionEventId: null,
        subscriptionId: 's1',
        subscriberNpub: 'npubA',
        amount: 1,
        frequency: 'monthly',
        intervalDays: 30,
      },
      {
        id: 's2',
        tokenString: getEncodedToken({
          mint: 'https://mint.test',
          proofs: [{ amount: 1, secret: 'b', C: '', id: '00' } as Proof],
          unit: 'sat',
        } as Token, { version: 3 }),
        owner: 'creator',
        tierId: 't1',
        tierName: 'Tier1',
        intervalKey: 'k2',
        unlockTs: now + 60,
        status: 'pending',
        subscriptionEventId: null,
        subscriptionId: 's2',
        subscriberNpub: 'npubB',
        amount: 1,
        frequency: 'monthly',
        intervalDays: 30,
      },
    ];
    await cashuDb.lockedTokens.bulkAdd(entries as any);

    const store = useCreatorSubscribersStore();
    await store.sync();

    expect(checkSpy).toHaveBeenCalledTimes(2);
    const statuses = Object.fromEntries(
      store.subscribers.map((s) => [s.npub, s.status])
    );
    expect(statuses).toEqual({ npubA: 'active', npubB: 'pending' });
  });

  it('drops spent tokens and sets status pending', async () => {
    const now = Math.floor(Date.now() / 1000);
    checkSpy.mockImplementation(async (proofs: Proof[]) =>
      proofs.map((p) => ({
        state: p.secret === 'spent1' ? CheckStateEnum.SPENT : CheckStateEnum.UNSPENT,
        Y: '',
      }))
    );

    await cashuDb.lockedTokens.bulkAdd([
      {
        id: 'p1',
        tokenString: getEncodedToken(
          {
            mint: 'https://mint.test',
            proofs: [{ amount: 1, secret: 'spent1', C: '', id: '00' } as Proof],
            unit: 'sat',
          } as Token,
          { version: 3 }
        ),
        owner: 'creator',
        tierId: 't2',
        tierName: 'Tier2',
        intervalKey: 'k1',
        unlockTs: now - 60,
        status: 'pending',
        subscriptionEventId: null,
        subscriptionId: 'subP',
        subscriberNpub: 'npubP',
        amount: 1,
        frequency: 'monthly',
        intervalDays: 30,
        totalPeriods: 2,
      },
      {
        id: 'p2',
        tokenString: getEncodedToken(
          {
            mint: 'https://mint.test',
            proofs: [{ amount: 1, secret: 'valid1', C: '', id: '00' } as Proof],
            unit: 'sat',
          } as Token,
          { version: 3 }
        ),
        owner: 'creator',
        tierId: 't2',
        tierName: 'Tier2',
        intervalKey: 'k2',
        unlockTs: now + 60,
        status: 'pending',
        subscriptionEventId: null,
        subscriptionId: 'subP',
        subscriberNpub: 'npubP',
        amount: 1,
        frequency: 'monthly',
        intervalDays: 30,
        totalPeriods: 2,
      },
    ] as any);

    const store = useCreatorSubscribersStore();
    await store.sync();

    expect(checkSpy).toHaveBeenCalledTimes(2);
    const sub = store.subscribers.find((s) => s.npub === 'npubP');
    expect(sub?.receivedPeriods).toBe(1);
    expect(sub?.status).toBe('pending');
    expect(sub?.nextRenewal).toBe(now + 60 + 30 * 86400);
  });

  it('drops spent tokens but keeps subscription ended when valid tokens meet total', async () => {
    const now = Math.floor(Date.now() / 1000);
    checkSpy.mockImplementation(async (proofs: Proof[]) =>
      proofs.map((p) => ({
        state: p.secret === 'spent2' ? CheckStateEnum.SPENT : CheckStateEnum.UNSPENT,
        Y: '',
      }))
    );

    await cashuDb.lockedTokens.bulkAdd([
      {
        id: 'e1',
        tokenString: getEncodedToken(
          {
            mint: 'https://mint.test',
            proofs: [{ amount: 1, secret: 'valid2', C: '', id: '00' } as Proof],
            unit: 'sat',
          } as Token,
          { version: 3 }
        ),
        owner: 'creator',
        tierId: 't3',
        tierName: 'Tier3',
        intervalKey: 'k1',
        unlockTs: now - 60,
        status: 'pending',
        subscriptionEventId: null,
        subscriptionId: 'subE',
        subscriberNpub: 'npubE',
        amount: 1,
        frequency: 'monthly',
        intervalDays: 30,
        totalPeriods: 1,
      },
      {
        id: 'e2',
        tokenString: getEncodedToken(
          {
            mint: 'https://mint.test',
            proofs: [{ amount: 1, secret: 'spent2', C: '', id: '00' } as Proof],
            unit: 'sat',
          } as Token,
          { version: 3 }
        ),
        owner: 'creator',
        tierId: 't3',
        tierName: 'Tier3',
        intervalKey: 'k2',
        unlockTs: now - 30,
        status: 'pending',
        subscriptionEventId: null,
        subscriptionId: 'subE',
        subscriberNpub: 'npubE',
        amount: 1,
        frequency: 'monthly',
        intervalDays: 30,
        totalPeriods: 1,
      },
    ] as any);

    const store = useCreatorSubscribersStore();
    await store.sync();

    expect(checkSpy).toHaveBeenCalledTimes(2);
    const sub = store.subscribers.find((s) => s.npub === 'npubE');
    expect(sub?.receivedPeriods).toBe(1);
    expect(sub?.status).toBe('ended');
  });
});
