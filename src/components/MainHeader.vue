<template>
  <q-header class="bg-transparent">
    <q-toolbar class="app-toolbar app-toolbar--grid" dense>
      <div class="left-controls row items-center no-wrap">
        <template v-if="showBackButton">
          <q-btn
            flat
            dense
            round
            icon="arrow_back_ios_new"
            :to="backRoute"
            color="primary"
            aria-label="Back"
          />
          <q-btn
            flat
            dense
            round
            icon="menu"
            color="primary"
            aria-label="Open main menu"
            :aria-expanded="String(ui.mainNavOpen)"
            aria-controls="app-nav"
            @click="ui.toggleMainNav"
            :disable="ui.globalMutexLock"
          />
        </template>
        <q-btn
          v-else
          flat
          dense
          round
          icon="menu"
          color="primary"
          aria-label="Open main menu"
          :aria-expanded="String(ui.mainNavOpen)"
          aria-controls="app-nav"
          @click="ui.toggleMainNav"
          :disable="ui.globalMutexLock"
        />
        <q-btn
          v-if="isMessengerPage"
          flat
          dense
          round
          :icon="messenger.drawerMini ? 'menu' : 'menu_open'"
          :color="$q.dark.isActive ? 'white' : 'primary'"
          aria-label="Toggle chat menu"
          @click.stop="toggleMessengerDrawer"
          class="q-ml-xs"
        />
      </div>

      <q-toolbar-title class="app-title">{{ currentTitle }}</q-toolbar-title>

      <div class="right-controls row items-center no-wrap">
        <transition
          appear
          enter-active-class="animated wobble"
          leave-active-class="animated fadeOut"
        >
          <q-badge
            v-if="g.offline"
            color="red"
            text-color="black"
            class="q-mr-sm"
          >
            <span>{{ $t("MainHeader.offline.warning.text") }}</span>
          </q-badge>
        </transition>
        <q-badge
          v-if="isStaging()"
          color="yellow"
          text-color="black"
          class="q-mr-sm"
        >
          <span>{{ $t("MainHeader.staging.warning.text") }}</span>
        </q-badge>
        <!-- <q-badge color="yellow" text-color="black" class="q-mr-sm">
          <span v-if="!isStaging()">Beta</span>
          <span v-else>Staging – don't use with real funds!</span>
        </q-badge> -->
        <transition-group appear enter-active-class="animated pulse">
          <q-badge
            v-if="countdown > 0"
            color="negative"
            text-color="white"
            class="q-mr-sm"
            @click="reload"
          >
            {{ $t("MainHeader.reload.warning.text", { countdown }) }}
            <q-spinner
              v-if="countdown > 0"
              size="0.8em"
              :thickness="10"
              class="q-ml-sm"
              color="white"
            />
          </q-badge>
        </transition-group>
        <q-btn
          flat
          dense
          round
          size="0.8em"
          :icon="countdown > 0 ? 'close' : 'refresh'"
          :color="countdown > 0 ? 'negative' : 'primary'"
          aria-label="Refresh"
          @click.stop="reload"
          :loading="reloading"
          :disable="ui.globalMutexLock && countdown === 0"
        >
          <q-tooltip>{{ $t("MainHeader.reload.tooltip") }}</q-tooltip>
          <template v-slot:loading>
            <q-spinner size="xs" />
          </template>
        </q-btn>
        <q-btn
          flat
          dense
          round
          size="0.8em"
          :icon="darkIcon"
          color="primary"
          aria-label="Toggle Dark Mode"
          @click.stop="toggleDarkMode"
          class="q-ml-sm"
        />
      </div>
    </q-toolbar>
  </q-header>

</template>

<script>
import { defineComponent, ref, computed, getCurrentInstance } from "vue";
import { useRoute } from "vue-router";
import { useUiStore } from "src/stores/ui";
import { useMessengerStore } from "src/stores/messenger";
import { useQuasar } from "quasar";

export default defineComponent({
  name: "MainHeader",
  mixins: [windowMixin],
  setup() {
    const vm = getCurrentInstance()?.proxy;
    const ui = useUiStore();
    const route = useRoute();
    const messenger = useMessengerStore();
    const $q = useQuasar();
    const toggleDarkMode = () => {
      console.log("toggleDarkMode", $q.dark.isActive);
      $q.dark.toggle();
      $q.localStorage.set("cashu.darkMode", $q.dark.isActive);
      vm?.notifySuccess(
        $q.dark.isActive ? "Dark mode enabled" : "Dark mode disabled",
      );
    };
    const darkIcon = computed(() =>
      $q.dark.isActive ? "wb_sunny" : "brightness_3",
    );
    const isMessengerPage = computed(() =>
      route.path.startsWith("/nostr-messenger"),
    );
    const showBackButton = computed(
      () => isMessengerPage.value && $q.screen.lt.md,
    );
    const backRoute = computed(() => "/wallet");
    const currentTitle = computed(() => {
      if (isMessengerPage.value) return "Nostr Messenger";
      if (route.path.startsWith("/wallet")) return "Wallet";
      return "Cashu";
    });
    const countdown = ref(0);
    const reloading = ref(false);
    let countdownInterval;


    const toggleMessengerDrawer = () => {
      console.log("toggleMessengerDrawer", messenger.drawerMini);
      messenger.toggleDrawer();
      vm?.notify(
        messenger.drawerMini ? "Messenger collapsed" : "Messenger expanded",
      );
    };

    const isStaging = () => {
      return location.host.includes("staging");
    };

    const reload = () => {
      console.log(
        "reload",
        "countdown:",
        countdown.value,
        "mutex:",
        ui.globalMutexLock,
      );
      if (countdown.value > 0) {
        try {
          clearInterval(countdownInterval);
          countdown.value = 0;
          reloading.value = false;
          vm?.notifyWarning("Reload cancelled");
        } finally {
          ui.unlockMutex();
        }
        return;
      }
      if (ui.globalMutexLock) return;
      ui.lockMutex();
      reloading.value = true;
      countdown.value = 3;
      vm?.notify("Reloading in 3 seconds…");
      countdownInterval = setInterval(() => {
        countdown.value--;
        if (countdown.value === 0) {
          clearInterval(countdownInterval);
          vm?.notifyRefreshed("Reloading…");
          try {
            location.reload();
          } finally {
            ui.unlockMutex();
          }
        }
      }, 1000);
    };

    return {
      isStaging,
      reload,
      countdown,
      reloading,
      ui,
      showBackButton,
      backRoute,
      currentTitle,
      toggleMessengerDrawer,
      isMessengerPage,
      toggleDarkMode,
      darkIcon,
    };
  },
});
</script>
<style scoped>
.q-header {
  position: sticky;
  top: 0;
  /* Keep header above Quasar drawer/scrim layers on mobile overlays */
  z-index: 11000;
  overflow-x: hidden;
}

.app-toolbar {
  padding-inline: 8px;
  min-height: 48px;
}

.app-toolbar--grid {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
}

.app-title {
  text-align: center;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.left-controls,
.right-controls {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
