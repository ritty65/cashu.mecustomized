import { beforeEach, describe, expect, it } from 'vitest';
import { cashuDb } from '@/stores/dexie';
import { DexieSubscribersSource } from '@/data/dexieSubscribersSource';

beforeEach(async () => {
  await cashuDb.close();
  await cashuDb.open();
  await cashuDb.lockedTokens.clear();
  await cashuDb.subscriptions.clear();
});

describe('DexieSubscribersSource', () => {
  it('maps dexie records to subscribers and payments', async () => {
    await cashuDb.subscriptions.add({
      id: 'sub1',
      creatorNpub: 'npubCreator',
      tierId: 'tierA',
      creatorP2PK: '',
      mintUrl: '',
      amountPerInterval: 1000,
      frequency: 'monthly',
      intervalDays: 30,
      startDate: 0,
      commitmentLength: 3,
      tierName: 'Gold',
      benefits: [],
      creatorName: '',
      creatorAvatar: '',
      intervals: [],
      status: 'active',
      createdAt: 0,
      updatedAt: 0,
    });
    await cashuDb.lockedTokens.bulkAdd([
      {
        id: 't0', tokenString: '', amount: 1000, owner: 'creator', subscriberNpub: 'npubSub1', creatorNpub: 'npubCreator', tierId: 'tierA', tierName: 'Gold', intervalKey: '0', unlockTs: 1697418000, status: 'expired', subscriptionEventId: null, subscriptionId: 'sub1', frequency: 'monthly', intervalDays: 30,
      },
      {
        id: 't1', tokenString: '', amount: 900, owner: 'creator', subscriberNpub: 'npubSub1', creatorNpub: 'npubCreator', tierId: 'tierA', tierName: 'Gold', intervalKey: '1', unlockTs: 1700000000, status: 'claimed', subscriptionEventId: null, subscriptionId: 'sub1', frequency: 'monthly', intervalDays: 30,
      },
      {
        id: 't2', tokenString: '', amount: 1100, owner: 'creator', subscriberNpub: 'npubSub1', creatorNpub: 'npubCreator', tierId: 'tierA', tierName: 'Gold', intervalKey: '2', unlockTs: 1702592000, status: 'pending', subscriptionEventId: null, subscriptionId: 'sub1', frequency: 'monthly', intervalDays: 30,
      },
    ]);

    const src = new DexieSubscribersSource();
    const list = await src.listByCreator('npubCreator');
    expect(list).toHaveLength(1);
    const s = list[0];
    expect(s.id).toBe('sub1');
    expect(s.npub).toBe('npubSub1');
    expect(s.tierName).toBe('Gold');
    expect(s.frequency).toBe('monthly');
    expect(s.amountSat).toBe(1000);
    expect(s.startDate).toBe(1697418000);
    expect(s.nextRenewal).toBe(1702592000);
    expect(s.lifetimeSat).toBe(900);
    expect(s.status).toBe('active');

    const pays = await src.paymentsBySubscriber('npubSub1');
    expect(pays.map((p) => p.status)).toEqual(['failed', 'settled', 'pending']);
    expect(pays.map((p) => p.ts)).toEqual([1697418000, 1700000000, 1702592000]);
  });

  it('honors median and fallback calculations', async () => {
    await cashuDb.lockedTokens.bulkAdd([
      {
        id: 'a1', tokenString: '', amount: 800, owner: 'creator', subscriberNpub: 'npubA', creatorNpub: 'npubCreator', tierId: 'tierB', tierName: 'TierB', intervalKey: '1', unlockTs: 1, status: 'pending', subscriptionEventId: null, subscriptionId: null, frequency: 'monthly', intervalDays: 30,
      },
      {
        id: 'a2', tokenString: '', amount: 1200, owner: 'creator', subscriberNpub: 'npubA', creatorNpub: 'npubCreator', tierId: 'tierB', tierName: 'TierB', intervalKey: '2', unlockTs: 2, status: 'pending', subscriptionEventId: null, subscriptionId: null, frequency: 'monthly', intervalDays: 30,
      },
    ]);
    await cashuDb.lockedTokens.add({
      id: 'b1', tokenString: '', amount: 1000, owner: 'creator', subscriberNpub: 'npubB', creatorNpub: 'npubCreator', tierId: 'tierC', tierName: 'TierC', intervalKey: '1', unlockTs: 3, status: 'claimed', subscriptionEventId: null, subscriptionId: null, frequency: 'monthly', intervalDays: 30, totalPeriods: 4,
    });

    const src = new DexieSubscribersSource();
    const list = await src.listByCreator('npubCreator');
    const a = list.find((s) => s.npub === 'npubA')!;
    const b = list.find((s) => s.npub === 'npubB')!;
    expect(a.amountSat).toBe(1000); // median of 800 & 1200
    expect(b.amountSat).toBe(250); // totalAmount/periods
  });
});
