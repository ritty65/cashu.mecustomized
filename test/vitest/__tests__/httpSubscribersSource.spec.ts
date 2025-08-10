import { fetchSubscribers, SubscribersHttpError } from 'src/data/httpSubscribersSource';

describe('httpSubscribersSource', () => {
  const OLD_ENV = import.meta.env;
  beforeEach(() => {
    (import.meta as any).env = { ...OLD_ENV };
  });
  afterAll(() => {
    (import.meta as any).env = OLD_ENV;
  });

  it('throws when endpoint missing', async () => {
    (import.meta as any).env.VITE_SUBSCRIBERS_ENDPOINT = undefined;
    await expect(fetchSubscribers()).rejects.toMatchObject({
      code: 'SUBSCRIBERS_ENDPOINT_MISSING',
    });
  });

  it('fetches and normalizes array', async () => {
    (import.meta as any).env.VITE_SUBSCRIBERS_ENDPOINT = 'https://example.com/subs';
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ subscribers: [{ npub: 'npub1' }] }),
    });
    const res = await fetchSubscribers();
    expect(res).toEqual([{ npub: 'npub1' }]);
  });
});

