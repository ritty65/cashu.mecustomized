<template>
  <q-layout
    view="lHh Lpr lFf"
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'"
  >
    <MainHeader />
    <q-drawer
      v-model="messenger.drawerOpen"
      side="left"
      show-if-above
      :breakpoint="600"
      bordered
      :class="$q.screen.gt.xs ? 'q-pa-lg column' : 'q-pa-md column'"
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
        <q-scroll-area class="col" style="min-height: 0">
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

    const openNewChatDialog = () => {
      newChatDialogRef.value?.show();
    };

    const selectConversation = (pubkey) => {
      messenger.markRead(pubkey);
      messenger.setCurrentConversation(pubkey);
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
