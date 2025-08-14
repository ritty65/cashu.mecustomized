<template>
  <q-item clickable dense class="h-14">
    <!-- Left: avatar + presence -->
    <q-item-section avatar>
      <q-avatar size="36px">
        <img v-if="avatar" :src="avatar" alt="" />
        <span v-else>{{ initials }}</span>
      </q-avatar>
      <div class="presence-dot" :class="online ? 'bg-positive' : 'bg-grey-6'"></div>
    </q-item-section>

    <!-- Middle: name + preview (flex, min-w-0) -->
    <q-item-section class="min-w-0">
      <q-item-label class="ellipsis text-no-wrap">{{ displayName }}</q-item-label>
      <q-item-label
        v-show="$q.screen.gt.xs"
        caption
        class="ellipsis text-no-wrap text-secondary"
      >
        {{ preview }}
      </q-item-label>
    </q-item-section>

    <!-- Right: time + actions (fixed width) -->
    <q-item-section side top class="w-16 text-right">
      <div class="text-caption text-secondary">{{ timeAgo }}</div>
      <div class="row items-center justify-end q-gutter-xs">
        <q-icon name="grade" size="16px" :class="starred ? 'text-amber' : 'text-grey-6'" />
        <q-icon name="more_vert" size="16px" />
      </div>
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { shortNpub, previewText } from "src/js/format";

const props = defineProps<{
  name?: string;
  npub?: string;
  lastMessage?: string;
  timeAgo?: string;
  avatar?: string;
  online?: boolean;
  starred?: boolean;
}>();

const displayName = computed(() => props.name || shortNpub(props.npub || ""));
const preview = computed(() => previewText(props.lastMessage || ""));
const initials = computed(() => (props.name || props.npub || "?").slice(0, 1).toUpperCase());
</script>

<style scoped>
.min-w-0 { min-width: 0; }
.ellipsis { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.presence-dot {
  position: absolute; right: 0; bottom: 0; width: 8px; height: 8px; border-radius: 9999px;
  border: 2px solid var(--q-dark-page, #121212);
}
</style>
