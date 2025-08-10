import { setActivePinia, createPinia } from 'pinia';
import { useCreatorSubscribers } from 'src/stores/creatorSubscribers';
import * as src from 'src/data/subscribersSource';

describe('creatorSubscribers store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('fetches and sets subscribers', async () => {
    vi.spyOn(src, 'load').mockResolvedValue({
      data: [{ npub: 'x' }] as any,
      from: 'network',
    });
    const s = useCreatorSubscribers();
    await s.fetchSubscribers();
    expect(s.subscribers.length).toBe(1);
    expect(s.loading).toBe(false);
    expect(s.error).toBeNull();
  });

  it('sets error on failure and keeps existing', async () => {
    vi.spyOn(src, 'load').mockRejectedValue(new Error('err'));
    const s = useCreatorSubscribers();
    s.subscribers = [{ npub: 'cached' }] as any;
    await s.fetchSubscribers();
    expect(s.error).toBeTruthy();
    expect(s.subscribers[0].npub).toBe('cached');
  });
});

