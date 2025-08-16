<template>
  <q-drawer
    v-model="ui.mainNavOpen"
    side="left"
    show-if-above
    :overlay="$q.screen.lt.md"
    :breakpoint="1024"
    bordered
    transition-show="slide-right"
    transition-hide="slide-left"
  >
    <q-list>
      <q-item-label header>{{ $t("MainHeader.menu.settings.title") }}</q-item-label>

      <q-item clickable @click="goto('/wallet')">
        <q-item-section avatar>
          <q-icon name="account_balance_wallet" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t("FullscreenHeader.actions.back.label") }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable @click="goto('/settings')">
        <q-item-section avatar>
          <q-icon name="settings" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t("MainHeader.menu.settings.settings.title") }}</q-item-label>
          <q-item-label caption>{{ $t("MainHeader.menu.settings.settings.caption") }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable @click="goto('/find-creators')">
        <q-item-section avatar>
          <q-icon name="img:icons/find-creators.svg" color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t("MainHeader.menu.findCreators.findCreators.title") }}</q-item-label>
          <q-item-label caption>{{ $t("MainHeader.menu.findCreators.findCreators.caption") }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable @click="goto('/creator-hub')">
        <q-item-section avatar>
          <q-icon name="img:icons/creator-hub.svg" color="white" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t("MainHeader.menu.creatorHub.title") }}</q-item-label>
          <q-item-label caption>{{ $t("MainHeader.menu.creatorHub.caption") }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable @click="goto('/my-profile')">
        <q-item-section avatar>
          <q-icon name="person" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t("MainHeader.menu.myProfile.myProfile.title") }}</q-item-label>
          <q-item-label caption>{{ $t("MainHeader.menu.myProfile.myProfile.caption") }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable @click="goto('/buckets')">
        <q-item-section avatar>
          <q-icon name="inventory_2" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t("MainHeader.menu.buckets.buckets.title") }}</q-item-label>
          <q-item-label caption>{{ $t("MainHeader.menu.buckets.buckets.caption") }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable @click="goto('/subscriptions')">
        <q-item-section avatar>
          <q-icon name="auto_awesome_motion" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t("MainHeader.menu.subscriptions.subscriptions.title") }}</q-item-label>
          <q-item-label caption>{{ $t("MainHeader.menu.subscriptions.subscriptions.caption") }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item clickable @click="goto('/nostr-messenger')">
        <q-item-section avatar>
          <q-icon name="chat" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Chats</q-item-label>
        </q-item-section>
      </q-item>

      <q-item v-if="needsNostrLogin" clickable @click="goto('/nostr-login')">
        <q-item-section avatar>
          <q-icon name="vpn_key" />
        </q-item-section>
        <q-item-section>
          <q-item-label>Setup Nostr Identity</q-item-label>
        </q-item-section>
      </q-item>

      <q-item-label header>{{ $t("MainHeader.menu.terms.title") }}</q-item-label>
      <q-item clickable @click="goto('/terms')">
        <q-item-section avatar>
          <q-icon name="gavel" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t("MainHeader.menu.terms.terms.title") }}</q-item-label>
          <q-item-label caption>{{ $t("MainHeader.menu.terms.terms.caption") }}</q-item-label>
        </q-item-section>
      </q-item>

      <q-item-label header>{{ $t("MainHeader.menu.about.title") }}</q-item-label>
      <q-item clickable @click="goto('/about')">
        <q-item-section avatar>
          <q-icon name="info" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ $t("MainHeader.menu.about.about.title") }}</q-item-label>
          <q-item-label caption>{{ $t("MainHeader.menu.about.about.caption") }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
  </q-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from 'src/stores/ui'
import { useNostrStore } from 'src/stores/nostr'

const ui = useUiStore()
const router = useRouter()
const needsNostrLogin = computed(() => !useNostrStore().privateKeySignerPrivateKey)

function goto(path: string) {
  router.push(path)
  ui.closeMainNav()
}
</script>

