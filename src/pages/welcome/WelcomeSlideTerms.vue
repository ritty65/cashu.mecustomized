<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="gavel" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.slides.terms.title") }}
      </h1>
      <p class="q-mt-sm">
        <router-link to="/terms" class="text-primary">
          {{ $t("Welcome.slides.terms.link") }}
        </router-link>
      </p>
      <q-checkbox
        class="q-mt-md"
        v-model="welcomeStore.termsAccepted"
        :label="$t('Welcome.slides.terms.checkbox')"
        aria-label="$t('Welcome.slides.terms.checkbox')"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { useWelcomeStore } from "src/stores/welcome";

const welcomeStore = useWelcomeStore();
const id = "welcome-terms-title";
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
