<template>
  <q-card class="q-pa-sm">
    <q-item>
      <q-item-section avatar v-if="creator.profile?.picture">
        <q-avatar>
          <img :src="creator.profile.picture" />
        </q-avatar>
      </q-item-section>
      <q-item-section>
        <q-item-label class="text-weight-bold">
          {{
            creator.profile?.display_name ||
            creator.profile?.name ||
            creator.pubkey
          }}
        </q-item-label>
        <q-item-label caption>{{ creator.pubkey }}</q-item-label>
      </q-item-section>
    </q-item>
  </q-card>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import type { CreatorProfile } from "stores/creators";

export default defineComponent({
  name: "CreatorCard",
  props: {
    creator: {
      type: Object as () => CreatorProfile,
      required: true,
    },
  },
});
</script>
