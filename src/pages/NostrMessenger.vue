<template>
  <q-layout
    class="full-height no-horizontal-scroll"
    :class="[$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark']"
  >
    <q-drawer
        :model-value="true"
        side="left"
        show-if-above
        :breakpoint="600"
        bordered
        :width="drawerOpen ? 360 : 64"
        class="drawer-transition drawer-container"
        :style="{ overflowX: 'hidden' }"
        :class="[
          $q.screen.gt.xs ? 'q-pa-lg column' : 'q-pa-md column',
          { 'drawer-collapsed': !drawerOpen },
        ]"
      >
        <template v-if="drawerOpen">
          <q-slide-transition>
            <div class="column no-wrap full-height drawer-content">
              <div class="row items-center justify-between q-mb-md">
                <div class="text-subtitle1">Chats</div>
                <q-btn flat dense round icon="add" @click="openNewChatDialog" />
              </div>
            <q-input
              dense
              rounded
              debounce="300"
              v-model="conversationSearch"
              placeholder="Search"
              class="q-mb-md"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
            <q-scroll-area class="col" style="min-height: 0">
              <Suspense>
                <template #default>
                  <ConversationList
                    :selected-pubkey="selected"
                    :search="conversationSearch"
                    @select="selectConversation"
                  />
                </template>
                <template #fallback>
                  <q-skeleton height="100px" square />
                </template>
              </Suspense>
            </q-scroll-area>
            <UserInfo />
            </div>
          </q-slide-transition>
        </template>
        <template v-else>
          <q-slide-transition>
            <div
              class="column items-center q-gutter-md mini-list"
              style="overflow-y: auto"
            >
              <q-avatar
                v-for="item in miniList"
                :key="item.pubkey"
                size="40px"
              class="cursor-pointer"
              @click="selectConversation(item.pubkey)"
            >
              <img v-if="item.profile?.picture" :src="item.profile.picture" />
              <span v-else>{{ item.initials }}</span>
              <q-tooltip>{{ item.displayName }}</q-tooltip>
              </q-avatar>
            </div>
          </q-slide-transition>
        </template>
    </q-drawer>

    <q-page-container>
      <q-page :class="['column', $q.screen.gt.xs ? 'q-pa-lg' : 'q-pa-md']">
        <q-spinner v-if="loading" size="lg" color="primary" />
        <ChatHeader
          v-if="selected"
          :name="activeChatProfile?.name"
          :npub="activeChatProfile?.npub"
          :avatar="activeChatProfile?.avatar"
          :online="messenger.connected"
          :connecting="connecting"
          @copy="copyNpub"
          @toggleDrawer="messenger.toggleDrawer"
          @refresh="reconnectAll"
        />
        <MessageList :messages="messages" class="col" />
        <div class="q-pa-md">
          <ComposeBar
            v-model="draft"
            @send="sendMessage"
            @attach="attachFile"
            @send-token="openSendTokenDialog"
            @emoji="$q.notify({ message: 'Emoji not implemented yet.', type: 'info' })"
          />
        </div>
        <ChatSendTokenDialog ref="chatSendTokenDialogRef" :recipient="selected" />
        <NewChatDialog ref="newChatDialogRef" @start="startChat" />
      </q-page>
    </q-page-container>
  </q-layout>
  <NostrSetupWizard v-model="showSetupWizard" @complete="setupComplete" />
</template>

<script lang="ts">
import {
  defineComponent,
  computed,
  ref,
  onMounted,
  onUnmounted,
  watch,
} from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { useClipboard } from "@vueuse/core";
import { useMessengerStore } from "src/stores/messenger";
import { useNdk } from "src/composables/useNdk";
import { useNostrStore } from "src/stores/nostr";
import { nip19 } from "nostr-tools";
import type NDK from "@nostr-dev-kit/ndk";

