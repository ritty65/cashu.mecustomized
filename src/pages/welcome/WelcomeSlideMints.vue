<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center" style="max-width: 400px">
      <q-icon name="factory" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ t('Welcome.mints.title') }}
      </h1>
      <p class="q-mt-sm">{{ t('Welcome.mints.lead') }}</p>
      <q-form class="q-mt-md" @submit.prevent="connect">
        <q-input v-model="url" :placeholder="t('Welcome.mints.placeholder')" autocomplete="off"/>
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
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useWelcomeStore } from 'src/stores/welcome'
import { useMintsStore } from 'src/stores/mints'

const { t } = useI18n()
const welcome = useWelcomeStore()
const mints = useMintsStore()
const id = 'welcome-mints-title'
const url = ref('')
const error = ref('')
const loading = ref(false)
const connected = ref<any[]>([])

onMounted(() => {
  if (mints.mints.length > 0) {
    welcome.mintConnected = true
    connected.value = [...mints.mints]
  }
})

async function connect() {
  error.value = ''
  loading.value = true
  try {
    const mint = await mints.addMint({ url: url.value.trim() }, true)
    connected.value.push(mint)
    welcome.mintConnected = true
    url.value = ''
  } catch (e) {
    error.value = t('Welcome.mints.error')
  } finally {
    loading.value = false
  }
}

function addAnother() {
  url.value = ''
}
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
