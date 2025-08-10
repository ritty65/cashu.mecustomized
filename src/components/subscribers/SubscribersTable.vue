<script setup lang="ts">
import type { Subscriber } from 'src/types/subscriber';
const props = defineProps<{ subscribers: Subscriber[] }>();
const emit = defineEmits<{ (e: 'select', sub: Subscriber): void }>();
function onRowClick(sub: Subscriber) {
  emit('select', sub);
}
</script>

<template>
  <q-table
    flat
    :rows="props.subscribers"
    :columns="[
      { name: 'name', label: 'Subscriber', field: 'name', align: 'left' },
      { name: 'tier', label: 'Tier', field: 'tier' },
      { name: 'joinedAt', label: 'Since', field: 'joinedAt' }
    ]"
    row-key="id"
    @row-click="(_, row) => onRowClick(row)"
  >
    <template #body-cell-name="p">
      <q-td :props="p">
        <div class="row items-center q-gutter-sm">
          <q-avatar size="24px" icon="person" />
          <div class="ellipsis">{{ p.row.name || p.row.npub }}</div>
        </div>
      </q-td>
    </template>
    <template #no-data>
      <div class="q-pa-md">No subscribers</div>
    </template>
  </q-table>
</template>
