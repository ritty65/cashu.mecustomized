import type { Subscriber } from 'src/types/subscriber';
import * as http from './httpSubscribersSource';
import * as dexie from './dexieSubscribersSource';

export type LoadResult = { data: Subscriber[]; from: 'cache' | 'network' };

export async function load(creatorNpub?: string): Promise<LoadResult> {
  const cached = await dexie.getAll();
  let data = cached;
  let from: LoadResult['from'] = 'cache';

  try {
    const fresh = await http.fetchSubscribers(creatorNpub);
    if (fresh?.length) {
      data = fresh;
      from = 'network';
      await dexie.replaceAll(fresh);
    }
  } catch (_) {
    if (!cached?.length) data = [];
  }

  return { data, from };
}

