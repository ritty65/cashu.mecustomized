<template>
  <div class="q-pa-md">
    <div v-if="bucket">
      <h5 class="q-mb-md">{{ bucket.name }}</h5>
      <q-select
        v-model="targetBucketId"
        :options="bucketOptions"
        emit-value
        map-options
        outlined
        dense
        label="Move to bucket"
        class="q-mb-md"
      />
      <q-btn
        color="primary"
        class="q-mb-md"
        :disable="!selectedSecrets.length || !targetBucketId"
        @click="moveSelected"
      >
        Move
      </q-btn>
      <q-list bordered>
        <q-item v-for="proof in bucketProofs" :key="proof.secret">
          <q-item-section side>
            <q-checkbox v-model="selectedSecrets" :val="proof.secret" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ formatCurrency(proof.amount, activeUnit) }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
    <div v-else>
      <q-item-label>Bucket not found</q-item-label>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useBucketsStore } from 'stores/buckets';
import { useProofsStore } from 'stores/proofs';
import { useMintsStore } from 'stores/mints';
import { useUiStore } from 'stores/ui';

export default defineComponent({
  name: 'BucketDetail',
  setup() {
    const route = useRoute();
    const bucketId = route.params.id;
    const bucketsStore = useBucketsStore();
    const proofsStore = useProofsStore();
    const mintsStore = useMintsStore();
    const uiStore = useUiStore();

    const targetBucketId = ref(null);
    const selectedSecrets = ref([]);

    const bucket = computed(() =>
      bucketsStore.bucketList.find((b) => b.id === bucketId)
    );
    const bucketProofs = computed(() =>
      proofsStore.proofs.filter((p) => p.bucketId === bucketId)
    );
    const bucketOptions = computed(() =>
      bucketsStore.bucketList
        .filter((b) => b.id !== bucketId)
        .map((b) => ({ label: b.name, value: b.id }))
    );

    const formatCurrency = (val, unit) => uiStore.formatCurrency(val, unit);

    const moveSelected = async () => {
      const proofs = bucketProofs.value.filter((p) =>
        selectedSecrets.value.includes(p.secret)
      );
      if (!proofs.length || !targetBucketId.value) return;
      await proofsStore.moveProofs(proofs, targetBucketId.value);
      selectedSecrets.value = [];
    };

    return {
      bucket,
      bucketProofs,
      bucketOptions,
      targetBucketId,
      selectedSecrets,
      moveSelected,
      formatCurrency,
      activeUnit: computed(() => mintsStore.activeUnit),
    };
  },
});
</script>
