<template>
  <q-header elevated class="app-header">
    <q-toolbar class="main-toolbar" dense>
      <!-- LEFT GROUP: Expand/Collapse + App Menu -->
      <div class="row items-center no-wrap left-group">
        <q-btn
          flat round dense
          :icon="$q.screen.lt.md ? 'menu' : 'menu_open'"
          @click="toggleChats()"
          :aria-label="$q.screen.lt.md ? 'Open chats' : (messenger.drawerMini ? 'Expand chats' : 'Collapse chats')"
          data-test="btn-toggle-chats"
        >
          <q-tooltip>{{ $q.screen.lt.md ? 'Open chats' : (messenger.drawerMini ? 'Expand chats' : 'Collapse chats') }}</q-tooltip>
        </q-btn>

        <q-btn
          flat round dense
          icon="apps"
          @click="menu = true"
          aria-label="Open app menu"
          data-test="btn-app-menu"
          ref="btnMenu"
        >
          <q-tooltip>App menu</q-tooltip>
        </q-btn>

        <!-- Compact app menu with key routes -->
        <q-menu
          v-model="menu"
          anchor="bottom left"
          self="top left"
          :fit="true"
          :offset="[0, 6]"
        >
          <q-list style="min-width: 220px" dense>
            <q-item clickable v-ripple @click="goTo('/', true)">
              <q-item-section avatar><q-icon name="home" /></q-item-section>
              <q-item-section>Home</q-item-section>
            </q-item>
            <q-item clickable v-ripple @click="goTo('/nostr-messenger', true)">
              <q-item-section avatar><q-icon name="chat" /></q-item-section>
              <q-item-section>Chats</q-item-section>
            </q-item>
            <q-item clickable v-ripple @click="goTo('/find-creators', true)">
              <q-item-section avatar><q-icon name="groups" /></q-item-section>
              <q-item-section>Find creators</q-item-section>
            </q-item>
            <q-item clickable v-ripple @click="goTo('/subscriptions', true)">
              <q-item-section avatar><q-icon name="subscriptions" /></q-item-section>
              <q-item-section>Subscriptions</q-item-section>
            </q-item>
            <q-separator />
            <q-item clickable v-ripple @click="goTo('/wallet', true)">
              <q-item-section avatar><q-icon name="account_balance_wallet" /></q-item-section>
              <q-item-section>Wallet</q-item-section>
            </q-item>
            <q-item clickable v-ripple @click="goTo('/settings', true)">
              <q-item-section avatar><q-icon name="settings" /></q-item-section>
              <q-item-section>Settings</q-item-section>
            </q-item>
            <q-item clickable v-ripple @click="goTo('/about', true)">
              <q-item-section avatar><q-icon name="info" /></q-item-section>
              <q-item-section>About</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </div>

      <q-space />

      <!-- CENTER: Title (ellipsis so it never overlaps) -->
      <div class="toolbar-title ellipsis">
        {{ pageTitle }}
      </div>

      <q-space />

      <!-- RIGHT GROUP: keep whatever you already had (status/dark/reload etc.) -->
      <div class="row items-center no-wrap right-group">
        <!-- existing right-side buttons / badges remain unchanged -->
        <slot name="right" />
      </div>
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMessengerStore } from 'src/stores/messenger'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()
const messenger = useMessengerStore()

const menu = ref(false)
const btnMenu = ref()

// Title logic: prefer route meta title; fallback to route name; final fallback string
const pageTitle = computed(() => {
  return (route.meta && (route.meta as any).title) || route.name || 'Nostr Messenger'
})

function toggleChats () {
  if ($q.screen.lt.md) {
    messenger.setDrawer(!messenger.drawerOpen)
  } else {
    messenger.toggleDrawer()
  }
}

function goTo (path: string, closeMenu = false) {
  if (closeMenu) menu.value = false
  if (route.path !== path) router.push(path)
}
</script>

<style scoped>
/* Keep things compact and well-aligned */
.app-header { backdrop-filter: saturate(1.2) blur(6px); }
.main-toolbar { padding-inline: 8px; min-height: 48px; }

.left-group,
.right-group {
  gap: 4px;
}

.toolbar-title {
  font-weight: 600;
  max-width: min(52vw, 560px);
  text-align: center;
}

/* Very small screens: keep it tidy */
@media (max-width: 360px) {
  .toolbar-title { max-width: 44vw; font-size: 0.95rem; }
}
</style>

