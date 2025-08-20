<template>
  <q-dialog v-model="model">
    <q-card style="min-width:320px">
      <q-card-section class="text-h6">Choose a Mint</q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-sm">
        <q-btn
          unelevated
          color="primary"
          class="full-width"
          label="Use Recommended Mint"
          @click="useRecommended"
        />
        <q-input v-model="customUrl" label="Custom Mint URL" />
        <q-btn
          unelevated
          color="primary"
          class="full-width q-mt-sm"
          :disable="!customUrl"
          label="Add Mint"
          @click="useCustom"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useMintsStore } from 'src/stores/mints'
import { useWelcomeStore } from 'src/stores/welcome'

const DEFAULT_MINT_URL = 'https://mint.example.com'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'done'): void }>()

const model = ref(props.modelValue)
watch(() => props.modelValue, v => (model.value = v))
watch(model, v => emit('update:modelValue', v))

const customUrl = ref('')

async function useRecommended() {
  const welcome = useWelcomeStore()
  const mints = useMintsStore()
  const url = welcome.recommendedMintUrl || DEFAULT_MINT_URL
  await mints.addMint(url)
  await mints.activateMintUrl(url)
  close()
}

async function useCustom() {
  const mints = useMintsStore()
  const url = customUrl.value.trim()
  if (!url) return
  await mints.addMint(url)
  await mints.activateMintUrl(url)
  close()
}

function close() {
  emit('done')
  model.value = false
}
</script>
