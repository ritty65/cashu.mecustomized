<template>
  <!-- guaranteed flex box with height -->
  <div  class="column q-gutter-y-md"  style="min-height:200px;max-width:980px;margin:0 auto">
    <div class="text-body2 q-mb-md">{{ $t("BucketManager.helper.intro") }}</div>
    <q-input
      v-model="search"
      dense
      outlined
      debounce="200"
      :placeholder="$t('bucket.search')"
      clearable
      class="q-mb-md"
    >
      <template #prepend><q-icon name="search" /></template>
    </q-input>
    <q-select
      v-model="sortBy"
      :options="['name', 'balance']"
      dense
      class="q-mb-md"
    />
    <q-list padding>
      <template v-if="!hasUserBuckets">
        <BucketsEmptyState @add="openAdd" />
      </template>

      <template v-else-if="noResults">
        <div class="column items-center text-grey-5 q-pa-md">
          <q-icon name="search_off" size="32px" class="q-mb-xs"/>
          <div class="text-caption">{{ $t('bucket.no_results') }}</div>
        </div>
      </template>

      <template v-else>
        <div v-for="bucket in filteredBuckets"
             :key="bucket.id"
             class="q-mb-md">
          <BucketCard
            :bucket="bucket"
            :balance="bucketBalances[bucket.id] || 0"
            :activeUnit="activeUnit.value"
            @edit="openEdit"
            @delete="openDelete"
            @drop="handleDrop($event, bucket.id)"
          />
        </div>
      </template>
    </q-list>

    <q-page-sticky position="bottom-right" :offset="[32,32]">
      <q-btn fab icon="add" color="primary" glossy unelevated
             :aria-label="$t('BucketManager.actions.add')"
             @click="openAdd"/>
    </q-page-sticky>
    <q-dialog v-model="showForm">
    <q-card class="q-pa-lg" style="max-width: 500px">
      <h6 class="q-mt-none q-mb-md">{{ formTitle }}</h6>
      <q-form ref="bucketForm">
        <q-input
          v-model="form.name"
          outlined
          :rules="nameRules"
          :label="$t('bucket.name')"
          class="q-mb-sm"
        />
        <q-input
          v-model="form.color"
          outlined
          :label="$t('bucket.color')"
          class="q-mb-sm"
          type="color"
        />
        <q-input
          v-model="form.description"
          outlined
          type="textarea"
          autogrow
          class="q-mb-sm"
        >
          <template #label>
            <div class="row items-center no-wrap">
              <span>{{ $t('bucket.description') }}</span>
              <InfoTooltip
                class="q-ml-xs"
                :text="$t('BucketManager.tooltips.description')"
              />
            </div>
          </template>
        </q-input>
        <q-input
          v-model.number="form.goal"
          outlined
          :rules="goalRules"
          type="number"
          class="q-mb-sm"
        >
          <template #label>
            <div class="row items-center no-wrap">
              <span>{{ $t('bucket.goal') }}</span>
              <InfoTooltip
                class="q-ml-xs"
                :text="$t('BucketManager.tooltips.goal')"
              />
            </div>
          </template>
        </q-input>
        <q-input v-model="form.creatorPubkey" outlined class="q-mb-sm">
          <template #label>
            <div class="row items-center no-wrap">
              <span>{{ $t("BucketManager.inputs.creator_pubkey") }}</span>
              <InfoTooltip
                class="q-ml-xs"
                :text="$t('BucketManager.tooltips.creator_pubkey')"
              />
            </div>
          </template>
        </q-input>
        <div class="row q-mt-md">
          <q-btn color="primary" rounded @click="saveBucket">{{
            editId ? $t('global.actions.update.label') : $t('global.actions.save.label')
          }}</q-btn>
          <q-btn flat rounded color="grey" class="q-ml-auto" v-close-popup>{{
            $t("global.actions.cancel.label")
          }}</q-btn>
        </div>
      </q-form>
    </q-card>
    </q-dialog>

    <q-dialog v-model="showDelete">
    <q-card class="q-pa-md" style="max-width: 400px">
      <q-card-section class="row items-center">
        <q-icon name="warning" color="red" size="2rem" />
        <span class="q-ml-sm">{{
          $t("BucketManager.delete_confirm.title")
        }}</span>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat color="grey" v-close-popup>{{
          $t("global.actions.cancel.label")
        }}</q-btn>
        <q-btn color="negative" @click="deleteBucket">{{
          $t("BucketManager.actions.delete")
        }}</q-btn>
      </q-card-actions>
    </q-card>
    </q-dialog>

  </div>
</template>

<script>
import { defineComponent, ref, computed } from "vue";
import { useQuasar } from "quasar";
import { useI18n } from "vue-i18n";
import { useBucketsStore, DEFAULT_BUCKET_ID } from "stores/buckets";
import { useMintsStore } from "stores/mints";
import { useProofsStore } from "stores/proofs";
import { storeToRefs } from "pinia";
import { useUiStore } from "stores/ui";
import { notifyError } from "src/js/notify";
import { DEFAULT_COLOR } from "src/js/constants";
import BucketCard from "./BucketCard.vue";
import BucketsEmptyState from "./BucketsEmptyState.vue";

