import { db } from 'src/stores/dexie';
import type { Subscriber } from 'src/types/subscriber';

export async function getAll(): Promise<Subscriber[]> {
  return db.subscribers.toArray();
}

export async function replaceAll(items: Subscriber[]): Promise<void> {
  await db.transaction('rw', db.subscribers, async () => {
    await db.subscribers.clear();
    if (items?.length) await db.subscribers.bulkPut(items);
  });
}
