<template>
  <div>
    <div
      v-if="filteredPinned.length + filteredRegular.length === 0"
      class="q-pa-md text-caption text-grey-7"
    >
      No active conversations.
    </div>
    <q-virtual-scroll
      v-else
      bordered
      :items="virtualItems"
      :virtual-scroll-sizes="virtualSizes"
      :virtual-scroll-item-size="ITEM_HEIGHT"
      class="full-width"
    >
      <template v-slot="{ item }">
        <q-item-label
          v-if="item.type === 'header'"
          :key="item.key"
          header
          class="q-px-md q-pt-sm q-pb-xs bg-white dark:bg-dark"
          style="position: sticky; top: 0; z-index: 1"
        >
          {{ item.label }}
        </q-item-label>
        <ConversationListItem
          v-else
          :key="item.key"
          :pubkey="item.pubkey"
          :lastMsg="item.lastMsg"
          :selected="item.pubkey === selectedPubkey"
          @click="select(item.pubkey)"
          @pin="togglePin(item.pubkey)"
          @delete="deleteConversation(item.pubkey)"
        />
      </template>
    </q-virtual-scroll>
  </div>
</template>

<script lang="ts" setup>
import { computed, watch, onMounted, ref } from "vue";
import { storeToRefs } from "pinia";
import { useMessengerStore } from "src/stores/messenger";
import { useNostrStore } from "src/stores/nostr";
import ConversationListItem from "./ConversationListItem.vue";

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

const uniqueConversations = computed(() => {
  return Object.entries(conversations.value)
    .map(([pubkey, msgs]) => ({
      pubkey,
      lastMsg: msgs[msgs.length - 1],
      timestamp: msgs[msgs.length - 1]?.created_at,
      pinned: messenger.pinned[pubkey] || false,
    }))
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (b.pinned && !a.pinned) return 1;
      return b.timestamp - a.timestamp;
    });
});

const pinnedConversations = computed(() =>
  uniqueConversations.value.filter((c) => c.pinned),
);

const regularConversations = computed(() =>
  uniqueConversations.value.filter((c) => !c.pinned),
);

const applyFilter = (list: typeof uniqueConversations.value) => {
  const q = filterQuery.value.toLowerCase();
  if (!q) return list;
  return list.filter(({ pubkey }) => {
    const entry: any = (nostr.profiles as any)[pubkey];
    const profile = entry?.profile ?? entry ?? {};
    const name =
      profile.display_name || profile.name || profile.displayName || pubkey;
    return name.toLowerCase().includes(q) || pubkey.toLowerCase().includes(q);
  });
};

const filteredPinned = computed(() => applyFilter(pinnedConversations.value));
const filteredRegular = computed(() => applyFilter(regularConversations.value));

const ITEM_HEIGHT = 72;
const HEADER_HEIGHT = 36;

interface VirtualHeader {
  type: "header";
  key: string;
  label: string;
}

interface VirtualItem {
  type: "item";
  key: string;
  pubkey: string;
  lastMsg: any;
}

type VirtualEntry = VirtualHeader | VirtualItem;

const virtualItems = computed<VirtualEntry[]>(() => {
  const items: VirtualEntry[] = [];
  if (filteredPinned.value.length) {
    items.push({ type: "header", key: "header-pinned", label: "Pinned" });
    filteredPinned.value.forEach((c) =>
      items.push({ type: "item", key: "pinned-" + c.pubkey, ...c }),
    );
  }
  items.push({
    type: "header",
    key: "header-all",
    label: "All Conversations",
  });
  filteredRegular.value.forEach((c) =>
    items.push({ type: "item", key: "reg-" + c.pubkey, ...c }),
  );
  return items;
});

const virtualSizes = computed(() =>
  virtualItems.value.map((i) => (i.type === "header" ? HEADER_HEIGHT : ITEM_HEIGHT)),
);

const loadProfiles = async () => {
  for (const { pubkey } of uniqueConversations.value) {
    if (!(nostr.profiles as any)[pubkey]) {
      await nostr.getProfile(pubkey);
    }
  }
};

onMounted(loadProfiles);
watch(uniqueConversations, loadProfiles);

const select = (pubkey: string) => emit("select", nostr.resolvePubkey(pubkey));
const togglePin = (pubkey: string) => {
  messenger.togglePin(nostr.resolvePubkey(pubkey));
};

const deleteConversation = (pubkey: string) => {
  messenger.deleteConversation(nostr.resolvePubkey(pubkey));
};
</script>
