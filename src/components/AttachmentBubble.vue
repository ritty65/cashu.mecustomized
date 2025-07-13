<template>
  <div>
    <q-img
      v-if="isImage"
      :src="src"
      style="max-width: 300px; max-height: 300px"
    />
    <video
      v-else-if="isVideo"
      :src="src"
      controls
      style="max-width: 300px; max-height: 300px"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{ src: string; outgoing?: boolean }>();

const isImage = computed(() => props.src.startsWith('data:image/'));
const isVideo = computed(() => props.src.startsWith('data:video/'));
</script>
