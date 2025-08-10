<script setup lang="ts">
import type { Subscriber } from 'src/types/subscriber';

const props = defineProps<{ subscriber: Subscriber }>();
const emit = defineEmits<{ (e: 'select'): void }>();
</script>

<template>
  <q-card class="q-pa-sm cursor-pointer" @click="emit('select')">
    <div class="text-subtitle2">
      {{ props.subscriber.name || props.subscriber.npub }}
    </div>
    <div class="text-caption text-grey">{{ props.subscriber.tier }}</div>
    <div class="text-caption">{{ props.subscriber.joinedAt }}</div>
  </q-card>
</template>
