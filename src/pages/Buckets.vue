<template>
  <q-page class="column full-height">
    <q-scroll-area
      class="fit bg-grey-10"
      :class="$q.screen.gt.md ? 'q-mx-xl' : 'q-mx-sm'"
    >
      <BucketManager class="q-pa-lg" />
    </q-scroll-area>
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
