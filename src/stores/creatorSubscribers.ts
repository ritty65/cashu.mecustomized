import { defineStore } from 'pinia';
import type { Subscriber } from 'src/types/subscriber';
import * as source from 'src/data/subscribersSource';

type ViewMode = 'table' | 'cards';

export const useCreatorSubscribers = defineStore('creatorSubscribers', {
  state: () => ({
    subscribers: [] as Subscriber[],
    loading: false,
    error: null as string | null,
    viewMode: (localStorage.getItem('creator_subs_viewMode') as ViewMode) || 'table',
    search: '',
    selectedId: null as string | null,
  }),

  getters: {
    filteredSubscribers(state): Subscriber[] {
      const q = state.search.trim().toLowerCase();
      if (!q) return state.subscribers;
      return state.subscribers.filter((s) => {
        const name = (s.name || '').toLowerCase();
        const npub = (s.npub || '').toLowerCase();
        return name.includes(q) || npub.includes(q);
      });
    },
    total: (s) => s.subscribers.length,
  },

  actions: {
    setViewMode(mode: ViewMode) {
      this.viewMode = mode;
      localStorage.setItem('creator_subs_viewMode', mode);
    },
    setSearch(q: string) {
      this.search = q ?? '';
    },
    select(id: string | null) {
      this.selectedId = id;
    },

    async fetchSubscribers(force = false) {
      if (this.loading) return;
      this.loading = true;
      this.error = null;

      const creatorNpub = localStorage.getItem('creator_npub') || undefined;

      try {
        const { data } = await source.load(creatorNpub);
        this.subscribers = data ?? [];
      } catch (err: any) {
        this.error = err?.message || 'Failed to load subscribers';
      } finally {
        this.loading = false;
      }
    },
  },
});
