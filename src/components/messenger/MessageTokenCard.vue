<template>
  <div class="token-card">
    <div class="row items-center q-col-gutter-sm">
      <q-chip dense>🔒 {{ amount }} sat</q-chip>
      <q-chip dense>{{ mintHost }}</q-chip>
    </div>
    <div v-if="memo" class="q-mt-xs text-caption"><b>Memo:</b> {{ memo }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { hostFromUrl } from "src/js/format";
const props = defineProps<{ amount: number|string; mint: string; memo?: string }>();
const mintHost = computed(() => hostFromUrl(props.mint));
</script>

<style scoped>
.token-card { overflow-wrap: anywhere; }
</style>