export default defineComponent({
  name: "BucketManager",
  components: { BucketCard, BucketsEmptyState },
  setup() {
    const $q = useQuasar();
    const bucketsStore = useBucketsStore();
    const uiStore = useUiStore();
    const { t } = useI18n();
    const showForm = ref(false);
    const bucketForm = ref(null);
    const showDelete = ref(false);
    const editId = ref(null);
    const deleteId = ref(null);
    const form = ref({
      name: "",
      color: DEFAULT_COLOR,
      description: "",
      goal: null,
      creatorPubkey: "",
    });

    const bucketList = computed(() => bucketsStore.bucketList);
    const bucketBalances = computed(() => bucketsStore.bucketBalances);
    const search = ref('');
    const sortBy = ref('name');
    const filteredBuckets = computed(() => {
      /* pinia may hydrate after first render – guard against undefined/empty */
      if (!bucketList.value?.length) return [];

      const term = search.value.toLowerCase();
      let arr = bucketList.value.filter((b) =>
        b.name.toLowerCase().includes(term)
      );
      arr = arr.slice().sort((a, b) => {
        if (sortBy.value === 'balance') {
          return (
            (bucketBalances.value[b.id] || 0) -
            (bucketBalances.value[a.id] || 0)
          );
        }
        return a.name.localeCompare(b.name);
      });
      return arr;
    });

    const hasUserBuckets = computed(() =>
      bucketList.value.some((b) => b.id !== DEFAULT_BUCKET_ID)
    );

    const onlyDefaultBucket = computed(
      () =>
        bucketList.value.length === 1 &&
        bucketList.value[0].id === DEFAULT_BUCKET_ID
    );

    const noResults = computed(
      () =>
        hasUserBuckets.value &&
        filteredBuckets.value.length === 0 &&
        search.value.trim().length > 0
    );

    const formatCurrency = (amount, unit) => {
      return uiStore.formatCurrency(amount, unit);
    };

    const mintsStore = useMintsStore();
    const { activeUnit } = storeToRefs(mintsStore);

    const openAdd = () => {
      editId.value = null;
      form.value = {
        name: '',
        color: DEFAULT_COLOR,
        description: '',
        goal: null,
        creatorPubkey: '',
      };
      showForm.value = true;
    };

    const openEdit = (bucket) => {
      editId.value = bucket.id;
      form.value = {
        name: bucket.name,
        color: bucket.color,
        description: bucket.description,
        goal: bucket.goal,
        creatorPubkey: bucket.creatorPubkey || "",
      };
      showForm.value = true;
    };

    const nameRules = [
      (val) =>
        !!val && val.trim().length > 0 && val.trim().length <= 32 ||
        t("BucketManager.validation.name"),
    ];

    const goalRules = [
      (val) =>
        val === null ||
        val === undefined ||
        (typeof val === 'number' && !Number.isNaN(val) && val >= 0) ||
        t("BucketManager.validation.goal"),
    ];

    const proofsStore = useProofsStore();

    const handleDrop = async (ev, id) => {
      ev.preventDefault();
      const data = ev.dataTransfer?.getData("text/plain");
      if (!data) return;
      let secrets;
      try {
        secrets = JSON.parse(data);
      } catch (e) {
        secrets = data.split(",");
      }
      if (Array.isArray(secrets) && secrets.length) {
        await proofsStore.moveProofs(secrets, id);
        if (ev.target && ev.target.classList) {
          ev.target.classList.remove('drag-hover');
        }
        $q.notify({ type: 'positive', message: t('bucket.moved') });
      }
    };

    const saveBucket = async () => {
      const name = form.value.name.trim();
      const goal = form.value.goal;
      if (!name || name.length > 32) {
        notifyError(t("BucketManager.validation.error"));
        return;
      }
      if (
        goal !== null &&
        goal !== undefined &&
        (typeof goal !== 'number' || Number.isNaN(goal) || goal < 0)
      ) {
        notifyError(t("BucketManager.validation.error"));
        return;
      }
      if (editId.value) {
        bucketsStore.editBucket(editId.value, { ...form.value, name });
      } else {
        bucketsStore.addBucket({ ...form.value, name });
      }
      showForm.value = false;
    };

    const openDelete = (id) => {
      deleteId.value = id;
      showDelete.value = true;
    };

    const deleteBucket = () => {
      bucketsStore.deleteBucket(deleteId.value);
      showDelete.value = false;
    };

    return {
      DEFAULT_BUCKET_ID,
      bucketList,
      bucketBalances,
      search,
      sortBy,
      filteredBuckets,
      hasUserBuckets,
      onlyDefaultBucket,
      noResults,
      activeUnit,
      showForm,
      showDelete,
      form,
      bucketForm,
      nameRules,
      goalRules,
      formTitle: computed(() =>
        editId.value ? t('BucketManager.actions.edit') : t('BucketManager.actions.add')
      ),
      openAdd,
      openEdit,
      saveBucket,
      openDelete,
      deleteBucket,
      formatCurrency,
      handleDrop,
      DEFAULT_COLOR,
    };
  },
});
</script>

