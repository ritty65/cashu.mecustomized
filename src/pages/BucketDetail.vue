<template>
  <div class="bg-dark text-white text-center q-pa-md flex flex-center">
    <div style="max-width: 600px; width: 100%">
      <h5 class="q-mt-none q-mb-md">{{ bucket?.name }}</h5>
      <HistoryTable :bucket-id="bucketId" />
    </div>
  </div>
</template>
<script>
import { defineComponent, computed } from "vue";
import { useRoute } from "vue-router";
import { useBucketsStore } from "stores/buckets";
import HistoryTable from "components/HistoryTable.vue";

export default defineComponent({
  name: "BucketDetailPage",
  components: { HistoryTable },
  setup() {
    const route = useRoute();
    const bucketId = route.params.id as string;
    const bucketsStore = useBucketsStore();
    const bucket = computed(() =>
      bucketsStore.bucketList.find((b) => b.id === bucketId)
    );
    return { bucketId, bucket };
  },
});
</script>
