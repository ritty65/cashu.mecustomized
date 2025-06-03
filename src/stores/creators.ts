import { defineStore } from "pinia";
import { useNostrStore } from "./nostr";
import { nip19 } from "nostr-tools";

export const FEATURED_CREATORS = [
  "npub1aljmhjp5tqrw3m60ra7t3u8uqq223d6rdg9q0h76a8djd9m4hmvsmlj82m",
  "npub1sg6plzptd64u62a878hep2kev88swjh3tw00gjsfl8f237lmu63q0uf63m",
  "npub1qny3tkh0acurzla8x3zy4nhrjz5zd8l9sy9jys09umwng00manysew95gx",
  "npub1cj8znuztfqkvq89pl8hceph0svvvqk0qay6nydgk9uyq7fhpfsgsqwrz4u",
  "npub1a2cww4kn9wqte4ry70vyfwqyqvpswksna27rtxd8vty6c74era8sdcw83a",
  "npub1s05p3ha7en49dv8429tkk07nnfa9pcwczkf5x5qrdraqshxdje9sq6eyhe",
  "npub180cvv07tjdrrgpa0j7j7tmnyl2yr6yr7l8j4s3evf6u64th6gkwsyjh6w6",
  "npub1dergggklka99wwrs92yz8wdjs952h2ux2ha2ed598ngwu9w7a6fsh9xzpc",
  "npub1s5yq6wadwrxde4lhfs56gn64hwzuhnfa6r9mj476r5s4hkunzgzqrs6q7z",
  "npub1spdnfacgsd7lk0nlqkq443tkq4jx9z6c6ksvaquuewmw7d3qltpslcq6j7",
];

export interface CreatorProfile {
  pubkey: string;
  profile: any | null;
  followers: number | null;
  following: number | null;
  joined: number | null;
  loaded: boolean;
}

export const useCreatorsStore = defineStore("creators", {
  state: () => ({
    searchResults: [] as CreatorProfile[],
    searching: false,
    error: "",
  }),
  actions: {
    async searchCreators(query: string) {
      this.searchResults = [];
      this.error = "";
      if (!query) {
        return;
      }
      this.searching = true;
      let pubkey = query.trim();
      if (pubkey.startsWith("npub")) {
        try {
          const decoded = nip19.decode(pubkey);
          pubkey =
            typeof decoded.data === "string" ? (decoded.data as string) : "";
        } catch (e) {
          console.error(e);
          this.error = "Invalid npub";
          this.searching = false;
          return;
        }
      } else if (!/^[0-9a-fA-F]{64}$/.test(pubkey)) {
        this.error = "Invalid pubkey";
        this.searching = false;
        return;
      }
      this.searchResults.push({
        pubkey,
        profile: null,
        followers: null,
        following: null,
        joined: null,
        loaded: false,
      });
      this.searching = false;
    },

    async loadFeaturedCreators() {
      this.searchResults = [];
      this.error = "";
      this.searching = true;

      const pubkeys: string[] = [];
      for (const entry of FEATURED_CREATORS) {
        let pubkey = entry;
        if (entry.startsWith("npub") || entry.startsWith("nprofile")) {
          try {
            const decoded = nip19.decode(entry);
            if (typeof decoded.data === "string") {
              pubkey = decoded.data as string;
            } else if (
              typeof decoded.data === "object" &&
              (decoded.data as any).pubkey
            ) {
              pubkey = (decoded.data as any).pubkey as string;
            }
          } catch (e) {
            console.error("Failed to decode", entry, e);
            continue;
          }
        }
        pubkeys.push(pubkey);
      }

      pubkeys.forEach((pubkey) => {
        this.searchResults.push({
          pubkey,
          profile: null,
          followers: null,
          following: null,
          joined: null,
          loaded: false,
        });
      });
      this.searching = false;
    },

    async loadCreatorDetails(pubkey: string) {
      const nostrStore = useNostrStore();
      const creator = this.searchResults.find((c) => c.pubkey === pubkey);
      if (!creator || creator.loaded) return;
      await nostrStore.initNdkReadOnly();
      try {
        const user = nostrStore.ndk.getUser({ pubkey });
        const [_, followers, following, joined] = await Promise.all([
          user.fetchProfile(),
          nostrStore.fetchFollowerCount(pubkey),
          nostrStore.fetchFollowingCount(pubkey),
          nostrStore.fetchJoinDate(pubkey),
        ]);
        creator.profile = user.profile;
        creator.followers = followers;
        creator.following = following;
        creator.joined = joined;
        creator.loaded = true;
      } catch (e) {
        console.error(e);
      }
    },
  },
});
