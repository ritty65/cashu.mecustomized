<template>
  <q-page padding>
    <SubscriberFiltersPopover ref="filters" />
    <div class="container-xl q-mx-auto q-px-md">
    <q-banner
      v-if="showEndpointBanner"
      class="bg-warning text-black q-mb-md"
      inline-actions
    >
      Set VITE_SUBSCRIBERS_ENDPOINT or localStorage.creator_npub
      <template #action>
        <q-btn
          flat
          dense
          round
          icon="close"
          @click="showEndpointBanner = false"
        />
      </template>
    </q-banner>
    <!-- Toolbar -->
    <q-toolbar class="q-mb-md q-gutter-sm no-wrap">
      <div class="row items-center col-12 col-md-4 no-wrap q-gutter-sm">
        <div class="text-h6">Subscribers</div>
        <q-input
          ref="searchInput"
          dense
          v-model="search"
          placeholder="Search"
          clearable
          class="col"
        >
          <template #prepend><q-icon name="search" /></template>
        </q-input>
      </div>
      <div class="row items-center col-12 col-md-4 justify-center q-gutter-sm">
        <q-btn-toggle v-model="view" toggle-color="primary" :options="viewOpts" aria-label="Change list view" />
        <q-btn-toggle v-model="density" toggle-color="primary" :options="densityOpts" aria-label="Row density" />
      </div>
      <div class="row items-center col-12 col-md-4 justify-end q-gutter-sm">
        <q-btn dense flat round icon="tune" @click.stop="openFilters" aria-label="Filters" />
        <q-btn dense flat round icon="refresh" @click="refresh" aria-label="Refresh" />
        <q-btn
          outline
          color="grey-5"
          icon="download"
          label="Export CSV"
          @click="downloadCsv(undefined, { filenameSuffix: '-filtered' })"
        />
      </div>
    </q-toolbar>
    <q-linear-progress v-if="loading" indeterminate class="q-mb-md" />
    <q-chip v-if="lastUpdated" dense outline color="grey-6" class="q-mb-md">Last updated: {{ lastUpdated }}</q-chip>

    <KpiRow
      :loading="loading"
      :counts="counts"
      :active="activeCount"
      :pending="pendingCount"
      :lifetime="lifetimeRevenue"
      :period="periodMode"
      :upcoming="kpiThisPeriodSat"
      @togglePeriod="togglePeriod"
    />

    <div v-intersection="onChartsIntersection" class="q-mb-md">
      <div v-if="chartsReady" class="row q-col-gutter-md">
        <q-card flat bordered class="col-12 col-lg-5 q-pa-sm">
          <div class="text-subtitle2 q-mb-sm">Revenue over time</div>
          <canvas ref="lineEl" />
        </q-card>
        <q-card flat bordered class="col-12 col-lg-4 q-pa-sm">
          <div class="text-subtitle2 q-mb-sm">Frequency mix</div>
          <canvas ref="doughnutEl" />
        </q-card>
        <q-card flat bordered class="col-12 col-lg-3 q-pa-sm">
          <div class="text-subtitle2 q-mb-sm">Status by frequency</div>
          <canvas ref="barEl" />
        </q-card>
      </div>
    </div>

    <!-- Tabs -->
    <q-tabs v-model="activeTab" dense class="q-mb-md" no-caps>
      <q-tab name="all"
        ><div class="row items-center no-wrap">
          <span>All</span
          ><q-badge class="q-ml-xs" color="primary">{{ counts.all }}</q-badge>
        </div></q-tab
      >
      <q-tab name="weekly"
        ><div class="row items-center no-wrap">
          <span>Weekly</span
          ><q-badge class="q-ml-xs" color="primary">{{
            counts.weekly
          }}</q-badge>
        </div></q-tab
      >
      <q-tab name="biweekly"
        ><div class="row items-center no-wrap">
          <span>Bi-weekly</span
          ><q-badge class="q-ml-xs" color="primary">{{
            counts.biweekly
          }}</q-badge>
        </div></q-tab
      >
      <q-tab name="monthly"
        ><div class="row items-center no-wrap">
          <span>Monthly</span
          ><q-badge class="q-ml-xs" color="primary">{{
            counts.monthly
          }}</q-badge>
        </div></q-tab
      >
      <q-tab name="pending"
        ><div class="row items-center no-wrap">
          <span>Pending</span
          ><q-badge class="q-ml-xs" color="primary">{{
            counts.pending
          }}</q-badge>
        </div></q-tab
      >
      <q-tab name="ended"
        ><div class="row items-center no-wrap">
          <span>Ended</span
          ><q-badge class="q-ml-xs" color="primary">{{ counts.ended }}</q-badge>
        </div></q-tab
      >
    </q-tabs>

    <EmptyState
      v-if="!loading && filtered.length === 0"
      :subtitle="error || 'Try refreshing or connecting your data source.'"
      :show-connect="showConnect"
      :on-retry="() => subStore.hydrate(creatorNpub)"
      @connect="connectDialog = true"
    />

    <!-- Table -->
    <SubscribersTable
      v-else-if="view === 'table'"
      v-model="selected"
      :rows="filtered"
      :columns="columns"
      :density="density"
      :row-class="rowClass"
    >
      <template #body-cell-subscriber="props">
        <q-td :props="props">
          <div class="row items-center q-gutter-sm no-wrap">
            <q-avatar size="32px">{{ initials(props.row.name) }}</q-avatar>
            <div>
              <div class="text-body2">{{ props.row.name }}</div>
              <div class="text-caption text-grey-6">{{ props.row.nip05 }}</div>
            </div>
          </div>
        </q-td>
      </template>
      <template #body-cell-tier="props">
        <q-td :props="props"
          ><q-chip dense color="primary" text-color="white">{{
            props.row.tierName
          }}</q-chip></q-td
        >
      </template>
      <template #body-cell-frequency="props">
        <q-td :props="props"
          ><q-chip dense outline>{{
            freqShort(props.row.frequency)
          }}</q-chip></q-td
        >
      </template>
      <template #body-cell-status="props">
        <q-td :props="props"
          ><q-chip
            dense
            :color="statusColor(props.row.status)"
            text-color="white"
            >{{ props.row.status }}</q-chip
          ></q-td
        >
      </template>
      <template #body-cell-amount="props"
        ><q-td :props="props">{{ props.row.amountSat }} sat</q-td></template
      >
      <template #body-cell-nextRenewal="props">
        <q-td :props="props">
          <div class="row items-center no-wrap q-gutter-sm">
            <div
              class="progress-ring"
              :style="{
                '--progress': progressPercent(props.row),
                '--size': '28px',
                '--thickness': '3px',
                '--progress-ring-fill': `var(--q-${
                  dueSoon(props.row) ? 'warning' : 'primary'
                })`,
              }"
              :data-label="`${progressPercent(props.row)}%`"
              role="progressbar"
              :aria-valuenow="progressPercent(props.row)"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-label="Renewal progress"
            />
            <div class="column">
              <div
                :class="[
                  'text-caption',
                  dueSoon(props.row) ? 'text-warning' : '',
                ]"
              >
                {{
                  props.row.nextRenewal ? distToNow(props.row.nextRenewal) : "—"
                }}
              </div>
              <div class="text-caption text-grey-6">
                {{
                  props.row.nextRenewal ? formatDate(props.row.nextRenewal) : ""
                }}
              </div>
            </div>
          </div>
        </q-td>
      </template>
      <template #body-cell-lifetime="props"
        ><q-td :props="props">{{ props.row.lifetimeSat }} sat</q-td></template
      >
      <template #body-cell-actions="props"
        ><q-td :props="props"
          ><q-btn
            flat
            dense
            round
            icon="chevron_right"
            @click="openDrawer(props.row)" /></q-td
      ></template>
    </SubscribersTable>
    <div v-else class="subscriber-cards">
      <div v-if="loading" class="q-gutter-y-sm">
        <q-skeleton v-for="n in 6" :key="n" type="rect" height="80px" />
      </div>
      <SubscriberCard
        v-else
        v-for="row in filtered"
        :key="row.id"
        :subscription="{ tierName: row.tierName, subscriberNpub: row.npub } as any"
        :status="row.status"
        :next-in="row.nextRenewal ? distToNow(row.nextRenewal) : '—'"
        :progress="progressPercent(row) / 100"
        :amount="row.amountSat + ' sat'"
        :compact="density === 'compact'"
        @click="openDrawer(row)"
      />
    </div>

    <!-- Selection bar -->
    <div
      v-if="selected.length"
      class="q-mt-sm q-pa-sm bg-primary text-white row items-center q-gutter-sm"
    >
      <div>{{ selected.length }} selected</div>
      <q-space />
      <q-btn
        outline
        dense
        color="white"
        icon="download"
        label="Export filtered"
        @click="downloadCsv(undefined, { filenameSuffix: '-filtered' })"
      />
      <q-btn
        outline
        dense
        color="white"
        icon="download"
        label="Export selection"
        @click="downloadCsv(selected, { filenameSuffix: '-selection' })"
      />
      <q-btn v-if="selected.length" outline dense color="white" icon="chat" label="DM selected" @click="dmSelected" />
      <q-btn flat dense color="white" label="Clear" @click="selected = []" />
    </div>

    <!-- Drawer -->
    <q-drawer v-model="drawer" side="right" overlay bordered>
      <div v-if="current" class="q-pa-md">
        <div class="row items-center q-gutter-sm">
          <q-avatar size="64px">{{ initials(current.name) }}</q-avatar>
          <div>
            <div class="text-h6">{{ current.name }}</div>
            <div class="text-body2 text-grey-6">{{ current.nip05 }}</div>
          </div>
        </div>
        <div class="row q-gutter-sm q-mt-md">
          <q-btn outline label="DM" @click="dmSubscriber" />
          <q-btn outline label="Copy npub" @click="copyNpub" />
        </div>
        <q-tabs v-model="drawerTab" dense class="q-mt-md" align="justify" active-color="primary">
          <q-tab name="overview" label="Overview" />
          <q-tab name="payments" label="Payments" />
          <q-tab name="notes" label="Notes" />
          <q-tab name="activity" label="Activity" />
        </q-tabs>
        <q-separator />
        <q-tab-panels v-model="drawerTab" animated>
          <q-tab-panel name="overview">
            <div class="q-mt-md">
              <div>{{ current.amountSat }} sat / {{ current.frequency }}</div>
              <div class="q-mt-sm">Next renewal: {{ current.nextRenewal ? formatDate(current.nextRenewal) : '—' }}</div>
              <div class="q-mt-sm">Lifetime: {{ current.lifetimeSat }} sat</div>
              <div class="q-mt-sm">Since {{ formatDate(current.startDate) }}</div>
            </div>
          </q-tab-panel>
          <q-tab-panel name="payments">
            <div class="row justify-end q-mb-sm">
              <q-btn
                size="sm"
                dense
                flat
                round
                icon="download"
                @click="exportCurrentCsv"
              />
            </div>
            <q-list bordered dense>
              <q-item v-for="p in payments" :key="p.ts">
                <q-item-section>{{ formatDate(p.ts) }}</q-item-section>
                <q-item-section side>
                  <div class="row items-center no-wrap q-gutter-xs">
                    <q-chip dense :color="paymentStatusColor(p.status)" text-color="white">{{ p.status }}</q-chip>
                    <span>{{ p.amountSat }} sat</span>
                  </div>
                </q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
          <q-tab-panel name="notes">
            <q-input v-model="noteText" type="textarea" autogrow />
          </q-tab-panel>
          <q-tab-panel name="activity">
            <q-list bordered dense>
              <q-item v-for="a in activity" :key="a.ts">
                <q-item-section>{{ a.text }}</q-item-section>
                <q-item-section side class="text-caption text-grey">{{ distToNow(a.ts) }}</q-item-section>
              </q-item>
            </q-list>
          </q-tab-panel>
        </q-tab-panels>
      </div>
    </q-drawer>
    <q-dialog v-model="connectDialog">
      <q-card class="q-pa-md" style="max-width:300px">
        <div class="text-subtitle2 q-mb-sm">Data source not configured</div>
        <div class="text-caption q-mb-md">Set VITE_SUBSCRIBERS_ENDPOINT at build time or define localStorage.creator_npub for testing.</div>
        <q-btn size="sm" outline label="Copy variable name" @click="$q.clipboard.writeText('VITE_SUBSCRIBERS_ENDPOINT')" />
      </q-card>
    </q-dialog>
  </div>
  </q-page>
