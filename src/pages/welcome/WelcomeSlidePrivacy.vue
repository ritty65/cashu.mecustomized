<template>
  <section role="region" :aria-labelledby="id" class="q-pa-md flex flex-center">
    <div class="text-center">
      <q-icon name="visibility_off" size="4em" color="primary" />
      <h1 :id="id" tabindex="-1" class="q-mt-md">
        {{ $t("Welcome.privacy.title") }}
      </h1>
      <p class="q-mt-sm">{{ $t("Welcome.privacy.lead") }}</p>
      <ul class="q-mt-md text-left" style="display: inline-block">
        <li v-for="(b, i) in $tm('Welcome.privacy.bullets')" :key="i">{{ b }}</li>
      </ul>
      <p class="q-mt-sm">
        <router-link to="/about" class="text-primary">
          {{ $t("Welcome.privacy.ctaLearn") }}
        </router-link>
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
const id = "welcome-privacy-title";
</script>

<style scoped>
h1 {
  font-weight: bold;
}
</style>
