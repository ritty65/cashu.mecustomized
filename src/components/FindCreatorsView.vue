<template>
  <div style="max-width: 800px; margin: 0 auto">
    <q-input
      rounded
      outlined
      dense
      v-model="searchInput"
      :label="$t('FindCreators.inputs.search.label')"
      :placeholder="$t('FindCreators.inputs.search.placeholder')"
      @keydown.enter.prevent="triggerSearch"
    >
      <template v-slot:append>
        <q-icon name="search" class="cursor-pointer" @click="triggerSearch" />
      </template>
    </q-input>

    <div v-if="searching" class="q-mt-md flex flex-center column items-center">
      <q-spinner-dots color="primary" />
      <div class="q-mt-sm">{{ $t("FindCreators.messages.loading") }}</div>
    </div>
    <div v-else-if="error" class="q-mt-md text-negative text-bold">
      {{ error }}
    </div>
    <div
      v-else-if="!searchResults.length && searchInput"
      class="q-mt-md text-grey text-center"
    >
      {{ $t("FindCreators.messages.no_results") }}
    </div>
    <div
      v-else-if="!searchResults.length"
      class="q-mt-md text-grey text-center"
    >
      {{ $t("FindCreators.messages.empty") }}
    </div>

    <div v-if="searchResults.length" class="row q-col-gutter-md q-mt-md">
      <div
        v-for="creator in searchResults"
        :key="creator.pubkey"
        class="col-12 col-sm-6 col-md-4"
      >
        <CreatorCard :creator="creator" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from "vue";
import { useCreatorsStore } from "stores/creators";
import { storeToRefs } from "pinia";
import CreatorCard from "./CreatorCard.vue";

export default defineComponent({
  name: "FindCreatorsView",
  components: { CreatorCard },
  setup() {
    const creatorsStore = useCreatorsStore();
    const { searchResults, searching, error } = storeToRefs(creatorsStore);
    const searchInput = ref("");

    const triggerSearch = () => {
      if (searchInput.value.trim()) {
        creatorsStore.searchCreators(searchInput.value.trim());
      }
    };

    let debounceTimeout: number | undefined;
    watch(searchInput, (val) => {
      if (!val) {
        return;
      }
      clearTimeout(debounceTimeout);
      debounceTimeout = window.setTimeout(() => {
        creatorsStore.searchCreators(val);
      }, 500);
    });

    return {
      searchInput,
      triggerSearch,
      searchResults,
      searching,
      error,
    };
  },
});
</script>
