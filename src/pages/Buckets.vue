<template>
  <q-page class="column full-height">
    <q-scroll-area
      class="fit bg-grey-10"
      :class="$q.screen.gt.md ? 'q-mx-xl' : 'q-mx-sm'"
    >
      <!-- Manager must stretch so the inner search / empty-state is visible -->
      <div
        class="column q-gutter-y-md"
        style="min-height:200px;max-width:980px;margin:0 auto"
      >
        <BucketManager
          class="q-pa-lg column fit"
          :class="$q.screen.gt.xl ? 'self-center' : ''"
          style="max-width: 1100px"
        />
      </div>
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