</template>

<script setup lang="ts">
// Chart.js will be imported lazily when charts become visible
import type { Chart } from 'chart.js';

import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useCreatorSubscribersStore } from "src/stores/creatorSubscribers";
import { storeToRefs } from "pinia";
import { useDebounceFn } from "@vueuse/core";
import { format, formatDistanceToNow } from "date-fns";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import type { Subscriber, Frequency, SubStatus } from "src/types/subscriber";
import downloadCsv from "src/utils/subscriberCsv";
import SubscriberFiltersPopover from "src/components/subscribers/SubscriberFiltersPopover.vue";
import SubscriberCard from "src/components/SubscriberCard.vue";
import KpiRow from "src/components/subscribers/KpiRow.vue";
import EmptyState from "src/components/subscribers/EmptyState.vue";
import SubscribersTable from "src/components/subscribers/SubscribersTable.vue";

const subStore = useCreatorSubscribersStore();
const { filtered, counts, activeTab, loading, error } = storeToRefs(subStore);
const showEndpointBanner = ref(!import.meta.env.VITE_SUBSCRIBERS_ENDPOINT);
const showConnect = !import.meta.env.VITE_SUBSCRIBERS_ENDPOINT;
const creatorNpub =
  localStorage.getItem('creator_npub') || import.meta.env.VITE_CREATOR_NPUB || '';

