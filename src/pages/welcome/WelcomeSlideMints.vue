<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center" style="max-width: 400px">
      <q-icon name="factory" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ t('Welcome.mints.title') }}
      </h1>
      <p class="q-mt-sm">{{ t('Welcome.mints.lead') }}</p>
      <p class="text-caption q-mt-sm">{{ t('Welcome.mints.primer') }}</p>
      <div class="q-mt-sm">
        <q-btn
          flat
          dense
          icon="factory"
          @click="showCatalog = true"
          :label="t('Welcome.mints.browse')"
          :disable="!recommendedMints.length"
        />
      </div>
      <q-form class="q-mt-md" @submit.prevent="connect">
        <q-input v-model="url" :placeholder="t('Welcome.mints.placeholder')" autocomplete="off" />
        <div v-if="error" class="text-negative text-caption q-mt-xs">{{ error }}</div>
        <q-btn color="primary" class="q-mt-md" :loading="loading" type="submit" :label="t('Welcome.mints.connect')" />
      </q-form>
      <div v-if="connected.length" class="q-mt-md">
        <div v-for="m in connected" :key="m.url" class="row items-center justify-center q-my-xs">
          <q-icon name="check" color="positive" class="q-mr-sm" />
          <span>{{ m.nickname || m.url }}</span>
        </div>
        <q-btn flat color="primary" class="q-mt-sm" @click="addAnother" :label="t('Welcome.mints.addAnother')" />
      </div>
      <q-dialog v-model="showCatalog">
        <q-card style="min-width:300px">
          <q-card-section>
            <div class="text-h6">{{ t('Welcome.mints.browse') }}</div>
          </q-card-section>
          <q-card-section>
            <MintGallery @selected="gallerySelected" />
          </q-card-section>
          <q-card-actions align="right">
            <q-btn flat :label="t('global.actions.close.label')" v-close-popup />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import MintGallery from 'src/components/welcome/MintGallery.vue'
import { useWelcomeStore } from 'src/stores/welcome'
import { useMintsStore } from 'src/stores/mints'

const { t } = useI18n()
const $q = useQuasar()
const welcome = useWelcomeStore()
const mints = useMintsStore()
const id = 'welcome-mints-title'
const url = ref((process.env.RECOMMENDED_MINT_URL as string) || '')
const error = ref('')
const loading = ref(false)
const connected = ref<any[]>([])
const showCatalog = ref(false)
const recommendedMints = ref<{ label?: string; url: string }[]>([])

async function loadRecommendedMints() {
  try {
    const base = new URL(import.meta.env.BASE_URL, window.location.origin)
    const resp = await fetch(new URL('mints.json', base).toString())
    if (!resp.ok) throw new Error('network')
    const data = await resp.json()
    recommendedMints.value = Array.isArray(data) ? data : []
    if (!recommendedMints.value.length && process.env.RECOMMENDED_MINTS) {
      recommendedMints.value = (process.env.RECOMMENDED_MINTS as string)
        .split(',')
        .map((u) => ({ url: u.trim() }))
    }
    if (!recommendedMints.value.length && process.env.RECOMMENDED_MINT_URL) {
      recommendedMints.value.push({ url: process.env.RECOMMENDED_MINT_URL as string })
    }
  } catch (err) {
    console.error('Failed to load recommended mints', err)
    if (process.env.RECOMMENDED_MINTS) {
      recommendedMints.value = (process.env.RECOMMENDED_MINTS as string)
        .split(',')
        .map((u) => ({ url: u.trim() }))
    } else if (process.env.RECOMMENDED_MINT_URL) {
      recommendedMints.value.push({ url: process.env.RECOMMENDED_MINT_URL as string })
    } else {
      $q.notify({ type: 'negative', message: t('Welcome.mints.errorLoad') })
    }
  }
}

onMounted(() => {
  if (mints.mints.length > 0) {
    welcome.mintConnected = true
    connected.value = [...mints.mints]
  }
  loadRecommendedMints()
})

async function connect() {
  error.value = ''
  let input = url.value.trim()
  if (!input) {
    error.value = t('Welcome.mints.errorInvalid')
    return
  }
  if (!/^https?:\/\//i.test(input)) {
    input = 'https://' + input
  }
  if (/\s/.test(input) || !input.includes('.')) {
    error.value = t('Welcome.mints.errorInvalid')
    return
  }
  loading.value = true
  try {
    const mint = await mints.addMint({ url: input }, true)
    connected.value.push(mint)
    welcome.mintConnected = true
    url.value = ''
  } catch (e) {
    console.error('Failed to connect to mint', e)
    error.value = t('Welcome.mints.errorUnreachable')
  } finally {
    loading.value = false
  }
}

function addAnother() {
  url.value = ''
  error.value = ''
}

function gallerySelected() {
  showCatalog.value = false
  connected.value = [...mints.mints]
  if (connected.value.length) {
    welcome.mintConnected = true
  }
}
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
