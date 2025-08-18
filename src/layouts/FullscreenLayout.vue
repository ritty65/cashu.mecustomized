<template>
  <q-layout
    view="lHh Lpr lFf"
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'"
  >
    <MainHeader />
    <AppNavDrawer v-model="ui.mainNavOpen" />
    <q-page-container class="text-body1">
      <router-view />
    </q-page-container>
    <PublishBar
      v-if="loggedIn && showPublishBar"
      :publishing="publishing"
      @publish="publishFullProfile"
    />
  </q-layout>
</template>

<script>
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import MainHeader from "components/MainHeader.vue";
import AppNavDrawer from "components/AppNavDrawer.vue";
import PublishBar from "components/PublishBar.vue";
import { useCreatorHub } from "src/composables/useCreatorHub";
import { useUiStore } from "src/stores/ui";

export default defineComponent({
  name: "FullscreenLayout",
  mixins: [windowMixin],
  components: {
    MainHeader,
    AppNavDrawer,
    PublishBar,
  },
  setup() {
    const { loggedIn, publishFullProfile, publishing } = useCreatorHub();
    const route = useRoute();
    const showPublishBar = computed(() => route.path === "/creator-hub");
    const ui = useUiStore();
    return { loggedIn, publishFullProfile, publishing, showPublishBar, ui };
  },
});
</script>
