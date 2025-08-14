<template>
  <div>
    <q-list bordered>
      <template v-if="filteredPinned.length">
        <q-item-label header class="q-px-md q-pt-sm q-pb-xs"
          >Pinned</q-item-label
        >
        <ChatListItem
          v-for="item in filteredPinned"
          :key="'pinned-' + item.npub"
          :name="item.name"
          :npub="item.npub"
          :last-message="item.lastMessage"
          :time-ago="item.timeAgo"
          :avatar="item.avatar"
          :online="item.online"
          :starred="item.starred"
          @click="select(item.pubkey)"
        />
        <q-separator v-if="filteredRegular.length" spaced />
      </template>

      <q-item-label header class="q-px-md q-pt-sm q-pb-xs"
        >All Conversations</q-item-label
      >
      <ChatListItem
        v-for="item in filteredRegular"
        :key="'reg-' + item.npub"
        :name="item.name"
        :npub="item.npub"
        :last-message="item.lastMessage"
        :time-ago="item.timeAgo"
        :avatar="item.avatar"
        :online="item.online"
        :starred="item.starred"
        @click="select(item.pubkey)"
      />
      <div
        v-if="filteredPinned.length + filteredRegular.length === 0"
        class="q-pa-md text-caption text-grey-7"
      >
        No active conversations.
      </div>
    </q-list>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useMessengerStore } from "src/stores/messenger";
import { useNostrStore } from "src/stores/nostr";
import { nip19 } from "nostr-tools";
import { formatDistanceToNow } from "date-fns";
import ChatListItem from "src/components/messenger/ChatListItem.vue";

const props = defineProps<{ selectedPubkey: string; search?: string }>();

const emit = defineEmits(["select"]);
const messenger = useMessengerStore();
const nostr = useNostrStore();
const { conversations } = storeToRefs(messenger);
const filterQuery = ref(props.search || "");
watch(
  () => props.search,
  (val) => {
    filterQuery.value = val || "";
  },
);

const enrichedConversations = computed(() => {
  return Object.entries(conversations.value)
    .map(([pubkey, msgs]) => {
      const lastMsg = msgs[msgs.length - 1];
      const profileEntry: any = (nostr.profiles as any)[pubkey];
      const profile = profileEntry?.profile ?? profileEntry ?? {};
      const alias = messenger.aliases[pubkey];
      const name = alias || profile.display_name || profile.name || profile.displayName;
      const timeAgo = lastMsg?.created_at
        ? formatDistanceToNow(lastMsg.created_at * 1000, { addSuffix: true })
        : "";

      return {
        pubkey,
        npub: nip19.npubEncode(pubkey),
        name,
        lastMessage: lastMsg?.content || "",
        timestamp: lastMsg?.created_at,
        timeAgo,
        avatar: profile.picture,
        online: messenger.connected,
        starred: messenger.pinned[pubkey] || false,
      };
    })
    .sort((a, b) => {
      if (a.starred && !b.starred) return -1;
      if (b.starred && !a.starred) return 1;
      return (b.timestamp || 0) - (a.timestamp || 0);
    });
});

const pinnedConversations = computed(() =>
  enrichedConversations.value.filter((c) => c.starred),
);

const regularConversations = computed(() =>
  enrichedConversations.value.filter((c) => !c.starred),
);

const applyFilter = (list: typeof enrichedConversations.value) => {
  const q = filterQuery.value.toLowerCase();
  if (!q) return list;
  return list.filter((c) => {
    const nameMatch = c.name?.toLowerCase().includes(q);
    const npubMatch = c.npub.toLowerCase().includes(q);
    return nameMatch || npubMatch;
  });
};

const filteredPinned = computed(() => applyFilter(pinnedConversations.value));
const filteredRegular = computed(() => applyFilter(regularConversations.value));

const loadProfiles = async () => {
  for (const { pubkey } of enrichedConversations.value) {
    if (!(nostr.profiles as any)[pubkey]) {
      await nostr.getProfile(pubkey);
    }
  }
};

onMounted(loadProfiles);
watch(enrichedConversations, loadProfiles);

const select = (pubkey: string) => emit("select", nostr.resolvePubkey(pubkey));
</script>
