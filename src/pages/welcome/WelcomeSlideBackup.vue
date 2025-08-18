<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="warning" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.slides.backup.title") }}
      </h1>
      <p class="q-mt-sm">{{ $t("Welcome.slides.backup.text") }}</p>
      <q-checkbox
        class="q-mt-md"
        v-model="welcomeStore.seedAcknowledged"
        :label="$t('Welcome.slides.backup.checkbox')"
        aria-label="$t('Welcome.slides.backup.checkbox')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useWelcomeStore } from "src/stores/welcome";

const welcomeStore = useWelcomeStore();
const id = "welcome-backup-title";
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
