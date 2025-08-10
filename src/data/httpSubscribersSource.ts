import type { ISubscribersSource, Payment } from './subscribersSource';
import type { Subscriber } from 'src/types/subscriber';
import { toSec } from '@/utils/time';

// Expect a JSON endpoint that returns creator subscribers in a shape we can map.
// Configure with VITE_SUBSCRIBERS_ENDPOINT, e.g. https://api.example.com/subscribers
const API = import.meta.env.VITE_SUBSCRIBERS_ENDPOINT;

export class HttpSubscribersSource implements ISubscribersSource {
  async listByCreator(creatorNpub: string): Promise<Subscriber[]> {
    if (!API) throw new Error('VITE_SUBSCRIBERS_ENDPOINT missing');
    const res = await fetch(`${API}?creator=${encodeURIComponent(creatorNpub)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    // Map API rows → our Subscriber type; adjust mapping to your API
    return (json.items ?? json).map((r: any): Subscriber => ({
      id: r.id ?? `${r.subscriberNpub}:${r.tierId}`,
      name: r.name ?? r.displayName ?? r.nip05 ?? r.subscriberNpub.slice(0,8),
      npub: r.subscriberNpub,
      nip05: r.nip05 ?? '',
      tierId: r.tierId ?? 'unknown',
      tierName: r.tierName ?? 'Unknown Tier',
      amountSat: Number(r.amountSat) || 0,
      frequency: r.frequency as 'weekly'|'biweekly'|'monthly',
      status: (r.status ?? 'active') as 'active'|'pending'|'ended',
      startDate: toSec(r.startDate) ?? Math.floor(Date.now()/1000),
      nextRenewal: toSec(r.nextRenewal),
      lifetimeSat: Number(r.lifetimeSat) || 0,
    }));
  }
  async paymentsBySubscriber(subscriberNpub: string): Promise<Payment[]> {
    if (!API) return [];
    const res = await fetch(`${API}/payments?subscriber=${encodeURIComponent(subscriberNpub)}`);
    if (!res.ok) return [];
    const json = await res.json();
    return (json.items ?? json).map((p: any) => ({
      ts: toSec(p.ts) ?? Math.floor(Date.now()/1000),
      amountSat: Number(p.amountSat) || 0,
      status: p.status ?? 'settled'
    }));
  }
}

