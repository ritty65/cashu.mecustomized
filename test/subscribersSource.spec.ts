import * as http from 'src/data/httpSubscribersSource';
import * as dexie from 'src/data/dexieSubscribersSource';
import { load } from 'src/data/subscribersSource';

vi.spyOn(dexie, 'getAll').mockResolvedValue([{ npub: 'cached' }] as any);
vi.spyOn(dexie, 'replaceAll').mockResolvedValue();

describe('subscribersSource load()', () => {
  it('returns cache on http fail', async () => {
    vi.spyOn(http, 'fetchSubscribers').mockRejectedValue(new Error('boom'));
    const { data, from } = await load();
    expect(data[0].npub).toBe('cached');
    expect(from).toBe('cache');
  });
  it('returns network and updates cache', async () => {
    vi.spyOn(http, 'fetchSubscribers').mockResolvedValue([{ npub: 'fresh' }] as any);
    const { data, from } = await load();
    expect(data[0].npub).toBe('fresh');
    expect(from).toBe('network');
    expect(dexie.replaceAll).toHaveBeenCalled();
  });
});
