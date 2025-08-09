import { defineStore } from "pinia";
import type { Subscriber, Frequency, SubStatus } from "../types/subscriber";
import type { ISubscribersSource } from "src/data/subscribersSource";
import { HttpSubscribersSource } from "src/data/httpSubscribersSource";

type Tab = "all" | Frequency | "pending" | "ended";

export type SortOption = "next" | "first" | "amount";

export const useCreatorSubscribersStore = defineStore("creatorSubscribers", {
  state: () => ({
    subscribers: [] as Subscriber[],
    query: "",
    activeTab: "all" as Tab,
    statuses: new Set<SubStatus>(),
    tiers: new Set<string>(),
    sort: "next" as SortOption,
    source: null as ISubscribersSource | null,
    hydrated: false,
  }),
  getters: {
    filtered(state): Subscriber[] {
      // accessing the active tab here ensures this getter recomputes whenever
      // the user switches tabs in the UI
      const currentTab = state.activeTab;
      let arr = state.subscribers.slice();

      if (state.statuses.size) {
        arr = arr.filter((s) => state.statuses.has(s.status));
      }

      if (state.tiers.size) {
        arr = arr.filter((s) => state.tiers.has(s.tierId));
      }

      if (state.query.trim()) {
        const q = state.query.toLowerCase();
        arr = arr.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.npub.toLowerCase().includes(q) ||
            s.nip05.toLowerCase().includes(q)
        );
      }

      switch (state.activeTab) {
        case "weekly":
        case "biweekly":
        case "monthly":
          arr = arr.filter((s) => s.frequency === state.activeTab);
          break;
        case "pending":
        case "ended":
          arr = arr.filter((s) => s.status === state.activeTab);
          break;
        default:
          break;
      }

      arr.sort((a, b) => {
        if (state.sort === "amount") {
          const al = typeof a.lifetimeSat === "number" ? a.lifetimeSat : 0;
          const bl = typeof b.lifetimeSat === "number" ? b.lifetimeSat : 0;
          return bl - al;
        }
        if (state.sort === "first") {
          return a.startDate - b.startDate;
        }
        const an =
          typeof a.nextRenewal === "number" ? a.nextRenewal : Number.POSITIVE_INFINITY;
        const bn =
          typeof b.nextRenewal === "number" ? b.nextRenewal : Number.POSITIVE_INFINITY;
        return an - bn;
      });

      return arr;
    },
    counts(state) {
      // state.sort is included to make the getter reactive to sort changes,
      // even though the sorting itself does not affect the totals
      void state.sort;
      let arr = state.subscribers.slice();

      if (state.statuses.size) {
        arr = arr.filter((s) => state.statuses.has(s.status));
      }
      if (state.tiers.size) {
        arr = arr.filter((s) => state.tiers.has(s.tierId));
      }
      if (state.query.trim()) {
        const q = state.query.toLowerCase();
        arr = arr.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.npub.toLowerCase().includes(q) ||
            s.nip05.toLowerCase().includes(q)
        );
      }

      return {
        all: arr.length,
        weekly: arr.filter((s) => s.frequency === "weekly").length,
        biweekly: arr.filter((s) => s.frequency === "biweekly").length,
        monthly: arr.filter((s) => s.frequency === "monthly").length,
        pending: arr.filter((s) => s.status === "pending").length,
        ended: arr.filter((s) => s.status === "ended").length,
      };
    },
  },
  actions: {
    setSource(src?: ISubscribersSource) {
      this.source = src ?? new HttpSubscribersSource();
    },
    async hydrate(creatorNpub: string) {
      if (!this.source) this.setSource();
      const rows = await this.source!.listByCreator(creatorNpub);
      this.subscribers = rows;
      this.hydrated = true;
    },
    async fetchPayments(npub: string) {
      if (!this.source?.paymentsBySubscriber) return [];
      return await this.source.paymentsBySubscriber(npub);
    },
    setActiveTab(tab: Tab) {
      this.activeTab = tab;
    },
    setQuery(q: string) {
      this.query = q;
    },
    applyFilters(opts: { statuses: Set<SubStatus>; tiers: Set<string>; sort: SortOption }) {
      this.statuses = new Set(opts.statuses);
      this.tiers = new Set(opts.tiers);
      this.sort = opts.sort;
    },
    clearFilters() {
      this.statuses.clear();
      this.tiers.clear();
      this.sort = "next";
    },
  },
});

export type { Subscriber } from "../types/subscriber";
