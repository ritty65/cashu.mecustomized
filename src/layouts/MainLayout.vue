<template>
  <q-layout
    view="lHh Lpr lFf"
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'"
  >
    <MainHeader />
    <q-page-container class="text-body1">
      <div :class="containerClass">
        <router-view />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script>
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import MainHeader from "components/MainHeader.vue";
import { useNostrStore } from "src/stores/nostr";
import { useNutzapStore } from "src/stores/nutzap";

export default defineComponent({
  name: "MainLayout",
  mixins: [windowMixin],
  components: {
    MainHeader,
  },
  setup() {
    const route = useRoute();
    const containerClass = computed(() =>
      route.path.startsWith("/nostr-messenger") ? "" : "max-w-7xl mx-auto",
    );
    return { containerClass };
  },
  async mounted() {
    const nostr = useNostrStore();
    await nostr.initSignerIfNotSet();
    const myHex = nostr.pubkey;
    useNutzapStore().initListener(myHex);
  },
});
</script>