onMounted(async () => {
  subStore.setSource();
  const savedTab = localStorage.getItem('cs_tab');
  if (savedTab) subStore.setActiveTab(savedTab as any);
  if (creatorNpub) await subStore.hydrate(creatorNpub);
});
watch(activeTab, v => localStorage.setItem('cs_tab', v));
// `filtered` is maintained by the Pinia store based on the active tab,
// search query and filter popover. Treat it as the single source of truth
// for the subscriber list and KPI counts throughout this page.

const activeCount = computed(
  () => filtered.value.filter((s) => s.status === "active").length
);
const pendingCount = computed(
  () => filtered.value.filter((s) => s.status === "pending").length
);
// Lifetime sats are included in the KPI row. Safeguard against undefined
// values in case the field is missing from older data snapshots.
const lifetimeRevenue = computed(() =>
  filtered.value.reduce(
    (sum, s) => sum + (typeof s.lifetimeSat === "number" ? s.lifetimeSat : 0),
    0,
  ),
);

// Controls the "Next week/month" KPI card. Clicking the card swaps
// `periodMode` to show upcoming revenue for the next 7 vs 30 days.
const periodMode = ref<"week" | "month">("month");
const periodWindowDays = computed(() => (periodMode.value === "week" ? 7 : 30));
// Aggregate expected sats from subscriptions that renew inside the
// selected window. This feeds the final KPI card.
const kpiThisPeriodSat = computed(() => {
  const now = Date.now() / 1000;
  const end = now + periodWindowDays.value * 86400;
  return filtered.value
    .filter(
      (s) =>
        s.status === "active" &&
        typeof s.nextRenewal === "number" &&
        s.nextRenewal <= end,
    )
    .reduce(
      (sum, s) => sum + (typeof s.amountSat === "number" ? s.amountSat : 0),
      0,
    );
});
const formattedKpiThisPeriodSat = computed(() =>
  kpiThisPeriodSat.value.toLocaleString()
);

