import type { ISubscribersSource, Payment } from './subscribersSource';
import type { Subscriber } from '@/types/subscriber';
import { cashuDb, type LockedToken } from '@/stores/dexie';
import { daysToFrequency } from '@/constants/subscriptionFrequency';
import { toSec } from '@/utils/time';

function median(nums: number[]): number {
  const n = nums.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  if (!n.length) return 0;
  const m = Math.floor(n.length / 2);
  return n.length % 2 ? n[m] : Math.floor((n[m - 1] + n[m]) / 2);
}

function safe(n: any): number {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : 0;
}

export class DexieSubscribersSource implements ISubscribersSource {
  async listByCreator(creatorNpub: string): Promise<Subscriber[]> {
    const rows = await cashuDb.lockedTokens
      .where('creatorNpub')
      .equals(creatorNpub)
      .and((t) => t.owner === 'creator' && !!t.subscriptionId)
      .toArray();

    const groups = new Map<string, LockedToken[]>();
    for (const r of rows) {
      const key = r.subscriptionId || `${r.subscriberNpub}:${r.tierId}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(r);
    }

    const out: Subscriber[] = [];
    const now = Math.floor(Date.now() / 1000);

    for (const [key, tokens] of groups.entries()) {
      const any = tokens[0];
      const subRec = any.subscriptionId
        ? await cashuDb.subscriptions.get(any.subscriptionId)
        : null;
      const amounts = tokens.map((t) => safe(t.amount));
      const received = tokens.filter((t) => t.status === 'claimed').length;
      const pending = tokens.filter((t) => t.status !== 'claimed');
      const totalPeriods =
        subRec?.commitmentLength ?? any.totalPeriods ?? received + pending.length;
      const remaining = totalPeriods - received;
      const totalAmount = amounts.reduce((s, a) => s + a, 0);
      let amountSat = 0;
      if (subRec?.amountPerInterval != null)
        amountSat = safe(subRec.amountPerInterval);
      else if (amounts.length >= 2) amountSat = median(amounts);
      else if (totalPeriods > 0) amountSat = Math.floor(totalAmount / totalPeriods);
      else if (amounts.length) amountSat = amounts[0];
      if (!Number.isFinite(amountSat) || amountSat < 0) amountSat = 0;

      const nextTok = pending.sort((a, b) => (a.unlockTs ?? 0) - (b.unlockTs ?? 0))[0];
      const startDate = Math.min(...tokens.map((t) => toSec(t.unlockTs) ?? now));
      const lifetimeSat = tokens
        .filter((t) => t.status === 'claimed')
        .reduce((s, t) => s + safe(t.amount), 0);
      let status: 'pending' | 'active' | 'ended';
      if (received === 0) status = 'pending';
      else if (remaining <= 0 || (tokens.every((t) => (t.unlockTs ?? 0) < now))) status = 'ended';
      else status = 'active';

      out.push({
        id: any.subscriptionId || key,
        name: any.subscriberNpub?.slice(0, 8) || '',
        npub: any.subscriberNpub || '',
        nip05: '',
        tierId: any.tierId,
        tierName: any.tierName || 'Unknown Tier',
        amountSat,
        frequency: daysToFrequency(any.intervalDays ?? 30),
        status,
        startDate: startDate || now,
        nextRenewal: nextTok ? toSec(nextTok.unlockTs) : undefined,
        lifetimeSat,
      });
    }

    return out;
  }

  async paymentsBySubscriber(subscriberNpub: string): Promise<Payment[]> {
    const rows = await cashuDb.lockedTokens
      .where('subscriberNpub')
      .equals(subscriberNpub)
      .and((t) => t.owner === 'creator')
      .toArray();
    const list: Payment[] = rows.map((t) => ({
      ts: toSec(t.unlockTs) ?? Math.floor(Date.now() / 1000),
      amountSat: safe(t.amount),
      status: t.status === 'claimed' ? 'settled' : t.status === 'expired' ? 'failed' : 'pending',
    }));
    return list.sort((a, b) => a.ts - b.ts);
  }
}
