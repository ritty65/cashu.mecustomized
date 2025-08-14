<template>
  <q-scroll-area class="col column q-pa-md">
    <div
      v-if="messages.length === 0"
      class="col flex flex-center text-grey-6 empty-placeholder"
    >
      <q-icon name="chat_bubble_outline" size="48px" class="q-mb-sm" />
      <div class="text-subtitle1">No messages yet</div>
      <div class="text-caption">Select a conversation to start chatting</div>
    </div>
    <q-virtual-scroll
      v-else
      ref="virtScroll"
      :items="messages"
      virtual-scroll-slice-size="30"
      class="col"
    >
      <template #default="{ item: msg, index: idx }">
        <div
          v-if="showDateSeparator(idx)"
          class="text-caption text-center q-my-md divider-text"
        >
          {{ formatDay(msg.created_at) }}
        </div>
        <ChatMessageBubble :message="msg" :delivery-status="msg.status" />
      </template>
    </q-virtual-scroll>
  </q-scroll-area>
</template>

<script lang="ts" setup>
import { nextTick, ref, watch } from "vue";
import type { MessengerMessage } from "src/stores/messenger";
import ChatMessageBubble from "./ChatMessageBubble.vue";

const props = defineProps<{ messages: MessengerMessage[] }>();
const virtScroll = ref<any>();

function formatDay(ts: number) {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString();
}

function showDateSeparator(idx: number) {
  if (idx === 0) return true;
  const prev = props.messages[idx - 1];
  const prevDay = new Date(prev.created_at * 1000).toDateString();
  const currDay = new Date(
    props.messages[idx].created_at * 1000,
  ).toDateString();
  return prevDay !== currDay;
}

watch(
  () => props.messages,
  () => {
    nextTick(() =>
      virtScroll.value?.scrollTo(props.messages.length - 1),
    );
  },
  { deep: true },
);

const formatDate = (ts: number) => new Date(ts * 1000).toLocaleString();

defineExpose({ formatDay, showDateSeparator });
</script>

<style scoped>
.empty-placeholder {
  min-height: 150px;
  text-align: center;
}
</style>
