<template>
  <section
    class="q-pa-md flex flex-center"
    role="region"
    :aria-labelledby="headingId"
  >
    <div class="text-center">
      <q-icon name="gavel" size="4em" color="primary" />
      <h1 :id="headingId" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.slides.terms.title") }}
      </h1>
      <p class="q-mt-sm">
        {{ $t("Welcome.slides.terms.text") }}
        <router-link to="/terms" class="text-primary">
          {{ $t("Welcome.slides.terms.link.label") }}
        </router-link>
      </p>
      <q-checkbox
        v-model="welcomeStore.termsAccepted"
        :label="$t('Welcome.slides.terms.checkbox.label')"
        class="q-mt-md"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useWelcomeStore } from "src/stores/welcome";
const welcomeStore = useWelcomeStore();
defineProps<{ headingId: string }>();
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
