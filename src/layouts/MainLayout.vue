<template>
  <q-layout
    view="lHh Lpr lFf"
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'"
  >
    <MainHeader />
    <q-drawer
      v-model="messenger.drawerOpen"
      :mini="messenger.drawerMini"
      mini-width="80"
      :width="$q.screen.lt.md ? 300 : 340"
      side="left"
      show-if-above
      :breakpoint="600"
      bordered
      :behavior="$q.screen.lt.md ? 'mobile' : 'default'"
      :overlay="$q.screen.lt.md"
      :class="[
        'q-pa-md column messenger-drawer',
        { 'drawer-collapsed': messenger.drawerMini }
      ]"
      style="overflow-x: hidden"
    >
      <div class="column no-wrap full-height">
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
        <q-scroll-area class="col" style="min-height: 0; min-width: 0">
          <Suspense>
            <template #default>
              <ConversationList
                :selected-pubkey="messenger.currentConversation"
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
    </q-drawer>
    <q-page-container class="text-body1">
      <div class="max-w-7xl mx-auto">
        <router-view />
      </div>
    </q-page-container>
    <NewChatDialog ref="newChatDialogRef" @start="startChat" />
  </q-layout>
</template>

<script>
import { defineComponent, ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import MainHeader from "components/MainHeader.vue";
import ConversationList from "components/ConversationList.vue";
import UserInfo from "components/UserInfo.vue";
import NewChatDialog from "components/NewChatDialog.vue";
import { useNostrStore } from "src/stores/nostr";
import { useNutzapStore } from "src/stores/nutzap";
import { useMessengerStore } from "src/stores/messenger";

export default defineComponent({
  name: "MainLayout",
  mixins: [windowMixin],
  components: {
    MainHeader,
    ConversationList,
    UserInfo,
    NewChatDialog,
  },
  setup() {
    const messenger = useMessengerStore();
    const router = useRouter();
    const conversationSearch = ref("");
    const newChatDialogRef = ref(null);
    const $q = useQuasar();

    const openNewChatDialog = () => {
      newChatDialogRef.value?.show();
    };

    const selectConversation = (pubkey) => {
      messenger.markRead(pubkey);
      messenger.setCurrentConversation(pubkey);
      if ($q.screen.lt.md) {
        messenger.setDrawer(false);
      }
      if (router.currentRoute.value.path !== "/nostr-messenger") {
        router.push("/nostr-messenger");
      }
    };

    const startChat = (pubkey) => {
      messenger.startChat(pubkey);
      selectConversation(pubkey);
    };

    return {
      messenger,
      conversationSearch,
      newChatDialogRef,
      openNewChatDialog,
      selectConversation,
      startChat,
    };
  },
  async mounted() {
    const nostr = useNostrStore();
    await nostr.initSignerIfNotSet();
    const myHex = nostr.pubkey;
    useNutzapStore().initListener(myHex);
  },
});
</script>

<style scoped>
/* Prevent any internal content from creating side scroll inside this drawer */
.messenger-drawer :deep(.q-drawer__content) {
  overflow-x: hidden;
}
.messenger-drawer :deep(.q-scrollarea) {
  overflow-x: hidden;
}
/* Safety: let flex children shrink to avoid overflow */
.messenger-drawer :deep(.column),
.messenger-drawer :deep(.row),
.messenger-drawer :deep(.col) {
  min-width: 0;
  box-sizing: border-box;
}
</style>
