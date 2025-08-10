<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useCreatorSubscribers } from 'src/stores/creatorSubscribers';
import SubscribersTable from 'src/components/subscribers/SubscribersTable.vue';
import SubscriberCard from 'src/components/subscribers/SubscriberCard.vue';
import SubscriptionsCharts from 'src/components/subscribers/SubscriptionsCharts.vue';
import EmptyState from 'src/components/subscribers/EmptyState.vue';
import SubscriberDrawer from 'src/components/subscribers/SubscriberDrawer.vue';
import { downloadSubscribersCsv } from 'src/utils/subscriberCsv';

const store = useCreatorSubscribers();

const missingEndpoint = computed(
  () => !import.meta.env.VITE_SUBSCRIBERS_ENDPOINT && !localStorage.getItem('creator_npub')
);

const filtered = computed(() => store.filteredSubscribers);

function onExportCsv() {
  downloadSubscribersCsv(
    filtered.value,
    `subscribers_${new Date().toISOString().slice(0, 10)}.csv`
  );
}

onMounted(() => {
  store.fetchSubscribers();
});
</script>

<template>
  <div class="q-pa-md">
    <q-banner
      v-if="missingEndpoint || store.error"
      inline-actions
      class="bg-warning text-black q-mb-md"
    >
      <div class="text-bold">
        {{
          missingEndpoint
            ? 'Set VITE_SUBSCRIBERS_ENDPOINT or localStorage.creator_npub'
            : store.error
        }}
      </div>
      <template #action>
        <q-btn flat label="Retry" @click="store.fetchSubscribers(true)" />
      </template>
    </q-banner>

    <div class="row items-center q-gutter-md q-mb-md">
      <q-btn-toggle
        v-model="store.viewMode"
        @update:model-value="store.setViewMode($event)"
        dense
        :options="[
          { label: 'Table', value: 'table', icon: 'table_chart' },
          { label: 'Cards', value: 'cards', icon: 'grid_on' }
        ]"
      />
      <q-input
        dense
        filled
        debounce="200"
        v-model="store.search"
        placeholder="Search subscribers..."
        class="col-grow"
      />
      <q-btn dense outline icon="refresh" @click="store.fetchSubscribers(true)" />
      <q-btn
        dense
        outline
        icon="download"
        label="Export CSV"
        @click="onExportCsv"
      />
    </div>

    <div class="q-mb-md">
      <div class="row q-col-gutter-md q-mb-md">
        <q-card class="col-12 col-sm-4 q-pa-md">
          <div class="text-caption text-grey">Total subscribers</div>
          <div class="text-h5">{{ store.total }}</div>
        </q-card>
      </div>
      <subscriptions-charts :subscribers="store.subscribers" />
    </div>

    <div v-if="store.loading" class="flex flex-center q-my-xl">
      <q-spinner size="42px" />
    </div>

    <empty-state
      v-else-if="!filtered.length"
      title="No subscribers found"
      subtitle="Once people subscribe, they’ll appear here."
    />

    <div v-else>
      <subscribers-table
        v-if="store.viewMode === 'table'"
        :subscribers="filtered"
        @select="store.select($event?.id || $event?.npub)"
      />
      <div v-else class="row q-col-gutter-md">
        <div
          v-for="s in filtered"
          :key="s.id || s.npub"
          class="col-12 col-sm-6 col-md-4"
        >
          <subscriber-card
            :subscriber="s"
            @click="store.select(s.id || s.npub)"
          />
        </div>
      </div>
    </div>

    <subscriber-drawer
      v-if="store.selectedId"
      :subscriber="store.subscribers.find((s) => (s.id || s.npub) === store.selectedId)"
      @close="store.select(null)"
    />
  </div>
</template>

