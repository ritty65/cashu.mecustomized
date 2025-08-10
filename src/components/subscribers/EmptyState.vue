<template>
  <div class="q-pa-xl text-center">
    <div class="text-h6 q-mb-xs">{{ title }}</div>
    <div class="text-caption text-grey-6 q-mb-md">{{ subtitle }}</div>
    <div class="row justify-center q-gutter-sm">
      <q-btn v-if="onRetry" size="sm" outline icon="refresh" label="Retry" @click="onRetry()" />
      <q-btn v-if="showConnect" size="sm" color="primary" icon="link" label="Connect data source" @click="emit('connect')" />
    </div>
  </div>
</template>
<script setup lang="ts">
const props = withDefaults(defineProps<{
  title?: string; subtitle?: string; showConnect?: boolean; onRetry?: () => void
}>(), { title: 'No subscribers found', subtitle: ''});
const emit = defineEmits<{(e:'connect'):void}>();
</script>