function togglePeriod() {
  // Toggle between week and month views when the KPI card is clicked.
  periodMode.value = periodMode.value === "week" ? "month" : "week";
}

// Data plumbing for charts: build lightweight structures consumed by Chart.js.
const revenueSeries = computed(() => {
  // Line chart: each subscriber's start date vs amount.
  const arr = filtered.value.slice().sort((a, b) => a.startDate - b.startDate);
  return {
    labels: arr.map((s) => format(s.startDate * 1000, "MM/dd")),
    data: arr.map((s) => s.amountSat),
  };
});

const freqMix = computed(() => [
  // Doughnut chart: breakdown of subscribers by frequency.
  filtered.value.filter((s) => s.frequency === "weekly").length,
  filtered.value.filter((s) => s.frequency === "biweekly").length,
  filtered.value.filter((s) => s.frequency === "monthly").length,
]);

const statusByFreq = computed(() => {
  // Bar chart: counts of active/pending/ended subscriptions per frequency.
  const freqs: Frequency[] = ["weekly", "biweekly", "monthly"];
  const labels = ["Weekly", "Bi-weekly", "Monthly"];
  const active = freqs.map(
    (f) =>
      filtered.value.filter((s) => s.frequency === f && s.status === "active")
        .length
  );
  const pending = freqs.map(
    (f) =>
      filtered.value.filter((s) => s.frequency === f && s.status === "pending")
        .length
  );
  const ended = freqs.map(
    (f) =>
      filtered.value.filter((s) => s.frequency === f && s.status === "ended")
        .length
  );
  return { labels, active, pending, ended };
});

