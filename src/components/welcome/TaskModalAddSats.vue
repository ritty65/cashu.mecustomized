<template>
  <q-dialog v-model="model">
    <q-card style="min-width:320px">
      <q-card-section class="text-h6">Add sats</q-card-section>
      <q-separator />
      <q-card-section class="q-gutter-sm">
        <q-btn
          unelevated
          color="primary"
          class="full-width"
          label="Deposit via Lightning"
          @click="deposit"
        />
        <q-btn
          unelevated
          color="primary"
          class="full-width"
          label="Paste Token"
          @click="paste"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useUiStore } from 'src/stores/ui'
import { useWalletStore } from 'src/stores/wallet'
import { useReceiveTokensStore } from 'src/stores/receiveTokensStore'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void; (e: 'done'): void }>()

const model = ref(props.modelValue)
watch(() => props.modelValue, v => (model.value = v))
watch(model, v => emit('update:modelValue', v))

const ui = useUiStore()
const wallet = useWalletStore()
const receive = useReceiveTokensStore()

function deposit() {
  wallet.invoiceData.amount = '' as any
  wallet.invoiceData.bolt11 = '' as any
  wallet.invoiceData.hash = '' as any
  wallet.invoiceData.memo = '' as any
  ui.showInvoiceDetails = true
  close()
}

function paste() {
  receive.receiveData.tokensBase64 = ''
  ui.showReceiveEcashDrawer = true
  close()
}

function close() {
  emit('done')
  model.value = false
}
</script>
