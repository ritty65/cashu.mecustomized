<template>
  <section
    class="q-pa-md flex flex-center"
    role="region"
    :aria-labelledby="headingId"
  >
    <div class="text-center">
      <q-icon name="save_alt" size="4em" color="primary" />
      <h1 :id="headingId" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.slides.backup.title") }}
      </h1>
      <p class="q-mt-sm">{{ $t("Welcome.slides.backup.text") }}</p>
      <q-checkbox
        v-model="welcomeStore.seedAcknowledged"
        :label="$t('Welcome.slides.backup.checkbox.label')"
        class="q-mt-md"
      />
    </div>
  </section>
</template>

<script setup>
import { useWelcomeStore } from "src/stores/welcome";
const welcomeStore = useWelcomeStore();
defineProps<{ headingId: string }>();
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