const search = ref(subStore.query);
const applySearch = useDebounceFn((v: string) => {
  subStore.query = v;
}, 300);
watch(search, (v) => applySearch(v));

const filters = ref<InstanceType<typeof SubscriberFiltersPopover> | null>(null);
function openFilters(e: MouseEvent) { filters.value?.show(e); }

const selected = ref<Subscriber[]>([]);

const view = ref<'table' | 'cards'>((localStorage.getItem('cs_view') as 'table' | 'cards') || 'table');
const density = ref<'compact' | 'comfortable'>((localStorage.getItem('cs_density') as 'compact' | 'comfortable') || 'comfortable');
const viewOpts = [
  { label: 'Table', icon: 'table_rows', value: 'table' },
  { label: 'Cards', icon: 'grid_view', value: 'cards' },
];
const densityOpts = [
  { label: 'Comfy', icon: 'view_comfy', value: 'comfortable' },
  { label: 'Compact', icon: 'view_compact', value: 'compact' },
];
watch(view, v => localStorage.setItem('cs_view', v));
watch(density, v => localStorage.setItem('cs_density', v));

const searchInput = ref<HTMLInputElement>();
function refresh() { subStore.hydrate(creatorNpub); }

const lastUpdated = computed(() =>
  subStore.lastHydratedAt
    ? formatDistanceToNow(subStore.lastHydratedAt, { addSuffix: true })
    : ''
);

function onKey(e: KeyboardEvent) {
  if (e.key === '/' && !e.metaKey) { e.preventDefault(); searchInput.value?.focus(); }
  if (e.key === 'f') { e.preventDefault(); openFilters(new MouseEvent('click')); }
  if (e.key === 'r') { e.preventDefault(); refresh(); }
}
onMounted(() => window.addEventListener('keydown', onKey));
onBeforeUnmount(() => window.removeEventListener('keydown', onKey));

const lineEl = ref<HTMLCanvasElement | null>(null);
const doughnutEl = ref<HTMLCanvasElement | null>(null);
const barEl = ref<HTMLCanvasElement | null>(null);
let lineChart: Chart | null = null;
let doughnutChart: Chart | null = null;
let barChart: Chart | null = null;
const chartsReady = ref(false);

async function onChartsIntersection(entry: any) {
  if (!entry.isIntersecting || chartsReady.value) return;
  chartsReady.value = true;
  const { Chart } = await import('chart.js/auto');
  lineChart = new Chart(lineEl.value as HTMLCanvasElement, {
    type: 'line',
    data: {
      labels: revenueSeries.value.labels,
      datasets: [
        {
          data: revenueSeries.value.data,
          borderColor: '#027be3',
          backgroundColor: 'rgba(2,123,227,0.1)',
          fill: false,
          pointRadius: 0,
        },
      ],
    },
    options: { plugins: { legend: { display: false } }, animation: false },
  });
  doughnutChart = new Chart(doughnutEl.value as HTMLCanvasElement, {
    type: 'doughnut',
    data: {
      labels: ['Weekly', 'Bi-weekly', 'Monthly'],
      datasets: [
        {
          data: freqMix.value,
          backgroundColor: ['#027be3', '#26a69a', '#9c27b0'],
        },
      ],
    },
    options: { plugins: { legend: { display: false } }, animation: false },
  });
  barChart = new Chart(barEl.value as HTMLCanvasElement, {
    type: 'bar',
    data: {
      labels: statusByFreq.value.labels,
      datasets: [
        { label: 'Active', backgroundColor: '#21ba45', data: statusByFreq.value.active },
        { label: 'Pending', backgroundColor: '#f2c037', data: statusByFreq.value.pending },
        { label: 'Ended', backgroundColor: '#f44336', data: statusByFreq.value.ended },
      ],
    },
    options: { plugins: { legend: { display: false } }, animation: false },
  });
}

