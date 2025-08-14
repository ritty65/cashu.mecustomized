<template>
  <div class="row items-center justify-between q-px-md q-pt-sm q-pb-xs">
    <div class="row items-center min-w-0">
      <q-btn flat dense round icon="menu" @click="$emit('toggleDrawer')" />
      <q-avatar size="28px" class="q-ml-sm"><img v-if="avatar" :src="avatar" /></q-avatar>
      <div class="q-ml-sm min-w-0">
        <div class="ellipsis">{{ displayName }}</div>
        <div class="text-caption" :class="online ? 'text-positive' : 'text-grey-6'">
          {{ online ? 'Online' : 'Offline' }}
        </div>
      </div>
      <q-btn
        flat dense round size="sm" icon="content_copy" class="q-ml-xs"
        :title="npub" @click="$emit('copy', npub)"
      />
    </div>

    <div class="row items-center q-gutter-sm">
      <q-btn flat dense round icon="sync" @click="$emit('refresh')" />
      <q-btn flat dense round icon="more_vert" @click="$emit('menu')" />
      <q-btn flat dense round icon="settings" @click="$emit('settings')" />
    </div>
  </div>

  <q-linear-progress
    v-if="connecting"
    size="2px"
    :value="progress"
    color="accent"
    class="q-mx-md q-mb-xs"
  />
</template>

<script setup lang="ts">
import { computed } from "vue";
import { shortNpub } from "src/js/format";
const props = defineProps<{ name?: string; npub?: string; avatar?: string; online?: boolean; connecting?: boolean; progress?: number }>();
const displayName = computed(() => props.name || shortNpub(props.npub || ""));
</script>

<style scoped>
.min-w-0 { min-width: 0 }
.ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
