describe('httpSubscribersSource', () => {
  const OLD_ENV = import.meta.env;
  afterAll(() => {
    delete (globalThis as any).__SUBSCRIBERS_ENDPOINT__;
    (import.meta as any).env = OLD_ENV;
  });

  it('throws when endpoint missing', async () => {
    (import.meta as any).env.VITE_SUBSCRIBERS_ENDPOINT = undefined;
    const mod = await import('src/data/httpSubscribersSource');
    await expect(mod.fetchSubscribers()).rejects.toMatchObject({
      code: 'SUBSCRIBERS_ENDPOINT_MISSING',
    });
  });

  it('fetches and normalizes array', async () => {
    (globalThis as any).__SUBSCRIBERS_ENDPOINT__ = 'https://example.com/subs';
    // @ts-ignore
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ subscribers: [{ npub: 'npub1' }] }),
    });
    const mod = await import('src/data/httpSubscribersSource');
    const res = await mod.fetchSubscribers();
    expect(res).toEqual([{ npub: 'npub1' }]);
  });
});
