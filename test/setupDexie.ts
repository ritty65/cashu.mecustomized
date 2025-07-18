import Dexie from 'dexie';
import { afterEach } from 'vitest';

afterEach(async () => {
  const { cashuDb } = await import('../src/stores/dexie');
  await cashuDb.close();
  await Dexie.delete('cashuDatabase');
});
