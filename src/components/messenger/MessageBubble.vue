<template>
  <div :class="['bubble', outgoing ? 'bubble--out' : 'bubble--in']">
    <slot />
    <div class="bubble-meta text-caption text-secondary">{{ meta }}</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ outgoing?: boolean; meta?: string }>();
</script>

<style scoped>
.bubble {
  max-width: min(72ch, 70%);
  border-radius: 12px;
  padding: 12px;
  margin: 8px 0;
}
.bubble--out {
  background: rgba(var(--q-color-accent-rgb, 124, 77, 255), .16);
  border: 1px solid rgba(var(--q-color-accent-rgb, 124, 77, 255), .35);
}
.bubble--in {
  background: rgba(255,255,255,.05);
  border: 1px solid rgba(255,255,255,.12);
}
.bubble-meta { margin-top: 6px; text-align: right; }
</style>
