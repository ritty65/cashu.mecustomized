import type { Subscriber } from 'src/types/subscriber';

export interface Payment {
  ts: number;            // seconds epoch
  amountSat: number;
  status?: 'settled' | 'failed' | 'pending';
}

export interface ISubscribersSource {
  listByCreator(creatorNpub: string): Promise<Subscriber[]>;
  paymentsBySubscriber?(subscriberNpub: string): Promise<Payment[]>;
}

