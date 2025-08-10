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
});
