<template>
  <div
    class="q-my-xs flex column"
    :class="outgoing ? 'items-end' : 'items-start'"
  >
    <div :class="outgoing ? 'sent' : 'received'" :style="bubbleStyle">
      <div class="text-weight-bold">
        {{ summaryLine }}
      </div>
      <div class="q-mt-xs">{{ formattedAmount }}</div>
      <q-expansion-item dense expand-separator class="q-mt-sm" label="Token">
        <div class="token-string">{{ payload.token }}</div>
        <div class="row q-gutter-sm q-mt-sm">
          <q-btn flat dense color="primary" @click.stop="redeemToken"
            >Redeem</q-btn
          >
          <q-btn flat dense color="primary" @click.stop="copyToken"
            >Copy token</q-btn
          >
        </div>
      </q-expansion-item>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import token from 'src/js/token';
import { useClipboard } from 'src/composables/useClipboard';
import { useReceiveTokensStore } from 'src/stores/receiveTokensStore';
import { DEFAULT_BUCKET_ID } from 'src/stores/buckets';
import { useUiStore } from 'src/stores/ui';

const props = defineProps<{
  payload: any;
  outgoing?: boolean;
}>();

const $q = useQuasar();
const { copy } = useClipboard();
const receiveStore = useReceiveTokensStore();
const uiStore = useUiStore();

const decodedToken = computed(() => token.decode(props.payload.token));
const amount = computed(() => {
  const decoded = decodedToken.value;
  if (!decoded) return 0;
  return token.getProofs(decoded).reduce((s, p) => s + p.amount, 0);
});
const unit = computed(() => {
  const decoded = decodedToken.value;
  return decoded ? token.getUnit(decoded) : '';
});

const formattedAmount = computed(() =>
  uiStore.formatCurrency(amount.value, unit.value)
);

const summaryLine = computed(
  () =>
    `Subscription payment (month ${props.payload.month_index} of ${props.payload.total_months})`
);

const receivedStyle = computed(() => ({
  backgroundColor: $q.dark.isActive
    ? 'var(--q-secondary)'
    : 'var(--q-color-grey-2)',
  color: $q.dark.isActive ? '#ffffff' : '#000000',
}));

const bubbleStyle = computed(() => (props.outgoing ? {} : receivedStyle.value));

function redeemToken() {
  receiveStore.receiveToken(props.payload.token, DEFAULT_BUCKET_ID);
}

function copyToken() {
  copy(props.payload.token);
}
</script>

<style scoped>
.sent,
.received {
  padding: 16px;
  border-radius: 12px;
  max-width: 70%;
  word-break: break-word;
}

.sent {
  background-color: var(--q-primary);
  color: #ffffff;
}

.received {
  background-color: var(--q-secondary);
  color: #000000;
}

.token-string {
  word-break: break-all;
  font-family: monospace;
}
</style>

