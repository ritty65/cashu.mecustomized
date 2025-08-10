<template>
  <div class="row q-col-gutter-md q-mb-md">
    <q-card flat bordered class="col-12 col-sm-6 col-md-3 q-pa-sm">
      <div class="text-caption text-grey">Subscribers</div>
      <div class="text-h6">
        <q-skeleton v-if="loading" type="text" width="40%" />
        <span v-else>{{ counts.all.toLocaleString() }}</span>
      </div>
    </q-card>

    <q-card flat bordered class="col-12 col-sm-6 col-md-3 q-pa-sm">
      <div class="text-caption text-grey">Active / Pending</div>
      <div class="text-h6">
        <q-skeleton v-if="loading" type="text" width="60%" />
        <span v-else>{{ active }} / {{ pending }}</span>
      </div>
    </q-card>

    <q-card flat bordered class="col-12 col-sm-6 col-md-3 q-pa-sm">
      <div class="text-caption text-grey">Lifetime revenue</div>
      <div class="text-h6">
        <q-skeleton v-if="loading" type="text" width="70%" />
        <span v-else>{{ lifetime.toLocaleString() }} sat</span>
      </div>
    </q-card>

    <q-card flat bordered class="col-12 col-sm-6 col-md-3 q-pa-sm cursor-pointer" @click="$emit('togglePeriod')">
      <div class="text-caption text-grey">Next {{ period }}</div>
      <div class="text-h6">
        <q-skeleton v-if="loading" type="text" width="50%" />
        <span v-else>{{ upcoming.toLocaleString() }} sat</span>
      </div>
    </q-card>
  </div>
</template>
<script setup lang="ts">
defineProps<{
  loading: boolean;
  counts: { all:number };
  active: number;
  pending: number;
  lifetime: number;
  period: 'week'|'month';
  upcoming: number;
}>();
defineEmits<{ (e:'togglePeriod'): void }>();
</script>
