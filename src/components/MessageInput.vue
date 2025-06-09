<template>
  <div class="row no-wrap items-center q-pa-sm">
    <q-input
      v-model="text"
      class="col"
      dense
      outlined
      @keyup.enter.prevent="onSend"
    />
    <q-btn
      flat
      round
      icon="send"
      color="primary"
      class="q-ml-sm"
      :disable="!text.trim()"
      @click="send"
      aria-label="Send message"/>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

const emit = defineEmits(['send']);
const text = ref('');

const onSend = (e: KeyboardEvent) => {
  if (!e.shiftKey) {
    send();
  }
};

const send = () => {
  const m = text.value.trim();
  if (m) {
    emit('send', m);
    text.value = '';
  }
};
</script>