import NewChatDialog from "components/NewChatDialog.vue";
import ConversationList from "components/ConversationList.vue";
import MessageList from "components/MessageList.vue";
import ChatSendTokenDialog from "components/ChatSendTokenDialog.vue";
import NostrSetupWizard from "components/NostrSetupWizard.vue";
import UserInfo from "components/UserInfo.vue";
import ChatHeader from "src/components/messenger/ChatHeader.vue";
import ComposeBar from "src/components/messenger/ComposeBar.vue";
import { shortenString } from "src/js/string-utils";

export default defineComponent({
  name: "NostrMessenger",
  components: {
    NewChatDialog,
    ConversationList,
    MessageList,
    ChatSendTokenDialog,
    NostrSetupWizard,
    UserInfo,
    ChatHeader,
    ComposeBar,
  },
  setup() {
    const loading = ref(true);
    const connecting = ref(false);
    const messenger = useMessengerStore();
    const nostr = useNostrStore();
    const showSetupWizard = ref(false);
    const draft = ref("");
    const $q = useQuasar();
    const { copy } = useClipboard();

    const ndkRef = ref<NDK | null>(null);
    const now = ref(Date.now());
    let timer: ReturnType<typeof setInterval> | undefined;

    function bech32ToHex(pubkey: string): string {
      try {
        const decoded = nip19.decode(pubkey);
        return typeof decoded.data === "string" ? decoded.data : pubkey;
      } catch {
        return pubkey;
      }
    }

    function timeout(ms: number) {
      return new Promise<void>((resolve) => setTimeout(resolve, ms));
    }

    async function init() {
      connecting.value = true;
      try {
        await nostr.initSignerIfNotSet();
        await messenger.loadIdentity();
        ndkRef.value = await useNdk();
        await Promise.race([messenger.start(), timeout(10000)]);
      } catch (e) {
        console.error(e);
      } finally {
        connecting.value = false;
        loading.value = false;
        const qp = route.query.pubkey as string | undefined;
        if (qp) {
          const hex = bech32ToHex(qp);
          messenger.startChat(hex);
          selected.value = hex;
        }
      }
    }

    async function checkAndInit() {
      if (!nostr.pubkey || nostr.relays.length === 0) {
        loading.value = false;
        showSetupWizard.value = true;
        return;
      }
      await init();
    }

    onMounted(() => {
      checkAndInit();
      timer = setInterval(() => (now.value = Date.now()), 1000);
    });

    onUnmounted(() => {
      if (timer) clearInterval(timer);
    });

    const route = useRoute();

    const drawerOpen = computed(() => messenger.drawerOpen);
    const selected = ref("");
    const chatSendTokenDialogRef = ref<InstanceType<
      typeof ChatSendTokenDialog
    > | null>(null);
    const newChatDialogRef = ref<InstanceType<typeof NewChatDialog> | null>(
      null,
    );
    const conversationSearch = ref("");
    const messages = computed(
      () => messenger.conversations[selected.value] || [],
    );

    const activeChatProfile = computed(() => {
      if (!selected.value) return null;
      const pubkey = selected.value;
      const entry: any = (nostr.profiles as any)[pubkey];
      const profile = entry?.profile ?? entry ?? {};
      const alias = messenger.aliases[pubkey];
      const npub = nip19.npubEncode(pubkey);
      const name =
        alias ||
        profile.display_name ||
        profile.name ||
        profile.displayName ||
        npub;
      return {
        name,
        npub,
        avatar: profile.picture,
      };
    });

    const miniList = computed(() => {
      return Object.entries(messenger.conversations)
        .map(([pubkey, msgs]) => {
          const entry: any = (nostr.profiles as any)[pubkey];
          const profile = entry?.profile ?? entry ?? {};
          const alias = messenger.aliases[pubkey];
          const displayName =
            alias ||
            profile.display_name ||
            profile.name ||
            profile.displayName ||
            pubkey.slice(0, 8) + "…";
          const initials = displayName
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          return {
            pubkey,
            profile,
            displayName,
            initials,
            lastMsg: msgs[msgs.length - 1],
            pinned: messenger.pinned[pubkey] || false,
          };
        })
        .sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (b.pinned && !a.pinned) return 1;
          return (b.lastMsg?.created_at || 0) - (a.lastMsg?.created_at || 0);
        });
    });

    const connectedCount = computed(() => {
      if (!ndkRef.value) return 0;
      return Array.from(ndkRef.value.pool.relays.values()).filter(
        (r) => r.connected,
      ).length;
    });

    const totalRelays = computed(() => ndkRef.value?.pool.relays.size || 0);

    const nextReconnectIn = computed(() => {
      if (!ndkRef.value) return null;
      let earliest: number | null = null;
      ndkRef.value.pool.relays.forEach((r) => {
        if (r.status !== 5) {
          const nr = r.connectionStats.nextReconnectAt;
          if (nr && (earliest === null || nr < earliest)) earliest = nr;
        }
      });
      return earliest
        ? Math.max(0, Math.ceil((earliest - now.value) / 1000))
        : null;
    });

    watch(nextReconnectIn, (val) => {
      if (val === 0 && !messenger.connected && !connecting.value) {
        reconnectAll();
      }
    });

    watch(
      selected,
      (val) => {
        messenger.setCurrentConversation(val);
      },
      { immediate: true },
    );

    const selectConversation = (pubkey: string) => {
      selected.value = pubkey;
      messenger.markRead(pubkey);
      messenger.setCurrentConversation(pubkey);
    };

    const startChat = (pubkey: string) => {
      messenger.startChat(pubkey);
      selected.value = pubkey;
    };

    const sendMessage = (text: string) => {
      if (!selected.value || !text) return;
      messenger.sendDm(selected.value, text);
      draft.value = "";
    };

    function openSendTokenDialog() {
      if (!selected.value) return;
      (chatSendTokenDialogRef.value as any)?.show();
    }

    const attachFile = () => {
      // This is a placeholder for the file attachment logic
      $q.notify({ message: "File attachment not implemented yet.", type: "info" });
    };

    const copyNpub = (npub: string) => {
      copy(npub);
      $q.notify({
        message: "Copied public key to clipboard.",
        type: "positive",
      });
    };

    function openNewChatDialog() {
      (newChatDialogRef.value as any)?.show();
    }

    const reconnectAll = async () => {
      connecting.value = true;
      try {
        messenger.disconnect();
        messenger.started = false;
        await messenger.start();
      } catch (e) {
        console.error(e);
      } finally {
        connecting.value = false;
      }
    };

    const setupComplete = async () => {
      showSetupWizard.value = false;
      loading.value = true;
      await init();
    };

    return {
      loading,
      connecting,
      messenger,
      drawerOpen,
      selected,
      chatSendTokenDialogRef,
      newChatDialogRef,
      conversationSearch,
      messages,
      showSetupWizard,
      selectConversation,
      startChat,
      sendMessage,
      openSendTokenDialog,
      openNewChatDialog,
      reconnectAll,
      connectedCount,
      totalRelays,
      nextReconnectIn,
      setupComplete,
      miniList,
    };
  },
});
</script>
<style scoped>
.drawer-transition {
  transition: width 0.3s;
}

.drawer-content,
.mini-list q-avatar {
  transition: opacity 0.3s, transform 0.3s;
}

.drawer-collapsed .drawer-content {
  opacity: 0;
  transform: translateX(-20px);
}

.drawer-container {
  min-width: 0;
}

/* When the drawer is collapsed, only show the avatar */
.drawer-collapsed .conversation-item {
  padding: 8px;
  justify-content: center;
  overflow: hidden;
}

.drawer-collapsed .conversation-item .q-item-section:not([avatar]) {
  display: none;
}

.drawer-collapsed .conversation-item q-avatar {
  width: 40px;
  height: 40px;
}

@media (max-width: 320px) {
  .drawer-container .conversation-item q-avatar {
    width: 40px;
    height: 40px;
  }
  .drawer-container .conversation-item .snippet {
    display: none;
  }
}
</style>
