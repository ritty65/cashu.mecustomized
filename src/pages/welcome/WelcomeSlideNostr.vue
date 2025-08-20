<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center" style="max-width:400px">
      <q-icon name="badge" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">{{ t('Welcome.nostr.title') }}</h1>
      <p class="q-mt-sm">{{ t('Welcome.nostr.lead') }}</p>
      <div class="q-gutter-y-md q-mt-md">
        <q-btn
          v-if="hasNip07"
          color="primary"
          :label="t('Welcome.nostr.connect')"
          @click="connectNip07"
        />
        <q-btn color="primary" :label="t('Welcome.nostr.generate')" @click="generate" />
        <q-form @submit.prevent="importKey">
          <q-input v-model="nsec" :label="t('Welcome.nostr.importPlaceholder')" autocomplete="off" />
          <div v-if="error" class="text-negative text-caption">{{ error }}</div>
          <q-btn class="q-mt-sm" color="primary" type="submit" :disable="!nsec" :label="t('Welcome.nostr.import')" />
        </q-form>
        <div v-if="npub" class="text-positive text-caption">{{ npub }}</div>
        <q-btn flat color="primary" @click="skip" :label="t('Welcome.nostr.skip')" />
      </div>
      <NostrBackupDialog v-model="showBackup" :nsec="backupNsec" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useNostrStore } from 'src/stores/nostr'
import { useWelcomeStore } from 'src/stores/welcome'
import NostrBackupDialog from 'src/components/welcome/NostrBackupDialog.vue'
import { nip19 } from 'nostr-tools'
import { hexToBytes } from '@noble/hashes/utils'

const { t } = useI18n()
const nostr = useNostrStore()
const welcome = useWelcomeStore()
const id = 'welcome-nostr-title'

const nsec = ref('')
const error = ref('')
const npub = ref('')
const showBackup = ref(false)
const backupNsec = ref('')

const hasNip07 = computed(() => typeof window !== 'undefined' && !!(window as any).nostr?.getPublicKey)

async function connectNip07() {
  error.value = ''
  try {
    const pk = await (window as any).nostr.getPublicKey()
    await nostr.connectBrowserSigner()
    nostr.setPubkey(pk)
    welcome.nostrSetupCompleted = true
    npub.value = nostr.npub
  } catch (e) {
    error.value = t('Welcome.nostr.errorConnect')
  }
}

async function generate() {
  error.value = ''
  await nostr.initWalletSeedPrivateKeySigner()
  welcome.nostrSetupCompleted = true
  npub.value = nostr.npub
  backupNsec.value = nostr.activePrivateKeyNsec
  showBackup.value = true
}

async function importKey() {
  error.value = ''
  const input = nsec.value.trim()
  let nsecToUse = ''
  if (input.startsWith('nsec1')) {
    try {
      nip19.decode(input)
      nsecToUse = input
    } catch {
      error.value = t('Welcome.nostr.errorInvalid')
      return
    }
  } else if (/^[0-9a-fA-F]{64}$/.test(input)) {
    try {
      nsecToUse = nip19.nsecEncode(hexToBytes(input))
    } catch {
      error.value = t('Welcome.nostr.errorInvalid')
      return
    }
  } else {
    error.value = t('Welcome.nostr.errorInvalid')
    return
  }
  try {
    await nostr.initPrivateKeySigner(nsecToUse)
    welcome.nostrSetupCompleted = true
    npub.value = nostr.npub
    backupNsec.value = nostr.activePrivateKeyNsec
    showBackup.value = true
    nsec.value = ''
  } catch {
    error.value = t('Welcome.nostr.errorInvalid')
  }
}

function skip() {
  nsec.value = ''
  error.value = ''
  npub.value = ''
}
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
