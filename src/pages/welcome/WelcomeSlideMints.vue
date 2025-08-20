<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="factory" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.mints.title") }}
      </h1>
      <p class="q-mt-sm">{{ $t("Welcome.mints.lead") }}</p>
      <ul class="q-mt-md text-left" style="display: inline-block">
        <li v-for="(b, i) in $tm('Welcome.mints.bullets')" :key="i">{{ b }}</li>
      </ul>
      <div class="q-mt-md">
        <q-btn
          color="primary"
          class="q-mb-sm"
          @click="addMint"
          :label="$t('Welcome.mints.ctaPrimary')"
        />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const props = defineProps<{ onAddMint?: () => void }>();
const id = "welcome-mints-title";

function addMint() {
	props.onAddMint?.();
}
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
