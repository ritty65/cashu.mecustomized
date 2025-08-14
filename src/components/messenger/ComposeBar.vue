<template>
  <q-input
    outlined
    dense
    v-model="draft"
    type="textarea"
    autogrow
    placeholder="Type a message…"
    @keyup.enter.exact="emitSend"
  >
    <template #prepend>
      <q-btn flat round dense icon="attach_file" @click="$emit('attach')" />
    </template>
    <template #append>
      <q-btn flat round dense icon="emoji_emotions" @click="$emit('emoji')" />
      <q-btn flat round dense @click="$emit('sendToken')">
        <NutIcon size="20" />
      </q-btn>
      <q-btn
        color="accent"
        round
        dense
        icon="send"
        @click="emitSend"
        :disable="!draft.trim()"
      />
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Nut as NutIcon } from "lucide-vue-next";

const draft = defineModel<string>({ default: "" });
const emit = defineEmits<{
  (e: "send", text: string): void;
  (e: "attach"): void;
  (e: "emoji"): void;
  (e: "sendToken"): void;
}>();
function emitSend() {
  const s = draft.value.trim();
  if (!s) return;
  emit("send", s);
  draft.value = "";
}
</script>

<style scoped>
/* increase icon hit area subtly */
:deep(.q-field__append .q-btn), :deep(.q-field__prepend .q-btn) { min-width: 36px; min-height: 36px; }
</style>