// When the underlying computed data changes, update the charts without
// re-creating them. This keeps Chart.js lifecycle simple and avoids leaks.
watch([revenueSeries, freqMix, statusByFreq], ([rev, mix, status]) => {
  if (lineChart) {
    lineChart.data.labels = rev.labels;
    lineChart.data.datasets[0].data = rev.data;
    lineChart.update("none");
  }
  if (doughnutChart) {
    doughnutChart.data.datasets[0].data = mix;
    doughnutChart.update("none");
  }
  if (barChart) {
    barChart.data.labels = status.labels;
    barChart.data.datasets[0].data = status.active;
    barChart.data.datasets[1].data = status.pending;
    barChart.data.datasets[2].data = status.ended;
    barChart.update("none");
  }
});

const columns = [
  { name: "subscriber", label: "Subscriber", field: "name", sortable: false },
  { name: "tier", label: "Tier", field: "tierName", sortable: false },
  { name: "frequency", label: "Freq", field: "frequency", sortable: false },
  { name: "status", label: "Status", field: "status", sortable: false },
  { name: "amount", label: "Amount", field: "amountSat", sortable: false },
  {
    name: "nextRenewal",
    label: "Next renewal",
    field: "nextRenewal",
    sortable: false,
  },
  {
    name: "lifetime",
    label: "Lifetime",
    field: "lifetimeSat",
    sortable: false,
  },
  { name: "actions", label: "", field: "id", sortable: false },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
function freqShort(f: Frequency) {
  return f === "weekly" ? "W" : f === "biweekly" ? "2W" : "M";
}
function statusColor(s: SubStatus) {
  return s === "active" ? "positive" : s === "pending" ? "warning" : "negative";
}
function paymentStatusColor(s: string | undefined) {
  return s === 'settled' ? 'positive' : s === 'failed' ? 'negative' : 'warning';
}
function progressPercent(r: Subscriber) {
  if (!r.nextRenewal) return 0;
  const days =
    r.frequency === "weekly" ? 7 : r.frequency === "biweekly" ? 14 : 30;
  const end = r.nextRenewal * 1000;
  const start = end - days * 86400000;
  const now = Date.now();
  return Math.round(
    Math.min(Math.max((now - start) / (end - start), 0), 1) * 100
  );
}
function dueSoon(r: Subscriber) {
  if (!r.nextRenewal || r.status !== "active") return false;
  return r.nextRenewal * 1000 - Date.now() < 72 * 3600 * 1000;
}
function rowClass(row: Subscriber) {
  return dueSoon(row) ? "due-soon" : "";
}
function distToNow(ts: number) {
  return formatDistanceToNow(ts * 1000, { addSuffix: true });
}
function formatDate(ts: number) {
  return format(ts * 1000, "PP p");
}

const drawer = ref(false);
const current = ref<Subscriber | null>(null);
const drawerTab = ref<'overview'|'payments'|'notes'|'activity'>('overview');
const payments = computed(() => current.value?._payments ?? []);
const noteText = ref('');
async function openDrawer(r: Subscriber) {
  current.value = r; drawer.value = true; drawerTab.value = 'overview';
  noteText.value = subStore.notes[r.npub] || '';
  if (!('_payments' in r)) {
    const list = await subStore.fetchPayments(r.npub);
    (r as any)._payments = list;
  }
}
watch(noteText, v => { if (current.value) subStore.setNote(current.value.npub, v); });
const $q = useQuasar();
const router = useRouter();
const { t } = useI18n();

function copyNpub() {
  if (!current.value) return;
  $q.clipboard.writeText(current.value.npub);
  $q.notify({ message: t("copied_to_clipboard"), color: "positive" });
}

function dmSubscriber() {
  if (!current.value) return;
  router.push({
    path: "/nostr-messenger",
    query: { pubkey: current.value.npub },
  });
}
function dmSelected() {
  if (!selected.value.length) return;
  const keys = selected.value.map(r => r.npub).join(',');
  router.push({ path: '/nostr-messenger', query: { pubkeys: keys } });
}
function exportCurrentCsv() {
  const c = current.value;
  if (c) {
    downloadCsv([c], { filenameSuffix: `-subscriber-${c.npub}` });
  }
}
const activity = computed(() => {
  const r = current.value;
  if (!r) return [] as any[];
  const arr = [{ ts: r.startDate, text: "Started subscription" }];
  if (r.nextRenewal) arr.push({ ts: r.nextRenewal, text: "Next renewal" });
  return arr;
});
const connectDialog = ref(false);
</script>
