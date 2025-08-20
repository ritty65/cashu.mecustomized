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
          :label="t('Welcome.mints.browse')"
          :disable="!recommendedMints.length"
          @click="showCatalog = true"
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
          <q-btn flat color="primary" class="q-mt-sm" :label="t('Welcome.mints.addAnother')" @click="addAnother" />
      </div>
      <q-dialog v-model="showCatalog">
        <q-card style="min-width:300px">
          <q-card-section>
            <div class="text-h6">{{ t('Welcome.mints.browse') }}</div>
          </q-card-section>
          <q-list>
            <q-item
              v-for="mint in recommendedMints"
              :key="mint.url"
              clickable
              @click="selectMint(mint.url)"
            >
              <q-item-section>{{ mint.label || mint.url }}</q-item-section>
            </q-item>
          </q-list>
            <q-card-actions align="right">
              <q-btn v-close-popup flat :label="t('global.actions.close.label')" />
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
  const catalogUrl =
    (process.env.MINT_CATALOG_URL as string) ||
    'https://mints.cashu.space/mints.json'
  try {
    let data: any[] = []
    try {
      const resp = await fetch(catalogUrl)
      if (!resp.ok) throw new Error('network')
      data = await resp.json()
    } catch {
      const resp = await fetch('/mints.json')
      if (!resp.ok) throw new Error('network')
      data = await resp.json()
    }
    const verified: { label?: string; url: string }[] = []
    for (const m of Array.isArray(data) ? data : []) {
      const mintUrl = m.url || m
      if (!mintUrl) continue
      try {
        const infoResp = await fetch(
          mintUrl.replace(/\/$/, '') + '/v1/info',
        )
        if (!infoResp.ok) continue
        const info = await infoResp.json()
        verified.push({
          url: mintUrl,
          label: info.name || m.label || mintUrl,
        })
      } catch {
        /* ignore unreachable mint */
      }
    }
    recommendedMints.value = verified
    if (!recommendedMints.value.length) {
      $q.notify({ type: 'negative', message: t('Welcome.mints.errorLoad') })
    }
  } catch {
    $q.notify({ type: 'negative', message: t('Welcome.mints.errorLoad') })
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
  const infoUrl = input.replace(/\/$/, '') + '/v1/info'
  let info: any
  try {
    const resp = await fetch(infoUrl)
    if (!resp.ok) throw new Error('network')
    info = await resp.json()
  } catch {
    error.value = t('Welcome.mints.errorUnreachable')
    loading.value = false
    return
  }
  try {
    const mint = await mints.addMint({ url: input, nickname: info.name }, true)
    connected.value.push(mint)
    welcome.mintConnected = true
    url.value = ''
  } catch {
    error.value = t('Welcome.mints.errorResponse')
  } finally {
    loading.value = false
  }
}

function addAnother() {
  url.value = ''
  error.value = ''
}

function selectMint(mintUrl: string) {
  showCatalog.value = false
  url.value = mintUrl
  connect()
}
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
