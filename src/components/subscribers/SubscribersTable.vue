<template>
  <q-table
    v-bind="$attrs"
    flat
    :rows="rows"
    row-key="id"
    selection="multiple"
    v-model:selected="selected"
    :columns="visibleColumns"
    :rows-per-page-options="[10,25,50]"
    :dense="density === 'compact'"
    :class="['density--' + density]"
    virtual-scroll
    :virtual-scroll-item-size="56"
    :virtual-scroll-sticky-size-start="42"
  >
    <template #top-right>
      <q-btn dense flat icon="view_column" aria-label="Columns" @click="colMenu=true" />
      <q-menu v-model="colMenu" anchor="bottom right" self="top right">
        <q-list dense style="min-width:220px">
          <q-item v-for="c in allColumns" :key="c.name" clickable @click="toggle(c.name)">
            <q-item-section>{{ c.label }}</q-item-section>
            <q-item-section side><q-toggle v-model="cols[c.name]" /></q-item-section>
          </q-item>
        </q-list>
      </q-menu>
    </template>

    <!-- existing body cell slots can be reused verbatim from the page -->
    <slot name="cells" />
  </q-table>
</template>
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { QTableColumn } from 'quasar';
const props = defineProps<{
  rows: any[];
  columns: QTableColumn[];
  density: 'compact'|'comfortable';
  modelValue: any[];
}>();
const emit = defineEmits<{(e:'update:modelValue',v:any[]):void}>();
const selected = ref(props.modelValue);
watch(selected, v => emit('update:modelValue', v));
const colMenu = ref(false);
const cols = ref<Record<string, boolean>>({});
const allColumns = computed(() => props.columns);
const visibleColumns = computed(() => props.columns.filter(c => cols.value[c.name] !== false));
function toggle(name: string){ cols.value[name] = !(cols.value[name] ?? true); localStorage.setItem('cs_columns', JSON.stringify(cols.value)); }
onMounted(()=>{ cols.value = JSON.parse(localStorage.getItem('cs_columns')||'{}') });
</script>
