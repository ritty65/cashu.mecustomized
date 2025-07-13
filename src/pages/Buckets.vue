<template>
  <q-page
    class="q-pa-md"
    :class="$q.dark.isActive ? 'bg-dark text-white' : 'bg-white text-dark'"
  >
    <BucketManager />
  </q-page>
</template>

<script>
import { defineComponent } from "vue";
import BucketManager from "components/BucketManager.vue";

export default defineComponent({
  name: "BucketsPage",
  components: {
    BucketManager,
  },
});
</script>
