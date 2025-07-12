<template>
  <div class="column items-center justify-center q-pa-xl text-grey-5">
     <q-icon name="inventory_2" size="72px" />
     <div class="text-subtitle2 q-mt-md">{{ $t('bucket.empty') }}</div>
     <q-btn color="primary" icon="add" class="q-mt-md"
            @click="$emit('add')" label="Add bucket"/>
  </div>
</template>

<script setup lang="ts">
defineEmits(['add'])
</script>

<style scoped></style>
