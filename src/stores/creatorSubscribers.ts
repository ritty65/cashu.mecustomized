import { defineStore } from "pinia";
import { liveQuery } from "dexie";
import { cashuDb } from "./dexie";
import { useNostrStore } from "./nostr";
import { daysToFrequency } from "src/constants/subscriptionFrequency";
import type { Subscriber, Frequency, SubStatus } from "../types/subscriber";

type Tab = "all" | Frequency | "pending" | "ended";

export type SortOption = "next" | "first" | "amount";

export const useCreatorSubscribersStore = defineStore("creatorSubscribers", {
  state: () => {
    const state = {
      subscribers: [] as Subscriber[],
      query: "",
      activeTab: "all" as Tab,
      statuses: new Set<SubStatus>(),
      tiers: new Set<string>(),
      sort: "next" as SortOption,
    };

    const nostr = useNostrStore();

    liveQuery(() =>
      cashuDb.lockedTokens
        .where("owner")
        .equals("creator")
        .and((t) => !!t.subscriptionId)
        .toArray()
    ).subscribe({
      next: async (rows) => {
        const map = new Map<
          string,
          {
            id: string;
            npub: string;
            tierId: string;
            tierName: string;
            amountSat: number;
            frequency: Frequency;
            startDate: number;
            lastUnlock: number;
            intervalDays: number;
            statusSet: Set<string>;
            lifetimeSat: number;
          }
        >();

        for (const row of rows) {
          const id = row.subscriptionId!;
          const intervalDays = row.intervalDays ?? 30;
          let sub = map.get(id);
          if (!sub) {
            sub = {
              id,
              npub: row.subscriberNpub || "",
              tierId: row.tierId,
              tierName: row.tierName || "",
              amountSat: row.amount,
              frequency: daysToFrequency(intervalDays),
              startDate: row.unlockTs ?? 0,
              lastUnlock: row.unlockTs ?? 0,
              intervalDays,
              statusSet: new Set([row.status]),
              lifetimeSat: row.amount,
            };
            map.set(id, sub);
          } else {
            sub.lifetimeSat += row.amount;
            sub.statusSet.add(row.status);
            if (row.unlockTs != null) {
              if (row.unlockTs < sub.startDate) sub.startDate = row.unlockTs;
              if (row.unlockTs > sub.lastUnlock) sub.lastUnlock = row.unlockTs;
            }
          }
        }

        const arr: Subscriber[] = [];
        for (const sub of map.values()) {
          let status: SubStatus;
          if (
            [...sub.statusSet].every((s) => s === "claimed" || s === "expired")
          ) {
            status = "ended";
          } else if (sub.statusSet.has("pending")) {
            status = "pending";
          } else {
            status = "active";
          }
          const periodSeconds = sub.intervalDays * 86400;
          const nextRenewal =
            status === "ended" ? undefined : sub.lastUnlock + periodSeconds;
          arr.push({
            id: sub.id,
            name: sub.npub,
            npub: sub.npub,
            nip05: "",
            tierId: sub.tierId,
            tierName: sub.tierName,
            amountSat: sub.amountSat,
            frequency: sub.frequency,
            status,
            startDate: sub.startDate,
            nextRenewal,
            lifetimeSat: sub.lifetimeSat,
          });
        }

        await Promise.all(
          arr.map(async (sub) => {
            try {
              const profile = await nostr.getProfile(sub.npub);
              if (profile) {
                sub.name = profile.display_name || profile.name || sub.npub;
                sub.nip05 = profile.nip05 || "";
              }
            } catch {
              /* ignore */
            }
          })
        );

        state.subscribers = arr;
      },
      error: (err) => console.error(err),
    });

    return state;
  },
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

